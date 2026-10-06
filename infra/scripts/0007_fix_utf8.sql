-- Fix 0007_utf8 — repara tildes corruptas (? literal) por pipe de PowerShell 5.1.
-- Aplicar SOLO vía: docker cp + psql -f (nunca Get-Content | docker exec).
-- Claves (cut/slug) son ASCII y están intactas.

UPDATE commune SET name = v.name FROM (VALUES
  ('08101','Concepción'),('08110','Talcahuano'),('08111','Tomé'),('08112','Hualpén'),
  ('08204','Los Álamos'),('08205','Cañete'),('08207','Tirúa'),
  ('08301','Los Ángeles'),('08305','Mulchén'),('08311','Santa Bárbara'),('08314','Alto Biobío')
) AS v(cut, name) WHERE commune.cut = v.cut;

UPDATE service SET name = v.name FROM (VALUES
  ('vacunacion','Vacunación'),('desparasitacion','Desparasitación'),
  ('cirugia-general','Cirugía general'),('hospitalizacion','Hospitalización'),
  ('atencion-urgencias','Atención de urgencias'),('esterilizacion','Esterilización'),
  ('castracion','Castración'),('peluqueria','Peluquería')
) AS v(slug, name) WHERE service.slug = v.slug;

UPDATE exam SET name = v.name FROM (VALUES
  ('radiografia','Radiografía'),('ecografia','Ecografía'),
  ('perfil-bioquimico','Perfil bioquímico'),('urianalisis','Urianálisis'),('citologia','Citología')
) AS v(slug, name) WHERE exam.slug = v.slug;

UPDATE specialty SET name = v.name FROM (VALUES
  ('dermatologia','Dermatología'),('cardiologia','Cardiología'),
  ('traumatologia','Traumatología'),('neurologia','Neurología'),
  ('oftalmologia','Oftalmología'),('oncologia','Oncología'),
  ('cirugia-especialidad','Cirugía'),('imagenologia','Imagenología')
) AS v(slug, name) WHERE specialty.slug = v.slug;

UPDATE equipment SET name = v.name FROM (VALUES
  ('ecografo','Ecógrafo'),('laboratorio-clinico','Laboratorio clínico'),
  ('quirofano','Quirófano'),('monitor-multiparametro','Monitor multiparámetro')
) AS v(slug, name) WHERE equipment.slug = v.slug;

UPDATE clinic SET name = v.name, description = v.descr FROM (VALUES
  ('clinica-veterinaria-concepcion','Clínica Veterinaria Concepción','Clínica general con urgencias y dermatología.'),
  ('veterinaria-talcahuano','Veterinaria Talcahuano','Atención general económica en el puerto.'),
  ('clinica-los-angeles','Clínica Los Ángeles','Medicina general. Precios por cotización.'),
  ('veterinaria-san-pedro-24h','Veterinaria San Pedro 24h','Urgencias 24 horas.')
) AS v(slug, name, descr) WHERE clinic.slug = v.slug;

UPDATE clinic_location SET address = 'Av. Paicaví 1234'
WHERE clinic_id = (SELECT id FROM clinic WHERE slug = 'clinica-veterinaria-concepcion');

UPDATE professional SET first_name = 'María', last_name = 'González'
WHERE slug = 'maria-gonzalez';

-- Refresca tsv tras la corrección (dispara triggers vía UPDATE tocando updated_at... no existe; llamar función).
SELECT refresh_clinic_search(id) FROM clinic;
