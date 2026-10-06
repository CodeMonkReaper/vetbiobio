# ADR-003 — Verificación por campo (field-level), no global

> Estado: Aceptado | Fecha: 2026-10-06

## Context
Un booleano `clinic.verified` es engañoso si un precio u horario está desactualizado.

## Decision
* Cada registro verificable lleva: `verification_status (UNVERIFIED|PENDING_REVIEW|VERIFIED|OUTDATED|REJECTED)`, `verified_at TIMESTAMPTZ NULL`, `verification_source (enum)`, `verification_method TEXT`, `next_review_at DATE NULL`.
* Tablas verificables: `clinic, clinic_location, clinic_service, clinic_exam, clinic_service_price, schedule, clinic_professional, clinic_photo`.
* Tabla `verification_log(id, entity_type, entity_id, old_status, new_status, changed_by, source, method, notes, created_at)` append-only.
* UI perfil: muestra `max(verified_at)` + badge por sección (`✓ Verificada el dd/mm/aaaa` / `⚠ Posiblemente desactualizada`). Nunca un único badge global como verdad absoluta.
* Job diario marca `OUTDATED` si `next_review_at < today AND status = VERIFIED`.

## Alternativas
* Badge global único — descartado: transmite certeza falsa.
* Verificación solo a nivel clínica — descartado: no permite confiar en precio puntual.

## Consecuencias
* Más columnas pero auditoría real. Ver `docs/verification-policy.md` y `docs/database-design.md §12`.
