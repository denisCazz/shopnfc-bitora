-- Aggiungi tabelle per l'elenco stufe e la compatibilità prodotti
-- Applica sul VPS:
--   psql "$DATABASE_URL" -f db/migrations/0002_add_stoves.sql

CREATE TABLE IF NOT EXISTS stoves (
  id          SERIAL PRIMARY KEY,
  name_it     TEXT NOT NULL,
  name_en     TEXT,
  name_fr     TEXT,
  name_es     TEXT,
  slug        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_stoves (
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stove_id    INTEGER NOT NULL REFERENCES stoves(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, stove_id)
);

CREATE INDEX IF NOT EXISTS idx_product_stoves_product ON product_stoves(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stoves_stove ON product_stoves(stove_id);
