# Deployment — VetBiobío

## 1. Variables (producción, nunca en git)

```text
DATABASE_URL (pool con sslmode=require si aplica)
JWT_SECRET (>=32 chars aleatorios, sin la palabra 'change')
ADMIN_EMAIL / ADMIN_PASSWORD (>=12, rotar tras primer login)
WEB_BASE_URL=https://<dominio-web>   # CORS allowlist exacto
API_BASE_URL=https://<dominio-api>
NEXT_PUBLIC_API_URL=https://<dominio-api>/api/v1
NEXT_PUBLIC_SITE_URL=https://<dominio-web>
MAPBOX_PUBLIC_TOKEN (opcional)
CLOUDINARY_* (cuando se activen fotos)
```

El arranque falla si `NODE_ENV=production` y `JWT_SECRET` es débil/ausente o falta `DATABASE_URL`.

## 2. Orden de despliegue BD

```text
0000_init → 0001_catalogs → 0002_admin → 0003_fix → 0005_professionals →
0004_search → 0006_es_unaccent → 0007_events → 0008_monetization
```

(Ojo: 0005 se aplica antes que 0004 porque los triggers referencian `professional`.)
Aplicar con `psql -f` en orden (ver `docs/ingesta-calidad.md` §6 para Windows).
Luego seeds: `0001_seed_geo.sql → 0002_seed_catalogs.sql → 0004_seed_demo.sql` (demo solo dev).

## 3. Backup / restore

```powershell
# Backup
.\infra\scripts\backup-db.ps1
# Restore (pisar: solo mantenimiento programado)
Get-Content backups/vetbiobio-<stamp>.sql -Raw | docker exec -i <contenedor> psql -U vetbiobio -d vetbiobio -v ON_ERROR_STOP=1
```

Retención local: 7 archivos. En prod, copiar a almacenamiento externo.

## 4. Checklist prod

* HTTPS + `Secure` en cookie (automático con `NODE_ENV=production`).
* CORS = solo `WEB_BASE_URL` exacto.
* `ADMIN_PASSWORD` rotada + `ADMIN_EMAIL` real.
* `next build` verde + `/health` OK + `EXPLAIN ANALYZE` de la query de búsqueda.
* Job diario `mark-outdated.sql` programado.

## 5. Mapbox + Cloudinary

* Web: `NEXT_PUBLIC_MAPBOX_TOKEN` (token **público** `pk.*`). Sin él, el perfil usa embed OSM (fallback automático en `ClinicMap`).
* API: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (**secreto**: solo entorno server, jamás al frontend ni a git).
  Flujo: `POST /admin/media/sign` (firma server-side) → subida directa navegador→Cloudinary → `POST /admin/media/photos` (adjunta `{url, publicId}` a la clínica). Sin credenciales, `/sign` responde 503 honesto y el resto sigue funcionando.

## 6. Builds bajo OneDrive (Windows)

OneDrive bloquea archivos de `.next` (`EINVAL readlink`) y deja builds a medio escribir.
Reglas:

* Detener `next start` antes de `next build`.
* Si falla con `EINVAL`, borrar `apps/web/.next` y reconstruir.
* El CSS crudo (directivas `@tailwind` en el bundle) indica que PostCSS no corrió:
  verificar `postcss.config.js` (con ruta explícita a `tailwind.config.js`, porque el
  CWD suele ser la raíz del monorepo) y reconstruir en limpio.
