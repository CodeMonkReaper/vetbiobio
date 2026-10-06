-- Seed 0002 — catálogos iniciales (ver docs/taxonomy-catalogs.md). Idempotente.
-- Radiografía/Ecografía son EXÁMENES (decisión #3).

INSERT INTO service (name, slug, sort_order) VALUES
  ('Consulta general','consulta-general',10),('Vacunación','vacunacion',20),
  ('Desparasitación','desparasitacion',30),('Cirugía general','cirugia-general',40),
  ('Hospitalización','hospitalizacion',50),('Atención de urgencias','atencion-urgencias',60),
  ('Esterilización','esterilizacion',70),('Castración','castracion',80),
  ('Limpieza dental','limpieza-dental',90),('Peluquería','peluqueria',100)
ON CONFLICT DO NOTHING;

INSERT INTO exam (name, slug, sort_order) VALUES
  ('Radiografía','radiografia',10),('Ecografía','ecografia',20),
  ('Hemograma','hemograma',30),('Perfil bioquímico','perfil-bioquimico',40),
  ('Urianálisis','urianalisis',50),('Test parvovirus','test-parvovirus',60),
  ('Test distemper','test-distemper',70),('Citología','citologia',80),('Biopsia','biopsia',90)
ON CONFLICT DO NOTHING;

INSERT INTO specialty (name, slug) VALUES
  ('Dermatología','dermatologia'),('Cardiología','cardiologia'),
  ('Traumatología','traumatologia'),('Neurología','neurologia'),
  ('Oftalmología','oftalmologia'),('Oncología','oncologia'),
  ('Medicina interna','medicina-interna'),('Cirugía','cirugia-especialidad'),
  ('Imagenología','imagenologia'),('Medicina felina','medicina-felina')
ON CONFLICT DO NOTHING;

INSERT INTO equipment (name, slug) VALUES
  ('Equipo rayos-X','equipo-rayos-x'),('Ecógrafo','ecografo'),
  ('Laboratorio clínico','laboratorio-clinico'),('Quirófano','quirofano'),
  ('Incubadora','incubadora'),('Monitor multiparámetro','monitor-multiparametro'),
  ('Anestesia inhalatoria','anestesia-inhalatoria'),('Endoscopio','endoscopio')
ON CONFLICT DO NOTHING;
