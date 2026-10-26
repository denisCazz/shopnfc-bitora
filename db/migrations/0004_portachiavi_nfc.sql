-- Portachiavi NFC mancanti (idempotente). Listino = prezzo Shop NFC; vetrina = listino × 1,8.

INSERT INTO products (
  category_id, sku, name_it, name_en, name_fr, name_es,
  description_it, description_en, description_short_it, description_short_en,
  slug, catalog_price, price, wholesale_price, weight,
  stock_quantity, min_quantity, active, brand, image_url,
  meta_title, meta_description
)
SELECT
  c.id, v.sku, v.name_it, v.name_en, v.name_it, v.name_it,
  v.description_it, v.description_it, v.short_it, v.short_it,
  v.slug, v.catalog_price, ROUND(v.catalog_price * 1.8, 2), v.wholesale_price, v.weight,
  v.stock_quantity, v.min_quantity, true, 'NXP', v.image_url,
  v.name_it || ' | Shop NFC Bitora', v.short_it
FROM categories c
CROSS JOIN (
  VALUES
    (
      'GD-KEY-BIC',
      'Portachiavi NFC bicolor IP68',
      'Bicolor IP68 NFC keyfobs',
      'Portachiavi NFC con corpo bicolore e classificazione IP68, pensato per l''uso quotidiano. Chip NTAG213. La grafica si applica con stampa UV.',
      'Corpo bicolore, tenuta IP68, personalizzabile con stampa UV.',
      'portachiavi-nfc-bicolor-ip68',
      1.85::numeric, 1.35::numeric, 0.010::numeric, 800, 10,
      '/products/portachiavi-nfc-bicolor-ip68.png'
    ),
    (
      'GD-KEY-DROP',
      'Portachiavi NFC a goccia IP68',
      'IP68 teardrop NFC keyfobs',
      'Portachiavi a goccia sottili (2,2 mm), resistenti e impermeabili IP68. Chip NTAG213. Personalizzabili con incisione laser.',
      'Spessore 2,2 mm, impermeabile IP68, incisione laser.',
      'portachiavi-nfc-goccia-ip68',
      2.40::numeric, 1.06::numeric, 0.004::numeric, 700, 5,
      '/products/portachiavi-nfc-goccia-ip68.png'
    ),
    (
      'GD-KEY-DLX',
      'Portachiavi NFC Deluxe',
      'Deluxe NFC keyfobs',
      'Portachiavi NFC Deluxe, compatto e curato, adatto come gadget aziendale. Chip NTAG213. Ordine minimo 500 pezzi.',
      'Gadget contactless elegante. Minimo 500 pezzi.',
      'portachiavi-nfc-deluxe',
      2.19::numeric, 1.75::numeric, 0.012::numeric, 2000, 500,
      '/products/portachiavi-nfc-deluxe.png'
    ),
    (
      'GD-KEY-LOCK',
      'Portachiavi NFC Locket',
      'NFC locket keyfob',
      'Portachiavi rotondo con cornice in acciaio inossidabile lucidato. Usato spesso per controllo accessi. Chip NTAG216, con NTAG213 in alternativa.',
      'Acciaio inox lucidato, per accessi e sicurezza.',
      'portachiavi-nfc-locket',
      5.09::numeric, 3.56::numeric, 0.018::numeric, 400, 10,
      '/products/portachiavi-nfc-locket.png'
    ),
    (
      'GD-PEND',
      'Ciondoli NTAG213 con logo NFC',
      'NTAG213 NFC logo pendants',
      'Ciondoli tondi resinati con chip NTAG213 e simbolo NFC in vista. Impermeabili, compatibili con gli smartphone NFC e personalizzabili con la propria grafica.',
      'Ciondoli resinati impermeabili con simbolo NFC.',
      'ciondoli-ntag213-logo-nfc',
      1.99::numeric, 0.95::numeric, 0.006::numeric, 1000, 5,
      '/products/ciondoli-ntag213-logo-nfc.png'
    ),
    (
      'GD-KEY-PREM',
      'Portachiavi NFC Premium',
      'Premium NFC keyfobs',
      'Portachiavi in ABS, impermeabile IP66, con grafica a colori protetta da resina epossidica anti-ingiallimento. Chip NTAG213.',
      'ABS IP66 con grafica sotto resina epossidica.',
      'portachiavi-nfc-premium',
      1.99::numeric, 0.79::numeric, 0.009::numeric, 800, 5,
      '/products/portachiavi-nfc-premium.png'
    ),
    (
      'GD-KEY-OCEAN',
      'Portachiavi NFC Ocean in plastica riciclata',
      'Ocean recycled-plastic NFC keyfobs',
      'Portachiavi in plastica riciclata recuperata dagli oceani, con chip NTAG213. Personalizzazione con stampa o incisione laser.',
      'Plastica riciclata dagli oceani, stampa o incisione laser.',
      'portachiavi-nfc-ocean',
      1.70::numeric, 1.19::numeric, 0.008::numeric, 600, 10,
      '/products/portachiavi-nfc-ocean.png'
    ),
    (
      'GD-KEY-BAMBOO',
      'Portachiavi NFC in bambù NTAG213',
      'Bamboo NTAG213 NFC keyfobs',
      'Portachiavi tondo in bambù con chip NTAG213. Adatto a controllo accessi e gadget sostenibili. Temperatura operativa da -40 °C a 80 °C.',
      'Bambù, da -40 °C a 80 °C, per accessi e gadget.',
      'portachiavi-nfc-bambu-ntag213',
      1.99::numeric, 1.39::numeric, 0.008::numeric, 500, 10,
      '/products/portachiavi-nfc-bambu-ntag213.png'
    )
) AS v(
  sku, name_it, name_en, description_it, short_it, slug,
  catalog_price, wholesale_price, weight, stock_quantity, min_quantity, image_url
)
WHERE c.slug = 'gadget-nfc'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.slug = v.slug);

