# ADR-009 — Motor de Calidad de Datos Declarativo, Fingerprint Idempotente y Scoring Explicable

> Estado: Aceptado | Fecha: 2026-10-08 | Fase: 2

## 1. Contexto

Un directorio de salud veterinaria pierde su valor principal si contiene datos degradados: teléfonos fijos o móviles en formatos inválidos, coordenadas GPS fuera de la región o en el mar, inconsistencias en rangos de atención de urgencia, o información de contacto sin verificar por más de 180 días.

Abordar este problema mediante scripts ad-hoc o validaciones dispersas en controladores presentaba serias deficiencias:
1. **Proliferación de Duplicados en Monitoreo:** Un escaneo diario (cron) que inserte incidencias sin control generaría miles de registros redundantes sobre el mismo campo si este sigue sin corregirse.
2. **Falta de Auto-Resolución (*Auto-Healing*):** Si un administrador o clínica corrige el dato mediante la plataforma, la incidencia debería cerrarse automáticamente en la próxima ejecución sin requerir intervención manual para cambiar estados.
3. **Opacidad del Puntaje de Confiabilidad:** Asignar puntajes tipo "caja negra" genera desconfianza en los usuarios y riesgos legales si una clínica percibe discriminación arbitraria. Se requiere un cálculo transparente, reproducible y respaldado por un descargo legal.

## 2. Decisión

Implementar un **Motor de Calidad de Datos Declarativo** en NestJS con persistencia idempotente en PostgreSQL:

### 2.1. Arquitectura de Reglas Desacopladas (`QualityRule`)
Cada regla de calidad implementa una interfaz común estricta e independiente:
```typescript
export interface QualityRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evaluate(context: QualityEvaluationContext): Promise<QualityViolation[]>;
}
```
Se diseñaron 7 reglas puras que cubren:
- Coordenadas geográficas dentro del polígono delimitador de la Región del Biobío.
- Formato y consistencia de número telefónico chileno (E.164: móvil `+569...` o red fija `+5641...`).
- Presencia de datos de contacto mínimos para emergencias.
- Consistencia horaria (horarios solapados o 24/7 sin especificación).
- Precios desactualizados o inexistentes en consultas básicas.
- Verificación de campo expirada (>180 días sin re-validación telefónica/presencial).
- Integridad de slug y metadatos SEO.

### 2.2. Huella Idempotente SHA-256 (`unique_open_issue_fingerprint`)
Para evitar duplicación de incidencias abiertas:
1. Se computa un hash SHA-256 determinista a partir de la tupla:
   `sha256(clinicId + ":" + ruleId + ":" + (fieldName || "GLOBAL"))`
2. En la base de datos se mantiene un índice único parcial:
   ```sql
   CREATE UNIQUE INDEX "idx_data_quality_issue_open_fingerprint"
   ON "data_quality_issue" ("clinic_id", "rule_id", "field_name")
   WHERE "status" = 'OPEN';
   ```
3. Al ejecutar el escáner, si una violación ya existe en estado `OPEN`, se omite la inserción. Si la violación no existía, se crea con estado `OPEN`.

### 2.3. Ciclo de Vida y Auto-Healing
El motor compara las violaciones actuales con las incidencias `OPEN` registradas:
- **Nueva anomalía detectada:** Se registra con `status = 'OPEN'`.
- **Anomalía subsanada:** Si una incidencia estaba `OPEN` pero en el nuevo escaneo la regla ya no arroja violación, el motor transiciona automáticamente el registro a `RESOLVED` con `resolution_type = 'AUTO_HEALED'` y fecha de resolución.
- **Resolución manual:** El operador administrativo puede forzar el cierre (`RESOLVED_MANUAL` o `FALSE_POSITIVE`) indicando motivo y notas de auditoría.

### 2.4. Scoring Explicable y Descargo Legal Obligatorio
El puntaje de confiabilidad (0-100) se calcula algorítmicamente mediante penalizaciones ponderadas por severidad:
- `CRITICAL`: -25 pts
- `HIGH`: -15 pts
- `MEDIUM`: -8 pts
- `LOW`: -3 pts
- Base inicial: 100 pts (piso en 0).

**Explicabilidad:** Cada respuesta de la API y componente de la UI entrega el desglose exacto de deducciones y sugerencias de remediación.
**Descargo Legal:** Por exigencia regulatoria y ética, toda visualización pública del score incluye el descargo:
> *"Puntaje de confiabilidad calculado algorítmicamente según completitud y verificación de datos públicos. No constituye certificación sanitaria ni juicio sobre la competencia médica veterinaria."*

## 3. Alternativas Evaluadas

| Enfoque | Pros | Contras | Veredicto |
|---|---|---|---|
| **Triggers y Procedimientos Almacenados en PL/pgSQL** | Máxima velocidad de ejecución en base de datos. | Difícil de probar unitariamente, lógica de normalización E.164 chilena compleja de mantener en SQL, acoplamiento fuerte. | **Descartado** |
| **Cálculo al Vuelo (En memoria, sin persistencia)** | Cero espacio en disco, sin migraciones. | Imposibilita trazabilidad histórica de resolución, no permite que administradores resuelvan incidencias con notas, inviable para dashboards con agregaciones. | **Descartado** |
| **Motor Declarativo en TypeScript + Persistencia Idempotente SHA-256** | 100% testeable con mocks y fixtures, reglas desacopladas y extensibles, persistencia con auto-healing y auditoría completa. | Requiere ejecución programada (cron diario) o bajo demanda. | **SELECCIONADO** |

## 4. Consecuencias

* **Positivas:**
  * Cero duplicación de alertas abiertas ante ejecuciones continuas.
  * Auto-cierre de incidencias sin fricción cuando los datos se corrigen en la plataforma.
  * Score totalmente transparente y auditable para usuarios y clínicas.
* **Compromisos:**
  * El escaneo completo de todo el catálogo debe ejecutarse en lotes o en horarios de baja demanda (cron a las 03:00 AM) para no generar contención en bases de datos con cientos de miles de registros.
