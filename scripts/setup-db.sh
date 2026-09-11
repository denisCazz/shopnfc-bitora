#!/usr/bin/env bash
# Crea il database Shop NFC e applica le migrazioni SQL.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${POSTGRES_DB:-shopnfc}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-$(whoami)}"

export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGUSER="$DB_USER"

echo "→ Postgres ${DB_USER}@${DB_HOST}:${DB_PORT}  db=${DB_NAME}"

if psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "→ Database '${DB_NAME}' già esistente"
else
  createdb "$DB_NAME"
  echo "→ Creato database '${DB_NAME}'"
fi

MIGRATIONS=(
  db/migrations/0000_vps_standalone.sql
  db/migrations/0001_add_paypal.sql
  db/migrations/0002_add_stoves.sql
  db/migrations/0003_add_stoves_details.sql
  db/migrations/0004_danea_import_logs.sql
  db/migrations/0005_danea_orders_export_logs.sql
  db/migrations/0006_app_settings.sql
  db/migrations/0007_fragile_shipping.sql
  db/migrations/0008_bank_transfer_receipt.sql
  db/migrations/0009_announcements.sql
  db/migrations/0010_announcements_i18n.sql
  db/migrations/0011_add_satispay.sql
  db/migrations/0012_catalog_price.sql
)

if psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.app_users')" | grep -q app_users; then
  echo "→ Schema già presente, applico solo migrazioni incrementali"
  for f in "${MIGRATIONS[@]:1}"; do
    echo "  $f"
    psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$f"
  done
else
  echo "→ Applico schema completo"
  for f in "${MIGRATIONS[@]}"; do
    echo "  $f"
    psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$f"
  done
fi

echo "OK  DATABASE_URL=postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
