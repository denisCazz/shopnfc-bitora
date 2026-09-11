#!/usr/bin/env bash
# Clona DATABASE_URL -> qa-<db> usando immagine postgres (pg_dump/psql inclusi).
# Uso: dalla root progetto: bash scripts/clone-db-to-qa-docker.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Manca .env in $ROOT"
  exit 1
fi

# Non fare source di tutto .env (può contenere righe non compatibili con bash)
DATABASE_URL=""
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    DATABASE_URL=*)
      DATABASE_URL="${line#DATABASE_URL=}"
      DATABASE_URL="${DATABASE_URL%\"}"
      DATABASE_URL="${DATABASE_URL#\"}"
      break
      ;;
  esac
done < .env

if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL non trovato in .env"
  exit 1
fi
export DATABASE_URL

IMAGE="${POSTGRES_TOOLS_IMAGE:-postgres:18-alpine}"

url_noq="${DATABASE_URL%%\?*}"
base="${url_noq%/*}"
admin_url="${base}/postgres"
dbname="${url_noq##*/}"
newdb="qa-${dbname}"

if [[ "$dbname" == qa-* ]]; then
  echo "Il DB sorgente non deve essere già qa-*. Usa il DATABASE_URL principale."
  exit 1
fi

qs=""
if [[ "$DATABASE_URL" == *\?* ]]; then
  qs="?${DATABASE_URL#*\?}"
fi
target_url="${base}/${newdb}${qs}"

echo "Immagine: $IMAGE"
echo "Sorgente: .../$(basename "$dbname") @ ${base#*@}"
echo "Dest:     .../$(basename "$newdb") @ ${base#*@}"

# FORCE_RECREATE=1 — elimina qa-* se già presente e riclona da zero (solo il DB di test)
if [[ "${FORCE_RECREATE:-}" == "1" ]]; then
  echo "FORCE_RECREATE: elimino \"$newdb\" se esiste..."
  docker run --rm \
    -e ADMIN_URL="$admin_url" \
    -e NEWDB="$newdb" \
    "$IMAGE" \
    sh -eu -c 'psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${NEWDB}\" WITH (FORCE);" || psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${NEWDB}\";"'
fi

docker run --rm \
  -v "$ROOT/scripts/clone-db-qa-inner.sh:/clone-inner.sh:ro" \
  -e SOURCE_URL="$DATABASE_URL" \
  -e ADMIN_URL="$admin_url" \
  -e TARGET_URL="$target_url" \
  -e NEWDB="$newdb" \
  "$IMAGE" \
  sh /clone-inner.sh

echo
echo "Fatto. Imposta DATABASE_URL per QA sostituendo /${dbname} con /${newdb} (stessa password)."
