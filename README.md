# VetBiobío — Directorio veterinario Región del Biobío

> Estado: PRE-MVP / Architecture Design
> Stack: Next.js + NestJS + PostgreSQL/PostGIS + Prisma + Docker + pnpm

## Estructura

```text
vetbiobio/
├── apps/web/          # Next.js (público + admin)
├── apps/api/          # NestJS API REST /api/v1
├── packages/config/   # config compartida TS/eslint
├── infra/docker/      # Dockerfiles
├── infra/scripts/     # seeds, ingesta CSV
├── docs/              # documentación técnica y producto
│   ├── decisions/     # ADRs
│   ├── database-design.md
│   ├── api.md
│   ├── architecture.md
│   ├── taxonomy-catalogs.md
│   ├── verification-policy.md
│   ├── ingesta-calidad.md
│   ├── seo-content-policy.md
│   ├── security-privacy.md
│   └── backlog-mvp.md
├── docker-compose.yml
├── .env.example
└── project_context.md
```

## Quickstart (cuando exista código)

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm --filter api prisma migrate dev
pnpm dev
```

## Documentos

Leer en este orden:

1. `docs/decisions/` (ADR-001 a ADR-005)
2. `docs/taxonomy-catalogs.md`
3. `docs/verification-policy.md`
4. `docs/database-design.md`
5. `docs/api.md` + `docs/architecture.md`
6. `docs/ingesta-calidad.md`, `docs/seo-content-policy.md`, `docs/security-privacy.md`
7. `docs/backlog-mvp.md`

## Reglas

* Monolito modular, no microservicios en MVP.
* Verificación por campo, no global. Premium ≠ verificado.
* Precios append-only + vista current. Montos `integer CLP`.
* Slugs únicos globales inmutables.
* Sin secretos en git. Ver `security-privacy.md`.
