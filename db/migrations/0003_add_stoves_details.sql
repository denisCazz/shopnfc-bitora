-- Aggiunge campi dettaglio alle stufe (categoria, potenza, dimensioni, peso)
-- Applica sul VPS:
--   psql "$DATABASE_URL" -f db/migrations/0003_add_stoves_details.sql

ALTER TABLE stoves
  ADD COLUMN IF NOT EXISTS categoria  TEXT,
  ADD COLUMN IF NOT EXISTS potenza    TEXT,
  ADD COLUMN IF NOT EXISTS dimensioni TEXT,
  ADD COLUMN IF NOT EXISTS peso       TEXT;
