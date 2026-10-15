-- Tracking avanzato ordini, stati preview grafica fornitore e ordini clienti diretti extra-sito (idempotente).

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

DROP TRIGGER IF EXISTS custom_trackings_updated_at ON custom_trackings;
CREATE TRIGGER custom_trackings_updated_at
  BEFORE UPDATE ON custom_trackings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
