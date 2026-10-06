# PROJECT_CONTEXT — VetBiobío (log vivo, raíz)

> Archivo obligatorio: todo avance se registra aquí con fecha (UTC) antes de darse por terminado.
> Verdad técnica detallada en `docs/`. Si hay conflicto, manda el ADR más reciente.
> Última actualización: 2026-10-06 (UTC) — UI completada (reportar + admin precios/horarios/fotos/bandeja) y lint en CI.

## 1. Estado actual

* Etapa: MVP técnico completo (Fases 1–6 + SEO/analytics/E2E). Pendiente: validación piloto con clínicas reales.
* Cobertura MVP (§81 project_context): público ✓ (home/buscador/listado/filtros/mapa-embed/perfil/precios/profesionales/comparación/verificación) · admin ✓ (login/dashboard-UI-mínima/CRUD/verificaciones/reportes/premium-ads) · fuera-MVP respetado (sin reservas/pagos/reseñas/app nativa).
* Stack congelado: Next.js 14 + NestJS 10 + PostgreSQL 16/PostGIS 3.4 + Prisma 5 + pnpm 9 + Docker.
* Decisiones aplicadas:
  1. Verificación por campo (cada registro lleva status/verified_at/source), sin badge global único.
  2. Taxonomía: Radiografía/Ecografía = `exam`. Urgencias/24h = atributos `clinic.is_emergency/is_24h`.
  3. Slug único global inmutable, comuna solo prefijo SEO + `slug_redirect`.
  4. Precios append-only (`valid_from/valid_until`) + vistas `v_current_*`, `INTEGER CLP`.
  5. Geo: `latitude/longitude` + `location GEOGRAPHY` vía trigger, queries en `*.geo.repository.ts` con `$queryRaw`.
* Toolchain verificado: node v24.18.0, pnpm 9.0.0, docker 29.6.1.

## 2. Estructura creada

```text
apps/web/src/{app,components,features,lib,hooks,types,styles}  # rutas SEO /veterinarias/[commune]/[slug]
apps/api/src/{auth,users,clinics,...,health,common} + prisma/schema.prisma
packages/{config,types,eslint-config}
infra/{docker/api.Dockerfile,docker/web.Dockerfile,scripts/README.md}
docs/{decisions/ADR-001..005,database-design.md,api.md,architecture.md,...}
docker-compose.yml (postgis), .env.example, ci.yml
```

## 3. Changelog (agregar entrada por cada paso)

