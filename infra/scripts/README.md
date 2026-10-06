# Scripts de ingesta y seeds (ver docs/ingesta-calidad.md)

- `seed-catalogs.ts`: inserta country/region/communes Biobío (CUT oficial) + services/exams/specialties/equipment.
- `import-clinics-csv.ts`: valida CSV `name,address,commune_cut,phone,website,latitude,longitude` y crea clínicas DRAFT.
