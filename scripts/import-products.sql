-- Import solo prodotti (fix colonna search_vector)
SET session_replication_role = replica;

CREATE TEMP TABLE _products_import (
  id                    INT,
  category_id           INT,
  sku                   TEXT,
  ean13                 TEXT,
  name_it               TEXT,
  name_en               TEXT,
  name_fr               TEXT,
  name_es               TEXT,
  description_it        TEXT,
  description_en        TEXT,
  description_fr        TEXT,
  description_es        TEXT,
  description_short_it  TEXT,
  description_short_en  TEXT,
  description_short_fr  TEXT,
  description_short_es  TEXT,
  slug                  TEXT,
  price                 NUMERIC,
  wholesale_price       NUMERIC,
  weight                NUMERIC,
  width                 NUMERIC,
  height                NUMERIC,
  depth                 NUMERIC,
  stock_quantity        INT,
  active                BOOLEAN,
  brand                 TEXT,
  meta_title            TEXT,
  meta_description      TEXT,
  meta_keywords         TEXT,
  image_url             TEXT,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  search_vector         TEXT
);

\COPY _products_import FROM 'ex_supabase/products_rows_utf8.csv' WITH (FORMAT CSV, HEADER true, NULL '');

INSERT INTO products (id, category_id, sku, ean13, name_it, name_en, name_fr, name_es,
  description_it, description_en, description_fr, description_es,
  description_short_it, description_short_en, description_short_fr, description_short_es,
  slug, price, wholesale_price, weight, width, height, depth,
  stock_quantity, active, brand, meta_title, meta_description, meta_keywords,
  image_url, created_at, updated_at)
SELECT id, category_id, NULLIF(sku,''), NULLIF(ean13,''),
  name_it, NULLIF(name_en,''), NULLIF(name_fr,''), NULLIF(name_es,''),
  NULLIF(description_it,''), NULLIF(description_en,''), NULLIF(description_fr,''), NULLIF(description_es,''),
  NULLIF(description_short_it,''), NULLIF(description_short_en,''), NULLIF(description_short_fr,''), NULLIF(description_short_es,''),
  slug, price, wholesale_price, weight, width, height, depth,
  stock_quantity, active,
  NULLIF(brand,''), NULLIF(meta_title,''), NULLIF(meta_description,''), NULLIF(meta_keywords,''),
  NULLIF(image_url,''), created_at, updated_at
FROM _products_import
ON CONFLICT (id) DO NOTHING;

SET session_replication_role = DEFAULT;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT COUNT(*) AS products_imported FROM products;
