# Política de verificación — VetBiobío

> Ver ADR-003. Premium ≠ verificado. Verificado requiere evidencia.

## 1. Estados

```text
UNVERIFIED → PENDING_REVIEW → VERIFIED → OUTDATED
                          ↘ REJECTED
```

* `VERIFIED` solo con evidencia suficiente (ver §3).
* `OUTDATED`: auto-marcado por job si `next_review_at < hoy`, o manual por reporte válido. No borra el dato.
* `REJECTED`: dato falso / no subsanable. Se oculta de pública, queda en auditoría.

## 2. Alcance por campo

Cada registro verificable lleva:

```text
verification_status, verified_at, verification_source, verification_method,
verified_by, notes, evidence_url NULL, next_review_at
```

Entidades: `clinic, clinic_location, clinic_service, clinic_exam, *_price, schedule, clinic_professional, clinic_photo`.

El perfil público muestra badge **por sección**, no global:

* `✓ Información verificada — Verificada el 06/10/2026`
* `⚠ Posiblemente desactualizada — Última verificación: 15/02/2026`

## 3. Fuentes y evidencia mínima

```text
OFFICIAL_WEBSITE | OFFICIAL_SOCIAL_MEDIA | PHONE | WHATSAPP |
EMAIL | DIRECT_COMMUNICATION | PUBLIC_SOURCE | ADMIN_RESEARCH | OTHER
```

* Precio `VERIFIED` requiere: fuente `OFFICIAL_* / PHONE / WHATSAPP / DIRECT` + `evidence_url` o nota de llamada (fecha + quién atendió) + `valid_from`.
* Horario `VERIFIED` requiere foto cartel/horario web o confirmación telefónica.
* Profesional activo requiere nómina web o confirmación clínica.

## 4. Vigencia (SLA)

* Precios: `next_review_at = verified_at + 90 días`.
* Horarios/contacto: `+ 180 días`.
* Ficha base clínica: `+ 365 días`.
* Job diario: `UPDATE ... SET status=OUTDATED WHERE next_review_at < CURRENT_DATE AND status=VERIFIED`.

## 5. Reportes "información incorrecta"

Motivos: `CLOSED, WRONG_PRICE, WRONG_SCHEDULE, WRONG_PHONE, SERVICE_UNAVAILABLE, PROFESSIONAL_LEFT, OTHER`.
Tabla `report(id, clinic_id, reason, message, reporter_hash NULL, status OPEN|TRIAGED|RESOLVED|REJECTED, created_at)`.
Rate-limit 5/h por IP + honeypot. Sin datos personales del reportante en MVP.

## 6. Auditoría

`verification_log + audit_log(action CREATE|UPDATE|VERIFY|UNVERIFY|DEACTIVATE|PUBLISH, entity_type, entity_id, old_values JSONB, new_values JSONB, user_id, ip, created_at)`.
Nunca loggear passwords/tokens.
