#!/usr/bin/env node
/**
 * Script di migrazione automatica del database per il deploy (Docker, VPS, build e start).
 * Applica in modo idempotente:
 * 1) Lo schema iniziale (0000_vps_standalone.sql) se il database è vuoto.
 * 2) Tutte le migrazioni incrementali in db/migrations/*.sql (0001, 0002, 0003, ecc.).
 * 3) La verifica strutturale di sicurezza per tutte le tabelle/colonne recenti.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const skipIfNoDb = process.argv.includes("--if-db");

function loadEnvFileIfNeeded() {
  if (process.env.DATABASE_URL) return;
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(ROOT, name);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const FALLBACK_IDEMPOTENT_SQL = `
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percent', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_audience AS ENUM ('users', 'admin', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_schedule_mode AS ENUM ('always', 'range');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type discount_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes (active);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  message_it TEXT NOT NULL,
  message_en TEXT,
  message_fr TEXT,
  message_es TEXT,
  severity announcement_severity NOT NULL DEFAULT 'info',
  audience announcement_audience NOT NULL DEFAULT 'users',
  schedule_mode announcement_schedule_mode NOT NULL DEFAULT 'always',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (active);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS custom_graphic_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_graphic_original_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_graphic_disclaimer_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_code_id INT REFERENCES discount_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_redeemed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'order_received',
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS graphic_status TEXT DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS graphic_note TEXT,
  ADD COLUMN IF NOT EXISTS supplier_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery TEXT,
  ADD COLUMN IF NOT EXISTS public_tracking_note TEXT,
  ADD COLUMN IF NOT EXISTS tracking_history JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS custom_trackings (
  code TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_company TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  items_summary TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  has_custom_print BOOLEAN NOT NULL DEFAULT true,
  tracking_status TEXT NOT NULL DEFAULT 'order_received',
  graphic_status TEXT NOT NULL DEFAULT 'in_review',
  graphic_note TEXT,
  supplier_preview_url TEXT,
  carrier TEXT NOT NULL DEFAULT 'auto',
  carrier_tracking_number TEXT,
  estimated_delivery TEXT,
  shipping_city TEXT,
  shipping_country TEXT DEFAULT 'Italia',
  public_note TEXT,
  internal_note TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_trackings_carrier_num ON custom_trackings (carrier_tracking_number);
`;

async function runMigrations() {
  loadEnvFileIfNeeded();
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    if (skipIfNoDb) {
      console.log("[db:migrate] DATABASE_URL non impostato, salto migrazione pre-build.");
      return;
    }
    console.error("[db:migrate] ERRORE: DATABASE_URL non impostato.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    max: 2,
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    if (skipIfNoDb) {
      console.warn(
        "[db:migrate] Database non raggiungibile in questa fase, proseguo:",
        err instanceof Error ? err.message : String(err)
      );
      await pool.end().catch(() => {});
      return;
    }
    throw err;
  }

  try {
    // Advisory lock per evitare collisioni in caso di avvio parallelo di più istanze
    await client.query("SELECT pg_advisory_lock(79082026)");

    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const regRes = await client.query(
      "SELECT to_regclass('public.app_users') AS reg"
    );
    const hasBaseSchema = Boolean(regRes.rows[0]?.reg);

    const migrationsDir = path.join(ROOT, "db", "migrations");
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      for (const file of files) {
        if (file === "0000_vps_standalone.sql" && hasBaseSchema) {
          await client.query(
            `INSERT INTO _schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
            [file]
          );
          continue;
        }

        const sqlText = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        console.log(`[db:migrate] Applico migrazione: ${file}`);
        await client.query(sqlText);
        await client.query(
          `INSERT INTO _schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO UPDATE SET applied_at = now()`,
          [file]
        );
      }
    }

    // Eseguiamo sempre la verifica strutturale idempotente per garantire l'allineamento dello schema
    await client.query(FALLBACK_IDEMPOTENT_SQL);
    console.log("[db:migrate] Database aggiornato e allineato con successo.");
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(79082026)");
    } catch {
      // ignore unlock errors
    }
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("[db:migrate] Errore durante la migrazione database:", err);
  process.exit(1);
});
