-- Log export ordini Danea (GET /api/danea/orders)
-- psql "$DATABASE_URL" -f db/migrations/0005_danea_orders_export_logs.sql

CREATE TABLE IF NOT EXISTS danea_orders_export_logs (
  id           SERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success      BOOLEAN NOT NULL,
  order_count  INTEGER NOT NULL DEFAULT 0,
  order_ids    JSONB,
  firstdate    TEXT,
  lastdate     TEXT,
  message      TEXT
);

CREATE INDEX IF NOT EXISTS idx_danea_orders_export_logs_created
  ON danea_orders_export_logs (created_at DESC);
