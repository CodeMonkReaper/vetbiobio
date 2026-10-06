# Backlog MVP — fases y Definition of Done

## Fase 0 Diseño ✓ (esta carpeta)
ADRs, taxonomía, verification-policy, database-design, api, architecture. DoD: docs coherentes, sin `TODO` bloqueante.

## Fase 1 Foundation
Next+Nest+PostGIS+Docker+CI+auth admin (`user`, login, RBAC). Aceptación: `docker compose up`, `GET /health OK`, login admin crea clínica DRAFT.

## Fase 2 Data model
Migraciones §13 + seeds 33 comunas + catálogos + CRUD admin clínicas/ubicación/servicios/exámenes/precios append-only/horarios/profesionales/fotos + `verification_log/audit_log`. Aceptación: crear clínica con precio histórico y verificar sección.

## Fase 3 Public platform
Home buscador (`¿Qué? + ¿Dónde?`), listado+filtros (§26)+mapa Mapbox, perfil (§73)+badge por sección+disclaimers, SEO rutas+metadata+Schema.org.

## Fase 4 Verification
`next_review_at` + job OUTDATED + bandeja `reports` (OPEN→RESOLVED) + auditoría visible en admin.

## Fase 5 Comparison
Comparar hasta 3 (URL persistente `?ids=a,b`), tabla precio/distancia/servicios/exámenes/urgencias/verificación. Orden `DISTANCE/PRICE/VERIFICATION`.

## Fase 6 Monetization (post-validación tráfico)
`premium_subscription + advertisement`, badge `Patrocinado`, nunca altera verificación.

## Fase 7 Optimization
Lighthouse, `EXPLAIN ANALYZE`, caché catálogos, Sentry, analytics `search→profile→contact`.

## DoD global (§84)
Compila, `tsc` limpio, lint+tests OK, migración si toca BD, validación+errores, responsive+a11y básica, sin secretos, sin regresiones.

## Fuera MVP (§82)
Reservas, pagos, historia clínica, telemedicina, chat, app nativa, marketplace, reseñas (solo `report`).
