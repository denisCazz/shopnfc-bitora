-- Listino fornitore (catalogo) vs prezzo vetrina = catalogo × ricarico globale.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS catalog_price numeric(10, 2);

UPDATE products
SET catalog_price = price
WHERE catalog_price IS NULL;

INSERT INTO app_settings (key, value)
VALUES ('pricing', '{"markup": 1.8}'::jsonb)
ON CONFLICT (key) DO NOTHING;
