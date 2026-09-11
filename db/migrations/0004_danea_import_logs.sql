-- Log import catalogo Danea (POST /api/danea/products)
-- psql "$DATABASE_URL" -f db/migrations/0004_danea_import_logs.sql

CREATE TABLE IF NOT EXISTS danea_import_logs (
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success    BOOLEAN NOT NULL,
  source     TEXT NOT NULL DEFAULT 'catalog',
  mode       TEXT,
  message    TEXT,
  stats      JSONB,
  xml_bytes  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_danea_import_logs_created
  ON danea_import_logs (created_at DESC);
