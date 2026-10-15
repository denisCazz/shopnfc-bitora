import { Pool } from "pg";

const globalForMigration = globalThis as unknown as {
  __shopnfcMigrationPromise?: Promise<void>;
};

const AUTO_MIGRATE_SQL = `
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

export function ensureDatabaseMigrated(): Promise<void> {
  if (globalForMigration.__shopnfcMigrationPromise) {
    return globalForMigration.__shopnfcMigrationPromise;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return Promise.resolve();
  }

  globalForMigration.__shopnfcMigrationPromise = (async () => {
    const pool = new Pool({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 8000,
    });
    try {
      const reg = await pool.query(
        "SELECT to_regclass('public.orders') AS has_orders"
      );
      if (reg.rows[0]?.has_orders) {
        await pool.query(AUTO_MIGRATE_SQL);
        console.log("[db] Schema PostgreSQL verificato e aggiornato all'avvio.");
      }
    } catch (err) {
      console.warn(
        "[db] Impossibile eseguire auto-migrazione all'avvio:",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      await pool.end().catch(() => {});
    }
  })();

  return globalForMigration.__shopnfcMigrationPromise;
}
