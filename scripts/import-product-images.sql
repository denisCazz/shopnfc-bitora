CREATE TEMP TABLE _pi (id INT, product_id INT, image_url TEXT, sort_order INT, alt_text TEXT, created_at TIMESTAMPTZ);
\COPY _pi FROM 'ex_supabase/product_images_rows.csv' WITH (FORMAT CSV, HEADER true, NULL '');
INSERT INTO product_images (id, product_id, image_url, sort_order, alt_text, created_at)
SELECT id, product_id, image_url, sort_order, NULLIF(alt_text,''), created_at FROM _pi ON CONFLICT (id) DO NOTHING;
SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));
SELECT COUNT(*) AS product_images FROM product_images;
