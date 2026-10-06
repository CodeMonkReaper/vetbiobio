# ADR-002 — Taxonomía: service vs exam vs equipment

> Estado: Aceptado | Fecha: 2026-10-06

## Context
`Radiografía / Ecografía / Laboratorio` aparecía como servicio, examen y equipamiento. Triple fuente rompe filtros y comparación.

## Decision
* `service`: acto clínico que se cobra y agenda (consulta, vacunación, cirugía, hospitalización, urgencias-atención, peluquería).
* `exam`: procedimiento diagnóstico con resultado (radiografía, ecografía, hemograma, perfil bioquímico, test parvovirus/distemper, citología, biopsia). **Radiografía y Ecografía son `exam`.**
* `equipment`: capacidad física instalada (equipo rayos-X, ecógrafo, quirófano, laboratorio clínico, anestesia inhalatoria).
* Regla: un `clinic` ofrece `services` vía `clinic_service` y `exams` vía `clinic_exam`. `equipment` solo declara capacidad, nunca precio directo. Si un examen requiere equipo, se documenta en descripción, sin FK dura en MVP.

## Alternativas
* Tabla única `offering(type)` — descartado: precios y filtros difieren (examen tiene muestra/preparación; servicio tiene duración).
* Todo como `service` — descartado: búsqueda "dónde hacen radiografía" se contamina con "tienen equipo rayos-X pero no lo operan".

## Consecuencias
* Catálogos separados administrables. Slug único por catálogo.
* Búsqueda pondera `exam > equipment` para query "radiografía".
* Ver `docs/taxonomy-catalogs.md`.
