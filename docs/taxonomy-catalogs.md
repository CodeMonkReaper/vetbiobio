# Catálogos y taxonomía — VetBiobío

> Ver ADR-002. Todos los catálogos: `id, name, slug UNIQUE, description, is_active, sort_order`.

## 1. Regla de oro

* Pregunta guía: **¿se cobra y se agenda? → `service`. ¿emite un resultado diagnóstico? → `exam`. ¿es un fierro/sala? → `equipment`. ¿es un área médica? → `specialty`.**
* Radiografía y Ecografía son **`exam`**. El equipo (`equipo rayos-X`, `ecógrafo`) es `equipment`.

## 2. `service` (acto clínico)

Slugs iniciales (administrables):

```text
consulta-general, vacunacion, desparasitacion, cirugia-general,
hospitalizacion, atencion-urgencias, esterilizacion, castracion,
limpieza-dental, odontologia-clinica, peluqueria, eutanasia
```

Nota: `atencion-urgencias` existe como servicio histórico, pero el filtro
"atiende urgencias ahora / 24h" se resuelve por atributos `clinic.is_emergency, is_24h`
(ADR + §4 urgencias). No filtrar urgencias por string matching.

## 3. `exam` (diagnóstico)

```text
radiografia, ecografia, hemograma, perfil-bioquimico, urianalisis,
test-parvovirus, test-distemper, citologia, biopsia, electrocardiograma
```

Campos propios en `clinic_exam`: `sample_type, preparation_notes, turnaround_hours`.

## 4. `specialty`

```text
dermatologia, cardiologia, traumatologia, neurologia, oftalmologia,
oncologia, odontologia-especialidad, medicina-interna, cirugia-especialidad,
imagenologia, medicina-felina, medicina-exoticos
```

Relación: `professional_specialty(professional_id, specialty_id)` y
`clinic_specialty` derivada ( DISTINCT de profesionales activos ) o declarada.

## 5. `equipment`

```text
equipo-rayos-x, ecografo, laboratorio-clinico, quirofano,
hospitalizacion-jaulas, incubadora, monitor-multiparametro,
anestesia-inhalatoria, endoscopio
```

Solo capacidad. Nunca precio directo.

## 6. `animal_species`

```text
DOG, CAT, RABBIT, BIRD, REPTILE, RODENT, EXOTIC, OTHER
```

Enum en BD + tabla `clinic_animal(clinic_id, species)` para filtro "atiende gatos/exóticos".

## 7. `commune / region / country`

Jerarquía normalizada `country → region → commune` con código oficial CUT (SUBDERE/INE).
Región 08 Biobío, 33 comunas (ver `database-design.md §15`). Nunca texto libre en `clinic`.

## 8. Convenciones slug

`lowercase, sin tildes, ñ→n, a-z0-9-`, único por catálogo, inmutable. Ej: `clinica-veterinaria-concepcion-2`.
