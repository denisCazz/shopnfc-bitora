#!/usr/bin/env bash
# Crea il database Shop NFC e applica lo schema pulito (un solo file).
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

SCHEMA="$ROOT/db/migrations/0000_vps_standalone.sql"

echo "→ Postgres ${DB_USER}@${DB_HOST}:${DB_PORT}  db=${DB_NAME}"

if psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "→ Database '${DB_NAME}' già esistente"
else
  createdb "$DB_NAME"
  echo "→ Creato database '${DB_NAME}'"
fi

if psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.app_users')" | grep -q app_users; then
  echo "→ Schema già presente, nessuna migrazione da applicare"
else
  echo "→ Applico schema completo"
  psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SCHEMA"
fi

echo "OK  DATABASE_URL=postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "    Poi: npm run db:seed"
