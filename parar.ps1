# Detiene VetBiobío local (API + Web + PostGIS).
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\parar.ps1

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location -LiteralPath $root

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'dist/main\.js|next start' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

docker compose stop db
Write-Output 'Detenido. (La BD conserva sus datos en el volumen pgdata.)'
