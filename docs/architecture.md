# Arquitectura — VetBiobío (monolito modular)

## 1. Diagrama

```text
Internet → Next.js (SSR/SSG, SEO) → NestJS /api/v1 → [clinics|search|prices|verification|...]
  → PostgreSQL+PostGIS (Prisma + $queryRaw geo) | Cloudinary | Mapbox (solo frontend)
```

No microservicios en MVP. No Redis sin caso medido.

## 2. Backend `apps/api/src/`

```text
auth/ users/ clinics/ locations/ communes/ regions/ professionals/ specialties/
services/ exams/ equipment/ animals/ prices/ schedules/ verification/ search/
advertisements/ premium/ media/ audit/ reports/ health/ common/
```

Regla: `controller → service (app) → repository (Prisma/$queryRaw) → DB`. Frontend nunca toca DB.
`*.geo.repository.ts` aísla PostGIS. Enums centralizados (`ClinicStatus, VerificationStatus, PriceType`).

## 3. Frontend `apps/web/src/`

```text
app/ (rutas SEO) components/ features/[clinics,search,comparison,maps]/
lib/ hooks/ types/ styles/
```

Rutas: `/veterinarias/[commune]/[slug]`, `/servicios/[slug]`. SSR listados/perfiles, SSG catálogos. Imágenes `next/image + Cloudinary`, lazy, paginación.

## 4. Cross-cutting

* TS `strict`, sin `any` injustificado. Conventional Commits. CI: `lint → typecheck → unit → integration(postgis) → build → deploy`.
* Logging `{timestamp,level,request_id,route,method,status,duration}` sin PII. `GET /health` chequea DB+PostGIS.
* Caché: solo catálogos/perfiles públicos con invalidación explícita en `VERIFY/PUBLISH`.
* Performance: evitar N+1 (`include` Prisma + `EXPLAIN ANALYZE`), `GIST/GIN`, cursor si >10k.
