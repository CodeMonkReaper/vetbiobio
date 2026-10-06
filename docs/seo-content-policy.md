# SEO y política de contenido

## 1. Rutas
```text
/veterinarias /veterinarias/[commune] /veterinarias/[commune]/[clinicSlug]
/servicios/[slug] /examenes/[slug] /especialidades/[slug]
/veterinarias/[commune]/[examSlug]  (combo, solo si N>=3)
```
Backend resuelve por `clinicSlug`; `commune` es prefijo decorativo con canonical a comuna actual + `slug_redirect` 301 si cambió.

## 2. Anti-thin-content
No generar miles de páginas. Combo comuna×examen solo si `>=3 clínicas ACTIVE`; si no, `noindex,follow`. Sin clínicas: 404 suave + sugerencias, no página vacía indexable.

## 3. Metadata
Cada página: `title, description, canonical, robots, OG, Twitter`. Ej: `Clínica X en Concepción | VetBiobío`. Fotos con `alt`.

## 4. Schema.org (solo props oficiales)
`VeterinaryCare + PostalAddress + GeoCoordinates + OpeningHoursSpecification + Person (profesional)`. No inventar props. Validar con Rich Results Test.