| Fecha (UTC) | Paso | Resultado |
|---|---|---|
| 2026-10-06 | Auditoría project_context 110 secciones | 6 bloqueantes detectados, 5 decisiones tomadas |
| 2026-10-06 | Docs Bloque 1: ADR-001..005 + taxonomy + verification-policy | 7 archivos en `docs/` |
| 2026-10-06 | Docs Bloque 2: database-design + api + architecture | DDL PostGIS + envelopes + monolito modular |
| 2026-10-06 | Docs Bloque 3: ingesta + seo + security + backlog | 4 archivos operativos |
| 2026-10-06 | Scaffold monorepo (57 archivos) | apps/web + apps/api + packages + infra + CI |
| 2026-10-06 | PROJECT_CONTEXT.md creado + Fase 1 continúa | En curso: auth/users + migración 0000 + seeds |
| 2026-10-06 | Auth/Users admin + migración 0000_init + seeds 33 comunas | `auth/`, `users/`, `prisma/migrations/0000_init/migration.sql`, `infra/scripts/seed-communes-biobio.ts` creados; `AppModule` incluye Auth/Users |
| 2026-10-06 | pnpm install + typecheck API | `pnpm install` OK (413 pkgs); `tsc --noEmit` API OK tras fix decorators + `@types/node`; types OK |
| 2026-10-06 | PostGIS up + migración 0000 + seed geo | `docker compose up -d db` OK en puerto 5433 (5432 ocupado por negocia-postgres; ver `docker-compose.yml:DB_HOST_PORT` + `.env`); migración 0000 aplicada; `infra/scripts/0001_seed_geo.sql` → 33 comunas; PostGIS 3.4; trigger `sync_location` y distancia `ST_Distance` verificados (0.777 km test, filas test eliminadas) |
| 2026-10-06 | Migración 0001 + catálogos + precios append-only | `prisma/migrations/0001_catalogs/migration.sql` (service/exam/specialty/equipment + N:N + 2 tablas precios + vistas); `0002_seed_catalogs.sql` → 10/9/10/8; verificado: historial 20000→25000, vista devuelve 25000, negativo rechazado por CHECK, cascada limpia |
| 2026-10-06 | Prisma schema canónico + Client generado | Reescrito `schema.prisma` sin `;` (P1012) + modelos `Specialty/Equipment/ClinicEquipment/ClinicAnimal`; `prisma validate` OK; `prisma generate` v5.22.0 OK; `tsc --noEmit` API OK |
| 2026-10-06 | Migración 0002 + módulos admin + job OUTDATED | `0002_admin`: verification_log, audit_log, report, slug_redirect, clinic_photo, schedule (21 tablas total); módulos `audit/verification/prices/reports` + `AdminClinicsController` (create DRAFT+ubicación tx, deactivate lógica, bySlug+redirect); `mark-outdated.sql` verificado VERIFIED→OUTDATED; fix `0003_fix` (next_review_at en schedule/photo, +clinic_location en job) tras error real detectado; `validate`+`generate`+`tsc` OK; test rows limpiadas |
| 2026-10-06 | Fase 3: búsqueda real + seeds demo + página listado | `0005_professionals` + `0004_search` (trigger tsv pesos A/B/C/D, config `es_unaccent`, GIN) + `0006_es_unaccent` + `0004_seed_demo.sql` (4 clínicas, historial 20→25k, dermatóloga, horarios); `ClinicsGeoRepository` real (`ST_DWithin`+tsvector+filtros+orden+envelope) + `PrismaModule`/`PrismaService`/`dotenv` con DI real; verificado por HTTP: dermatologia→Concepción, radiografía 5km→2 (0/4.5 km), consulta PRICE_ASC 18/25/30k+CONTACT último; `EXPLAIN` usa `clinic_location_gist`; `tsc` api+web OK; `next build` OK (/, /veterinarias, /[commune]/[slug]); fixes: alias `@/*`, `globals.css`, `apps/api/.env`, `tsconfig` web; incidente UTF-8 por pipe PS5.1 reparado con `0007_fix_utf8.sql` vía `docker cp` (regla en `ingesta-calidad.md` §6) |
| 2026-10-06 | Perfil + mapa | `GET /clinics/:slug` agregado (base+comuna+geo, servicios/exámenes con precio vigente, profesionales+especialidades, horarios, fotos, animales, equipo); verificado por HTTP (precios 25/35/40k, Dra. González, 5 horarios, 404 OK; fix `ph.sort_order` en proyección); página perfil SSR con badges por sección, contacto (tel/wa/web), horarios, precios FIXED/RANGE/FROM/CONTACT y disclaimer; `MapEmbed` OSM sin token (Mapbox pendiente de token); `tsc` api+web OK; `next build` OK |
| 2026-10-06 | Comparación + open_now | `open_now` en SQL (search + perfil: `is_24h` o fila vigente con overnight y zona `America/Santiago`); `GET /clinics/compare/by-slugs` (2–3 slugs, 400 si no, km opcional) + página `/comparar` SSR (consulta, radiografía, ecografía, urgencias, abierto, verificación, distancia); verificado por HTTP (km 0/12.7, 400 con 4 slugs, `open_now` true solo 24h a las 08:15 Santiago); badge en listado y perfil; `tsc` api+web OK; `next build` OK (7 páginas) |
| 2026-10-06 | Auth hardening + admin UI | `bcryptjs` + `JwtModule` (8h) + cookie `vetbiobio_admin` httpOnly/SameSite-Lax + `JwtAuthGuard`/`RolesGuard`/`@Roles` en admin + `ThrottlerModule` global 100/min (login 10/min, reports 5/h) + `cookie-parser` + `AdminBootstrapService` (crea ADMIN desde env si tabla vacía); verificado por HTTP: 401 sin sesión, 401 clave mala, login 200 + ADMIN, reports con sesión, logout 200, CRUD admin crear→desactivar (INACTIVE); fixes: `AuthModule` en 4 módulos (DI guards), `@@map` minúsculos en 14 modelos + 5 enums (`public.Clinic` no existía), BigInt→string en respuestas admin/auditoría; páginas `/admin/login` + `/admin/clinics` (crear/desactivar/salir); `tsc` api OK; `next build` OK (9 páginas); clínica test eliminada (4 demo intactas) |
| 2026-10-06 | SEO + analytics | `0007_events` (`clinic_event` sin PII + índice) + `POST /events` (whitelist 8 tipos, throttle 60/min, 400 tipo inválido) + `GET /admin/stats/daily` (guard, agregación diaria) + `GET /communes?region=` (33 comunas, alimenta sitemap); SEO: `/sitemap.xml` (base+comunas+clínicas con fallback sin API) + `/robots.txt` (bloquea `/admin/`, `/comparar?*` de índice) + `metadataBase` + canonical en listado/perfil/comparar (comparar `noindex`) + JSON-LD `VeterinaryCare` (address/geo/horarios, solo props oficiales); tracking web `TrackView` + `ContactLink` (sendBeacon, no PII); verificado por HTTP (evento id 2, stats phone_click=1, communes 33); fixes: BigInt→string en events/prices/reports + red global `BigInt.prototype.toJSON`; `tsc` api+web OK; `next build` OK (11 páginas); eventos test eliminados |
| 2026-10-06 | Premium/publicidad | `0008_monetization` (advertisement + premium_subscription con CHECKs, índices) + modelos Prisma + `PremiumModule` (`POST admin/monetization/subscriptions|advertisements`, guards, validación plan/placement/fechas, auditoría); flags `is_premium`/`is_sponsored` en search y perfil (solo campañas `ACTIVE` vigentes; premium no toca verificación); seed demo (Talcahuano PREMIUM, Concepción SPONSORED_CLINIC); verificado por HTTP (flags True/False correctos, 400 plan inválido, sub id 2 de prueba eliminada); badges `Patrocinado`/`★ Premium` en listado y perfil con nota de independencia; `validate`+`generate`+`tsc` api+web OK; `next build` OK |
| 2026-10-06 | Deuda técnica: unit + CI + Sentry | Reglas puras testeables (`price-rules`, `common/slug`, `verification/transitions`) conectadas a servicios (precios cierra vigencia en 1 UPDATE con `previousValidUntil`; slugs vía `uniqueSlug`; verificación exige transición válida + evidencia); unit 9/9 (`test:unit`); CI reescrito (PostGIS service + `tsc` api/web + unit + migraciones/seeds vía `prisma db execute` en orden + e2e + builds; sin `lint` por configurar); orden CI validado en BD fresca `vetbiobio_ci` (33 comunas, 4 clínicas, `dermatologia` OK sin fix UTF-8, e2e 8/8, BD eliminada tras validar); Sentry backend (`@sentry/nestjs`, init solo con `SENTRY_DSN`); `tsc` OK |
| 2026-10-06 | E2E + hardening prod | Harness Jest+supertest (`test:e2e`, 8 specs: buscar, geo+distancia, precios, perfil+histórico, 404, comparar+400, eventos+400, admin 401/login/cookie); BigInt centralizado en `common/bigint-json.ts` (main + setup e2e); fixes: `@nestjs/jwt@10` (v12 ESM-only rompía ts-jest), `@nestjs/testing@10`; `main.ts` exige `JWT_SECRET`/`DATABASE_URL` en prod; `infra/scripts/backup-db.ps1` verificado (dump 177KB + retención 7, `backups/` gitignored); scan sin secretos hardcodeados; `docs/deployment.md` (vars, orden migraciones, backup/restore, checklist); e2e final 8/8, `tsc` OK, eventos test limpiados |
| 2026-10-06 | Repo git + primer commit | `git init -b main` + `.gitattributes` + commit `75a370d` (134 archivos); pre-commit sin fugas (`.env`, `apps/api/.env`, `backups/`, `node_modules` ignorados); remoto pendiente (sin `gh` en el equipo) |
| 2026-10-06 | Push a GitHub | `gh` 2.102.0 instalado (winget) + auth del usuario; `gh repo create vetbiobio --public` → https://github.com/CodeMonkReaper/vetbiobio (PUBLIC) con push de `main` y tracking `origin/main` |
| 2026-10-06 | Mapbox + Cloudinary | `ClinicMap` Mapbox GL (lazy solo-cliente, marcador, CSS) con fallback OSM automático sin `NEXT_PUBLIC_MAPBOX_TOKEN`; `MediaModule` (`POST admin/media/sign` firma server-side con `api_sign_request`, `POST admin/media/photos` adjunta + auditoría, guards, 503 honesto sin `CLOUDINARY_*`); verificado por HTTP (503 sign, attach id 1 visible en perfil, foto test eliminada); unit 10/10 (spec 503); `tsc` api+web OK; `next build` OK; `deployment.md` §5 con vars y flujo |
| 2026-10-06 | Credenciales live | Mapbox pk.* → 200 (`Mapbox Streets v8`), `.env.local` creado; Cloudinary `dfzjjkcn3`: ping 200 (el 401 inicial fue artefacto de PowerShell con userinfo en URL, reintentado con header Basic), `/sign` real, upload 1px 200, attach visible en perfil, destroy `ok` + 404 CDN, fila limpiada; nota: DELETE Admin API a mano devolvió 404 HTML (usar `uploader.destroy` del SDK); **pendiente rotar `CLOUDINARY_API_SECRET`** por circular en chat |
| 2026-10-06 | Piloto ingesta real (16 clínicas) | Investigación web: 16 reales Gran Concepción (8 Concepción, 5 Talcahuano, 3 San Pedro; móviles sin local y duplicado Lientur excluidos con motivo); `piloto-concepcion.csv` + `scripts/import-csv.ts` (valida CUT/tel/URL/bbox, geocodifica Nominatim con fallback a calle, slugs únicos, auditoría; dry-run primero); 13/16 directo, 3 coords fijadas desde fuentes; demos eliminadas (colisión slug, cascada limpia); import 16/16 ids 9-24 como PENDING; `0009_verificacion_piloto.sql`: 1 VERIFIED (sitio oficial CVC) + 15 PENDING_REVIEW con log; publicación a ACTIVE (pendientes invisibles por diseño); verificado HTTP (Talcahuano 5, SOS por texto+radio, verified_only=1); e2e reescrito a datos piloto 8/8 |
| 2026-10-06 | UI faltante + lint | ESLint flat (`eslint.config.mjs`, `no-explicit-any`, fix 1 error + 3 warnings, script `lint`, paso en CI); `/reportar?clinica=` (7 motivos, sin PII, 429 controlado) + botón en perfil + API acepta `clinicSlug`; admin: `/admin/precios` (lista con ids + alta, + endpoint `POST prices/exam`), `/admin/horarios` (lista + alta con validación), `/admin/fotos` (widget firma→upload→attach), `/admin/reportes` (bandeja + triage/resolver/rechazar, + `PATCH` y clínica en listado), `/admin/verificar` (form con reglas); verificado HTTP (reporte→bandeja→RESOLVED, VERIFIED sin evidencia 400); `tsc`+`lint` api y web OK; `next build` OK (17 páginas); reporte test eliminado |

## 4. Próximo paso inmediato

1. Rotar `CLOUDINARY_API_SECRET` (circuló por chat) y re-verificar firma.
2. Completar verificación telefónica de las 15 PENDING_REVIEW + cargar servicios/precios reales por clínica.
3. Luego: legal (términos/privacidad) y deploy staging.

## 5. Reglas del log

* Una fila por entrega, con fecha UTC y archivos tocados.
* No marcar Fase como done si falta migración, validación, o test correspondiente.
* Toda decisión nueva → nuevo ADR en `docs/decisions/` + fila aquí.
