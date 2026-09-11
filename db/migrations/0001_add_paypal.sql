-- Aggiungi PayPal all'enum payment_method
-- Applica sul VPS:
--   psql "$DATABASE_URL" -f db/migrations/0001_add_paypal.sql

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'paypal';
