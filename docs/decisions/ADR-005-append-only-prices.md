# ADR-005 — Precios append-only + vista current

> Estado: Aceptado | Fecha: 2026-10-06

## Context
Sobrescribir `amount` pierde historia y fecha de verificación ("último precio verificado").

## Decision
* Tabla `clinic_service_price` y `clinic_exam_price` append-only: `(min_amount INT, max_amount INT, pricing_type FIXED|RANGE|FROM|CONTACT, currency CHAR(3) DEFAULT 'CLP', valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_until DATE NULL, ...verificación)`.
* Reglas: `min>=0, max>=min, CONTACT ⇒ min/max NULL`, `FIXED ⇒ min=max`, `RANGE ⇒ min<max`, `FROM ⇒ min NOT NULL, max NULL`.
* Vigente = `valid_until IS NULL`. Al crear nuevo precio: `UPDATE anterior SET valid_until = new.valid_from - 1` + `INSERT nuevo`, en transacción. Nunca `UPDATE amount`.
* Vista `v_current_service_price` / `v_current_exam_price` (`WHERE valid_until IS NULL`). API pública lee la vista; admin escribe la tabla.
* Dinero `INTEGER` pesos CLP, nunca `FLOAT`.

## Alternativas
* Columna mutable `price.amount` — descartado: sin historia.
* Event sourcing completo — descartado: overkill MVP.

## Consecuencias
* Comparación y ordenamiento por precio usan la vista. Historial visible en perfil ("$20.000 el 01/08 → $25.000 el 01/10").
