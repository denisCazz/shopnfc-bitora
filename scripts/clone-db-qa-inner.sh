#!/bin/sh
# Eseguito nel container Docker (env: SOURCE_URL, ADMIN_URL, TARGET_URL, NEWDB).
set -eu

exists=$(psql "$ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname = '$NEWDB'")
if [ "$exists" = "1" ]; then
  echo "Il database \"$NEWDB\" esiste già." >&2
  exit 1
fi

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${NEWDB}\";"
pg_dump --clean --if-exists --no-owner --no-acl "$SOURCE_URL" | psql "$TARGET_URL"
