# Backup/restore PostGIS — VetBiobío
# Uso: .\backup-db.ps1 (genera backups/vetbiobio-YYYYMMDD-HHmm.sql)
# Restore: ver docs/deployment.md. Retención: últimos 7 archivos.

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir "vetbiobio-$stamp.sql"
docker exec vetbiobio-db-1 pg_dump -U vetbiobio -d vetbiobio --clean --if-exists > $file
Write-Output "Backup: $file"
Get-ChildItem -LiteralPath $dir -Filter 'vetbiobio-*.sql' | Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 7 | Remove-Item -Force
Write-Output 'Retención aplicada (7).'
