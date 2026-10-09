# ADR-007 — Procesamiento Asíncrono de Ingesta en PostgreSQL con SKIP LOCKED

> Estado: Aceptado | Fecha: 2026-10-08 | Fase: 3

## 1. Contexto

La carga masiva de datos (CSV de clínicas veterinarias, aranceles y servicios) involucra procesamiento intensivo: normalización telefónica, validación sintáctica, deduplicación multicriterio (`ST_DWithin` + trigramas) y eventual geocodificación o matching.

Ejecutar esta operación de manera sincrónica dentro de una petición HTTP (`POST /admin/import`) presenta riesgos críticos:
1. **Timeouts en HTTP/Reverse Proxy:** Peticiones de más de 30-60 segundos son abortadas por gateways, proxies inversos (Cloud Run, Nginx, Vercel) y clientes.
2. **Degradación del Event Loop:** Procesar miles de registros bloquea la concurrencia de la API en Node.js.
3. **Pérdida de Estado:** Si el proceso falla a mitad de camino, se carece de visibilidad sobre qué filas se procesaron y cuáles fallaron.

La solución convencional suele ser introducir **Redis + BullMQ**. Sin embargo, para este proyecto:
- Introduce un componente de infraestructura adicional, incrementando costos de operación, memoria y superficie de fallos.
- Rompe la transaccionalidad ACID: si un trabajo en Redis se completa pero falla la escritura en Postgres, se produce inconsistencia de datos que requeriría patrones de compensación (Saga/Outbox).

## 2. Decisión

Implementar una cola de trabajos asíncrona directamente en **PostgreSQL 16** utilizando **`SELECT ... FOR UPDATE SKIP LOCKED`**:

1. **Tabla de Lotes y Filas de Staging (`import_batch` e `import_batch_row`):**
   - La carga del archivo genera un registro de lote en estado `STAGED` o `PENDING_ANALYSIS` y almacena las filas en bruto dentro de `import_batch_row`.
   - La API HTTP responde inmediatamente con `202 Accepted` y el identificador `batchId`.
2. **Worker Asíncrono no bloqueante:**
   - Un worker en segundo plano dentro del monolito modular toma filas pendientes mediante:
     ```sql
     SELECT id FROM import_batch_row
     WHERE batch_id = $1 AND status = 'PENDING'
     ORDER BY id ASC
     LIMIT $2
     FOR UPDATE SKIP LOCKED;
     ```
   - Si se levantan múltiples instancias del worker o contenedor, `SKIP LOCKED` garantiza que ningún worker intente procesar la misma fila ni se bloquee esperando bloqueos de otros.
3. **Modo Dry-Run y Aplicación Transaccional:**
   - Las filas analizadas pasan a estados informativos (`VALID`, `POSSIBLE_DUPLICATE`, `INVALID`) sin mutar las tablas de producción (`clinic`, `clinic_location`, `schedule`, `prices`).
   - El administrador inspecciona las diferencias en la UI y solo al confirmar *"Aplicar Lote"* (`POST /admin/import/batches/:id/apply`), las filas validadas se transfieren a producción dentro de un bloque transaccional `$transaction` con auditoría en `audit_log`.

## 3. Alternativas Evaluadas

| Opción | Ventajas | Desventajas | Veredicto |
|---|---|---|---|
| **Redis + BullMQ** | Métricas listas, ecosistema amplio en NestJS. | Duplica infraestructura, carece de transaccionalidad ACID con PostgreSQL, costo de despliegue extra. | **Descartado** por sobre-ingeniería innecesaria. |
| **Procesamiento HTTP Sincrónico** | Muy simple. | Timeouts de conexión, sin trazabilidad, bloqueo del event loop. | **Descartado** por fragilidad en producción. |
| **PostgreSQL con `SKIP LOCKED`** | Cero infraestructura extra, transaccionalidad pura (ACID), soporte nativo en PG 16, altamente defendible en entrevistas. | Ligeramente mayor I/O en disco que memoria RAM pura (despreciable para volúmenes < 100k filas/día). | **SELECCIONADO** |

## 4. Consecuencias

* **Positivas:**
  * Arquitectura monolítica modular limpia: PostgreSQL es la única fuente de verdad.
  * Resiliencia: si el servidor se reinicia, las filas pendientes continúan exactamente donde quedaron.
  * Visibilidad y auditoría total por fila directamente consultable vía SQL.
* **Compromisos:**
  * Se deben crear índices adecuados en `(batch_id, status)` para garantizar consultas rápidas en `SKIP LOCKED`.
  * Se requiere un mecanismo de reintento exponencial acotado (máximo 3 reintentos) para evitar loops de filas venenosas.
