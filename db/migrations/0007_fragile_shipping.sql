-- Add fragile shipping fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS fragile_shipping BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fragile_shipping_cost DECIMAL(10,2);
