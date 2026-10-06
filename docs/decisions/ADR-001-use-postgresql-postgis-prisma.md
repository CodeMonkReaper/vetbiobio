# ADR-001 — PostgreSQL + PostGIS con Prisma + SQL parametrizado

> Estado: Aceptado | Fecha: 2026-10-06

## Context
Se requiere geoespacial real (`GEOGRAPHY(Point,4326)`, `ST_DWithin`, índice `GIST`) + ORM productivo. Prisma no tiene tipo nativo geography ni operadores espaciales.

## Decision
* Fuente de verdad geo: columnas `latitude DOUBLE PRECISION + longitude DOUBLE PRECISION` + columna `location GEOGRAPHY(Point,4326)` mantenida por trigger/migración.
* Todo CRUD estándar vía Prisma. Toda query geo/ranking/full-text compleja vía `prisma.$queryRaw` parametrizado.
* Extensión `postgis, pg_trgm` habilitadas en migración `0000_enable_extensions`.
* Validar con `EXPLAIN ANALYZE` antes de agregar índices.

## Alternativas
* TypeORM/Drizzle con mejor soporte espacial — descartado: menor DX/madurez, equipo ya define Prisma.
* MongoDB geo — descartado: se pierde integridad relacional y SEO estructurado.
* Cálculo haversine en app — descartado: impreciso y no usa índice.

## Consecuencias
* Migraciones deben crear trigger `sync_location()` en `clinic_location`.
* Repositorios aíslan `$queryRaw` en `*.geo.repository.ts`, nunca en controllers.
* Tests de integración con imagen `postgis/postgis`.
