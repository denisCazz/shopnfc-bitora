-- Importa gli utenti esportati da Supabase (auth.users) nella tabella app_users.
--
-- Prerequisiti:
--   1. Lo schema VPS è già stato applicato (0000_vps_standalone.sql)
--   2. Il file auth_users.csv si trova nella stessa cartella da cui lanci psql
--
-- Uso:
--   psql "$DATABASE_URL" -f scripts/import-auth-users.sql
--
-- Colonne CSV attese (header obbligatorio):
--   id, email, encrypted_password, email_confirmed_at, created_at, updated_at

CREATE TEMP TABLE _auth_users_import (
  id                  UUID,
  email               TEXT,
  encrypted_password  TEXT,
  email_confirmed_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ
);

\COPY _auth_users_import FROM 'auth_users.csv' WITH (FORMAT CSV, HEADER true, NULL '');

INSERT INTO app_users (id, email, password_hash, email_verified_at, created_at, updated_at)
SELECT
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  COALESCE(updated_at, created_at)
FROM _auth_users_import
ON CONFLICT (email) DO NOTHING;

-- Riepilogo
SELECT
  (SELECT COUNT(*) FROM _auth_users_import)  AS csv_rows,
  (SELECT COUNT(*) FROM app_users)           AS inserted_users;
