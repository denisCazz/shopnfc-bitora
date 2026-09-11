-- ============================================================
-- Import dati esportati da Supabase → PostgreSQL VPS
-- ============================================================
-- Prerequisiti:
--   1. Schema applicato: psql "$DATABASE_URL" -f db/migrations/0000_vps_standalone.sql
--   2. I file CSV si trovano nella cartella ex_supabase/ nella root del progetto
--   3. Lanciare dalla root del progetto:
--        psql "$DATABASE_URL" -f scripts/import-supabase-data.sql
--
-- ATTENZIONE: le tabelle vengono svuotate prima dell'import.
--             Usare solo su un DB appena creato.
-- ============================================================

-- Disabilita trigger e FK durante l'import per evitare errori di ordine
SET session_replication_role = replica;

-- ============================================================
-- 1. Admin user
-- ============================================================
INSERT INTO app_users (id, email, password_hash, email_verified_at)
VALUES (
  gen_random_uuid(),
  'deniscazzulo@icloud.com',
  '$2b$10$KkZfcl2Cn.BGBiQKlXvga.QxM9dPEWZsNDcWVc12QxMZMSTAxEwzK',
  now()
)
ON CONFLICT (email) DO UPDATE
  SET password_hash     = EXCLUDED.password_hash,
      email_verified_at = EXCLUDED.email_verified_at;

INSERT INTO profiles (id, email, first_name, last_name, role)
SELECT id, email, 'Denis', 'Cazzulo', 'admin'
FROM app_users
WHERE email = 'deniscazzulo@icloud.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

-- ============================================================
-- 2. categories
-- ============================================================
CREATE TEMP TABLE _categories_import (
  id         INT,
  name_it    TEXT,
  name_en    TEXT,
  name_fr    TEXT,
  name_es    TEXT,
  slug       TEXT,
  icon       TEXT,
  sort_order INT,
  active     BOOLEAN
);

\COPY _categories_import FROM 'ex_supabase/categories_rows.csv' WITH (FORMAT CSV, HEADER true, NULL '');

INSERT INTO categories (id, name_it, name_en, name_fr, name_es, slug, icon, sort_order, active)
SELECT id, name_it, name_en, name_fr, name_es, slug, NULLIF(icon,''), sort_order, active
FROM _categories_import
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. products
-- ============================================================
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
  search_vector         TEXT  -- colonna generata su Supabase, ignorata nell'INSERT
);

\COPY _products_import FROM 'ex_supabase/products_rows.csv' WITH (FORMAT CSV, HEADER true, NULL '');

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

-- ============================================================
-- 4. product_images
-- ============================================================
CREATE TEMP TABLE _product_images_import (
  id          INT,
  product_id  INT,
  image_url   TEXT,
  sort_order  INT,
  alt_text    TEXT,
  created_at  TIMESTAMPTZ
);

\COPY _product_images_import FROM 'ex_supabase/product_images_rows.csv' WITH (FORMAT CSV, HEADER true, NULL '');

INSERT INTO product_images (id, product_id, image_url, sort_order, alt_text, created_at)
SELECT id, product_id, image_url, sort_order, NULLIF(alt_text,''), created_at
FROM _product_images_import
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Riabilita FK e trigger
-- ============================================================
SET session_replication_role = DEFAULT;

-- ============================================================
-- Reset sequenze (obbligatorio dopo INSERT con ID espliciti)
-- ============================================================
SELECT setval('categories_id_seq',     GREATEST((SELECT COALESCE(MAX(id), 0) FROM categories), 1));
SELECT setval('products_id_seq',       GREATEST((SELECT COALESCE(MAX(id), 0) FROM products), 1));
SELECT setval('product_images_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM product_images), 1));
SELECT setval('orders_id_seq',         1);
SELECT setval('order_items_id_seq',    1);
SELECT setval('cart_items_id_seq',     1);

-- ============================================================
-- Riepilogo finale
-- ============================================================
SELECT
  'app_users'     AS tabella, COUNT(*) AS righe FROM app_users     UNION ALL
  SELECT 'profiles',           COUNT(*) FROM profiles              UNION ALL
  SELECT 'categories',         COUNT(*) FROM categories            UNION ALL
  SELECT 'products',           COUNT(*) FROM products              UNION ALL
  SELECT 'product_images',     COUNT(*) FROM product_images        UNION ALL
  SELECT 'orders',             COUNT(*) FROM orders
ORDER BY tabella;
