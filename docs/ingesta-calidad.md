# Ingesta inicial y calidad de datos

## 1. Vías
Panel admin (principal) → CSV controlado → seed scripts. No copiar BD de terceros; registrar `source`.

## 2. CSV

Cabecera: `name,address,commune_cut,phone,website,latitude,longitude`
Ejemplo:
```csv
name,address,commune_cut,phone,website,latitude,longitude
Clínica Vet Concepción,Av. Paicaví 1234,08101,+56912345678,https://ejemplo.cl,-36.827,-73.050
```
`commune_cut` = código oficial (no nombre libre). Script valida CUT existe, si no rechaza fila con motivo.

## 3. Validaciones pre-publish (§66)
`name obligatorio, commune válida, lat/lon en bbox Biobío, phone E.164 (libphonenumber-js, +56), URL http/https, amount>=0 + reglas FIXED/RANGE/FROM/CONTACT, schedule day 0-6 + overnight coherente`.

## 4. Normalización
* Teléfonos: almacenar `+569...`, presentar `+56 9 1234 5678`.
* Moneda: `INTEGER CLP`.
* Fechas: `TIMESTAMPTZ UTC`, display `America/Santiago` (DST vía Intl).
* Slugs: ver ADR-004.

## 5. Flujo admin
`Crear clínica(DRAFT) → ubicación → servicios/exámenes → precios → profesionales → fotos → verificación → PENDING → ACTIVE`. Cada paso escribe `audit_log`.

## 6. Aplicar SQL con tildes en Windows (obligatorio)

PowerShell 5.1 (`Get-Content | docker exec -i ... psql`) corrompe UTF-8 (`í→?`).
Verificado en este repo (fix `infra/scripts/0007_fix_utf8.sql`). Regla:

```powershell
docker cp infra/scripts/000X_algo.sql vetbiobio-db-1:/tmp/000X_algo.sql
docker exec vetbiobio-db-1 psql -U vetbiobio -d vetbiobio -v ON_ERROR_STOP=1 -f /tmp/000X_algo.sql
```

Nunca pipear `.sql` con tildes vía `Get-Content -Raw | docker exec -i`.
