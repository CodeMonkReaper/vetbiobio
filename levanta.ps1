# Levanta VetBiobío local: PostGIS + API + Web.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\levanta.ps1
# Requiere: Docker Desktop abierto, `pnpm install` ya ejecutado,
# `nest build` (apps/api/dist) y `next build` (apps/web/.next) al día.
# Detener: .\parar.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location -LiteralPath $root

Write-Output '== 1/3 PostGIS =='
docker compose up -d db
for ($i = 1; $i -le 12; $i++) {
  $ready = docker exec vetbiobio-db-1 pg_isready -U vetbiobio 2>&1 | Out-String
  if ($ready -match 'accepting connections') { break }
  Start-Sleep -Seconds 5
}
docker exec vetbiobio-db-1 pg_isready -U vetbiobio

Write-Output '== 2/3 API :3001 =='
Start-Process -FilePath 'node' -ArgumentList 'dist/main.js' `
  -WorkingDirectory (Join-Path $root 'apps\api')

Write-Output '== 3/3 Web :3000 =='
Start-Process -FilePath 'node' -ArgumentList 'node_modules/next/dist/bin/next', 'start', '-p', '3000' `
  -WorkingDirectory (Join-Path $root 'apps\web')

Write-Output ''
Write-Output 'Web: http://localhost:3000'
Write-Output 'API: http://localhost:3001/api/v1/health'
Write-Output 'Para detener: .\parar.ps1'
