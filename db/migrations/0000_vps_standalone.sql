-- Shop NFC — schema PostgreSQL autonomo (VPS) senza Supabase.
-- I controlli di accesso sono in applicazione (nessuna RLS).
-- Sostituisce auth.users con public.app_users; profiles.id → app_users.id

CREATE TYPE user_role AS ENUM ('customer', 'dealer', 'admin');
CREATE TYPE dealer_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('paypal', 'bank_transfer', 'cod', 'stripe', 'satispay');

-- ============================================================
-- APP USERS (credenziali; sostituisce auth.users)
-- ============================================================
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  company TEXT,
  vat_number TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'IT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_it TEXT NOT NULL,
  name_en TEXT,
  name_fr TEXT,
  name_es TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id),
  sku TEXT,
  ean13 TEXT,
  name_it TEXT NOT NULL,
  name_en TEXT,
  name_fr TEXT,
  name_es TEXT,
  description_it TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_es TEXT,
  description_short_it TEXT,
  description_short_en TEXT,
  description_short_fr TEXT,
  description_short_es TEXT,
  slug TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  catalog_price DECIMAL(10,2),
  wholesale_price DECIMAL(10,2),
  weight DECIMAL(8,3),
  width DECIMAL(8,3),
  height DECIMAL(8,3),
  depth DECIMAL(8,3),
  stock_quantity INT NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  brand TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  image_url TEXT,
  fragile_shipping BOOLEAN NOT NULL DEFAULT false,
  fragile_shipping_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', coalesce(name_it, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(description_short_it, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(description_it, '')), 'C')
  ) STORED;

CREATE INDEX idx_products_search ON products USING gin(search_vector);

-- ============================================================
-- DEALER PROFILES
-- ============================================================
CREATE TABLE dealer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  status dealer_status NOT NULL DEFAULT 'pending',
  discount_percent INT NOT NULL DEFAULT 50,
  rejection_reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dealer_profiles_status ON dealer_profiles(status);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  guest_email TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL DEFAULT '{}',
  billing_address JSONB NOT NULL DEFAULT '{}',
  tracking_number TEXT,
  bank_transfer_receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);

-- ============================================================
-- CHIPS NFC
-- ============================================================
CREATE TABLE chips (
  id SERIAL PRIMARY KEY,
  name_it TEXT NOT NULL,
  name_en TEXT,
  name_fr TEXT,
  name_es TEXT,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  categoria TEXT,
  potenza TEXT,
  dimensioni TEXT,
  peso TEXT
);

CREATE TABLE product_chips (
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  chip_id INT NOT NULL REFERENCES chips(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, chip_id)
);

CREATE INDEX idx_product_chips_product ON product_chips(product_id);
CREATE INDEX idx_product_chips_chip ON product_chips(chip_id);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES (
  'shipping',
  '{
    "zones": {
      "italy": {
        "label": "Italia",
        "tiers": [
          {"maxKg": 10, "rate": 8.50},
          {"maxKg": 30, "rate": 12.50}
        ],
        "includesIva": true
      },
      "islands_calabria": {
        "label": "Isole e Calabria",
        "tiers": [
          {"maxKg": 10, "rate": 12.50},
          {"maxKg": 30, "rate": 16.50}
        ],
        "includesIva": true
      },
      "europe": {
        "label": "Europa",
        "tiers": [
          {"maxKg": 10, "rate": 20.00},
          {"maxKg": 30, "rate": 30.00}
        ],
        "includesIva": false
      }
    },
    "codSurcharge": 7.00,
    "ivaRate": 0.22,
    "islandsCalabriaProvincia": [
      "AG","CL","CT","EN","ME","PA","RG","SR","TP",
      "CA","CI","MD","NU","OG","OT","OR","SS","SU","VS",
      "CS","CZ","KR","RC","VV"
    ]
  }'::jsonb
);

INSERT INTO app_settings (key, value) VALUES (
  'pricing',
  '{"markup": 1.8}'::jsonb
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TYPE announcement_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE announcement_audience AS ENUM ('users', 'admin', 'both');
CREATE TYPE announcement_schedule_mode AS ENUM ('always', 'range');

CREATE TABLE announcements (
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

CREATE INDEX idx_announcements_active ON announcements (active);

CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_item_inserted
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order();
