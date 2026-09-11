-- Site announcements (popup avvisi)
-- psql "$DATABASE_URL" -f db/migrations/0009_announcements.sql

DO $$ BEGIN
  CREATE TYPE announcement_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_audience AS ENUM ('users', 'admin', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_schedule_mode AS ENUM ('always', 'range');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id            SERIAL PRIMARY KEY,
  message_it    TEXT NOT NULL,
  message_en    TEXT,
  message_fr    TEXT,
  message_es    TEXT,
  severity      announcement_severity NOT NULL DEFAULT 'info',
  audience      announcement_audience NOT NULL DEFAULT 'users',
  schedule_mode announcement_schedule_mode NOT NULL DEFAULT 'always',
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (active);