INSERT INTO product_images (product_id, image_url, sort_order, alt_text)
SELECT p.id, p.image_url, 0, p.name_it
FROM products p
WHERE p.slug IN (
  'portachiavi-nfc-bicolor-ip68',
  'portachiavi-nfc-goccia-ip68',
  'portachiavi-nfc-deluxe',
  'portachiavi-nfc-locket',
  'ciondoli-ntag213-logo-nfc',
  'portachiavi-nfc-premium',
  'portachiavi-nfc-ocean',
  'portachiavi-nfc-bambu-ntag213'
)
  AND p.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_images i
    WHERE i.product_id = p.id AND i.image_url = p.image_url
  );

INSERT INTO product_chips (product_id, chip_id)
SELECT p.id, ch.id
FROM products p
JOIN chips ch ON ch.slug = CASE
  WHEN p.slug = 'portachiavi-nfc-locket' THEN 'ntag216'
  ELSE 'ntag213'
END
WHERE p.slug IN (
  'portachiavi-nfc-bicolor-ip68',
  'portachiavi-nfc-goccia-ip68',
  'portachiavi-nfc-deluxe',
  'portachiavi-nfc-locket',
  'ciondoli-ntag213-logo-nfc',
  'portachiavi-nfc-premium',
  'portachiavi-nfc-ocean',
  'portachiavi-nfc-bambu-ntag213'
)
  AND NOT EXISTS (
    SELECT 1 FROM product_chips pc
    WHERE pc.product_id = p.id AND pc.chip_id = ch.id
  );

INSERT INTO product_chips (product_id, chip_id)
SELECT p.id, ch.id
FROM products p
JOIN chips ch ON ch.slug = 'ntag213'
WHERE p.slug = 'portachiavi-nfc-locket'
  AND NOT EXISTS (
    SELECT 1 FROM product_chips pc
    WHERE pc.product_id = p.id AND pc.chip_id = ch.id
  );
