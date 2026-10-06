# ADR-004 — Slug único global inmutable

> Estado: Aceptado | Fecha: 2026-10-06

## Context
URL deseada `/veterinarias/concepcion/clinica-x` se rompe si cambia la comuna o hay homónimos.

## Decision
* `clinic.slug`, `service.slug`, `exam.slug`, `specialty.slug`, `professional.slug`: `CITEXT UNIQUE NOT NULL`, inmutable tras crear (solo admin puede cambiar con redirect 301 manual).
* Generación: `slugify(nombre) + comuna-slug` solo si colisión, ej. `clinica-veterinaria-concepcion`, `clinica-veterinaria-concepcion-2`. Normalizar `ñ→n`, tildes fuera, minúsculas, `a-z0-9-`.
* Ruta pública: `/veterinarias/[communeSlug]/[clinicSlug]` donde `communeSlug` es solo prefijo SEO; el backend resuelve por `clinicSlug` e ignora/redirige si la comuna cambió. Canonical = comuna actual.
* IDs (`cuid/uuid`) solo internos y en API admin, nunca como URL pública principal.

## Alternativas
* `/veterinaria/381` — descartado: no SEO.
* Slug con comuna como PK — descartado: frágil a mudanzas.

## Consecuencias
* Se requiere tabla `slug_redirect(old_slug, new_slug)` para 301 si un slug cambia.
* Unicidad `CITEXT` evita `Clinica-X` vs `clinica-x`.
