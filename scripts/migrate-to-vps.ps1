# migrate-to-vps.ps1
# Migrazione completa da Supabase a PostgreSQL VPS
#
# Prerequisiti:
#   - Docker Desktop installato e avviato
#   - auth_users.csv nella stessa cartella (esportato da Supabase SQL Editor)
#   - .env.production con DATABASE_URL compilato
#
# Uso:
#   cd C:\Users\U1795\Desktop\ricambixstufe
#   .\scripts\migrate-to-vps.ps1

param(
  [string]$SupabaseUrl = "",   # es: postgresql://postgres:PWD@db.REF.supabase.co:5432/postgres
  [string]$DatabaseUrl = ""    # es: postgresql://user:pass@vps-ip:5432/ricambixstufe
)

# ---------- Leggi .env.production se i parametri non sono stati passati ----------
if (-not $SupabaseUrl -or -not $DatabaseUrl) {
  $envFile = Join-Path $PSScriptRoot "..\\.env.production"
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match "^SUPABASE_DB_URL=(.+)$" -and -not $SupabaseUrl) { $SupabaseUrl = $Matches[1] }
      if ($_ -match "^DATABASE_URL=(.+)$"    -and -not $DatabaseUrl) { $DatabaseUrl = $Matches[1] }
    }
  }
}

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Incolla la connection string di Supabase (postgresql://postgres:PWD@db.REF.supabase.co:5432/postgres)"
}
if (-not $DatabaseUrl) {
  $DatabaseUrl = Read-Host "Incolla la DATABASE_URL del VPS (postgresql://...)"
}

$Root    = Split-Path $PSScriptRoot -Parent
$DumpDir = $Root   # i file SQL vengono scritti nella root del progetto
$CsvFile = Join-Path $Root "auth_users.csv"

# ---------- Passo 1: verifica auth_users.csv ----------
Write-Host "`n[1/6] Verifica auth_users.csv..." -ForegroundColor Cyan
if (-not (Test-Path $CsvFile)) {
  Write-Host "  ERRORE: $CsvFile non trovato." -ForegroundColor Red
  Write-Host "  Esporta gli utenti da Supabase SQL Editor con:" -ForegroundColor Yellow
  Write-Host "    COPY (SELECT id,email,encrypted_password,email_confirmed_at,created_at,updated_at FROM auth.users WHERE deleted_at IS NULL) TO STDOUT WITH CSV HEADER;" -ForegroundColor Yellow
  exit 1
}
$userCount = (Import-Csv $CsvFile).Count
Write-Host "  Trovati $userCount utenti nel CSV." -ForegroundColor Green

# ---------- Passo 2: pg_dump da Supabase ----------
Write-Host "`n[2/6] Export dati da Supabase (schema public)..." -ForegroundColor Cyan
$dumpFile = Join-Path $DumpDir "supabase_public.sql"
docker run --rm `
  -v "${DumpDir}:/dump" `
  postgres:16-alpine pg_dump `
  $SupabaseUrl `
  --data-only --no-owner --no-privileges `
  --schema=public `
  --exclude-table=public.schema_migrations `
  --exclude-table=public.migrations `
  -f /dump/supabase_public.sql

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ERRORE nel pg_dump. Verifica la Supabase connection string." -ForegroundColor Red
  exit 1
}
Write-Host "  Dump completato: supabase_public.sql" -ForegroundColor Green

# ---------- Passo 3: applica schema VPS (idempotente) ----------
Write-Host "`n[3/6] Applico schema VPS..." -ForegroundColor Cyan
$schemaFile = "/scripts/0000_vps_standalone.sql"
docker run --rm `
  -v "${Root}/db/migrations:/scripts" `
  postgres:16-alpine psql `
  $DatabaseUrl `
  -f $schemaFile `
  2>&1 | ForEach-Object {
    if ($_ -match "ERROR") { Write-Host "  $_" -ForegroundColor Yellow }
  }
Write-Host "  Schema OK (eventuali 'already exists' sono normali se lo schema era gia' applicato)." -ForegroundColor Green

# ---------- Passo 4: import utenti ----------
Write-Host "`n[4/6] Import app_users da CSV..." -ForegroundColor Cyan
docker run --rm `
  -v "${Root}:/app" `
  postgres:16-alpine psql `
  $DatabaseUrl `
  -f /app/scripts/import-auth-users.sql

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ERRORE nell'import utenti." -ForegroundColor Red
  exit 1
}

# ---------- Passo 5: import dati public ----------
Write-Host "`n[5/6] Import dati Supabase (disabilito FK durante import)..." -ForegroundColor Cyan
docker run --rm `
  -v "${DumpDir}:/dump" `
  postgres:16-alpine psql `
  $DatabaseUrl `
  -c "SET session_replication_role = replica;" `
  -f /dump/supabase_public.sql `
  -c "SET session_replication_role = DEFAULT;"

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ERRORE nell'import public data." -ForegroundColor Red
  exit 1
}
Write-Host "  Import completato." -ForegroundColor Green

# ---------- Passo 6: reset sequenze ----------
Write-Host "`n[6/6] Reset sequenze..." -ForegroundColor Cyan
$seqSql = @"
SELECT setval('categories_id_seq',    GREATEST((SELECT COALESCE(MAX(id),0) FROM categories), 1));
SELECT setval('products_id_seq',      GREATEST((SELECT COALESCE(MAX(id),0) FROM products), 1));
SELECT setval('orders_id_seq',        GREATEST((SELECT COALESCE(MAX(id),0) FROM orders), 1));
SELECT setval('order_items_id_seq',   GREATEST((SELECT COALESCE(MAX(id),0) FROM order_items), 1));
SELECT setval('product_images_id_seq',GREATEST((SELECT COALESCE(MAX(id),0) FROM product_images), 1));
SELECT setval('cart_items_id_seq',    GREATEST((SELECT COALESCE(MAX(id),0) FROM cart_items), 1));
"@
docker run --rm postgres:16-alpine psql $DatabaseUrl -c $seqSql
Write-Host "  Sequenze aggiornate." -ForegroundColor Green

# ---------- Riepilogo conteggi ----------
Write-Host "`n=== Riepilogo conteggi ===" -ForegroundColor Cyan
$countSql = @"
SELECT 'app_users'      AS tabella, COUNT(*) FROM app_users    UNION ALL
SELECT 'profiles',                  COUNT(*) FROM profiles      UNION ALL
SELECT 'categories',                COUNT(*) FROM categories    UNION ALL
SELECT 'products',                  COUNT(*) FROM products      UNION ALL
SELECT 'orders',                    COUNT(*) FROM orders        UNION ALL
SELECT 'order_items',               COUNT(*) FROM order_items   UNION ALL
SELECT 'product_images',            COUNT(*) FROM product_images;
"@
docker run --rm postgres:16-alpine psql $DatabaseUrl -c $countSql

Write-Host "`nMigrazione completata!" -ForegroundColor Green
