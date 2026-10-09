# ADR-008 — Ingesta Masiva con Staging, Dry-Run y Deduplicación Híbrida PostGIS

> Estado: Aceptado | Fecha: 2026-10-08 | Fase: 3 y 4

## 1. Contexto

La carga masiva de datos proveniente de fuentes públicas, catastros municipales o aportes de gremios presenta problemas recurrentes de calidad:
- Nombres con variaciones ortográficas (ej. *"Clínica Veterinaria Los Ángeles"* vs *"Vet Los Ángeles SpA"*).
- Múltiples registros con el mismo número telefónico central.
- Coordenadas geográficas imprecisas o fuera de la región.
- Riesgo de sobrescribir información ya verificada por moderadores humanos.

Permitir inserciones directas a las tablas de producción (`clinic`, `clinic_location`) sin aislamiento corrompe el catálogo geográfico y destruye la integridad relacional.

## 2. Decisión

Implementar un flujo de ingesta desacoplado en dos etapas con previsualización determinista (*Dry-Run*):

1. **Aislamiento en Tablas de Staging:**
   - La carga inicial solo escribe en `import_batch` e `import_batch_row`.
   - Las filas conservan su representación original (`raw_data`) y su estructura tipada (`parsed_data`).
2. **Deduplicador Multicriterio Ponderado (50 / 30 / 20):**
   - **Teléfono E.164 (50%):** Coincidencia exacta de teléfono normalizado.
   - **Similitud Trigramas `pg_trgm` (30%):** Búsqueda difusa de nombres (`similarity >= 0.55`).
   - **Proximidad Espacial PostGIS (20%):** Coordenadas a menos de 150 metros (`ST_DWithin` en `GEOGRAPHY(Point,4326)`).
   - $\text{Score} \ge 0.70 \to$ clasificado como `POSSIBLE_DUPLICATE` (acción sugerida: `UPDATE`).
   - $\text{Score} < 0.30 \to$ clasificado como `VALID` (acción sugerida: `INSERT`).
3. **Cálculo de Diferencias (*Diff Engine*):**
   - Se compara campo a campo el registro propuesto con el existente, generando un mapa de cambios (`differences`).
4. **Aplicación Transaccional Explícita:**
   - Nada se escribe en `clinic` hasta que el moderador aprueba el lote (`POST /admin/import/batches/:id/apply`).
   - Toda fila aplicada genera registros en `audit_log` con `source = 'import_batch_#id'`.
   - Se dispara la reevaluación automática del Motor de Calidad de Datos para actualizar el índice de confiabilidad de inmediato.

## 3. Consecuencias

* **Positivas:**
  * Cero riesgo de sobrescritura accidental de clínicas verificadas.
  * Los moderadores pueden corregir acciones individuales antes de comprometer los cambios en la base de datos.
  * Trazabilidad total de qué lote y qué usuario originó cada clínica del directorio.
* **Compromisos:**
  * Almacenamiento temporal adicional en disco para tablas de staging (mitigado mediante purga programada o retención acotada).
