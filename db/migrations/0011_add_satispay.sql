-- Aggiungi Satispay all'enum payment_method
-- Applica sul VPS:
--   psql "$DATABASE_URL" -f db/migrations/0011_add_satispay.sql

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'satispay';
