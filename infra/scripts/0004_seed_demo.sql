-- Seed 0004_demo — 4 clínicas demo para verificar búsqueda geo + full-text.
-- Idempotente por slug (ON CONFLICT DO NOTHING en clinic; resto con NOT EXISTS).
-- Clínicas: Concepción (urgencias+dermatología), Talcahuano (económica),
-- Los Ángeles (CONTACT/sin verificar), San Pedro (24h, OUTDATED).

-- 1) Clínicas base
INSERT INTO clinic (name, slug, description, phone_e164, website, status, verification_status, verified_at, next_review_at, is_emergency, is_24h) VALUES
  ('Clínica Veterinaria Concepción','clinica-veterinaria-concepcion','Clínica general con urgencias y dermatología.','+56911111111','https://demo-conce.example.cl','ACTIVE','VERIFIED','2026-09-01', CURRENT_DATE + 180, TRUE, FALSE),
  ('Veterinaria Talcahuano','veterinaria-talcahuano','Atención general económica en el puerto.','+56922222222',NULL,'ACTIVE','VERIFIED','2026-09-15', CURRENT_DATE + 180, FALSE, FALSE),
  ('Clínica Los Ángeles','clinica-los-angeles','Medicina general. Precios por cotización.','+56933333333',NULL,'ACTIVE','UNVERIFIED',NULL,NULL, FALSE, FALSE),
  ('Veterinaria San Pedro 24h','veterinaria-san-pedro-24h','Urgencias 24 horas.','+56944444444',NULL,'ACTIVE','OUTDATED','2026-02-01', CURRENT_DATE - 10, TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2) Ubicaciones
INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location, verification_status, verified_at) SELECT
  c.id, v.address, (SELECT id FROM commune WHERE slug = v.commune), v.lat, v.lon,
  ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326)::geography, 'VERIFIED', '2026-09-01'
FROM clinic c JOIN (VALUES
  ('clinica-veterinaria-concepcion','Av. Paicaví 1234','concepcion',-36.8270,-73.0503),
  ('veterinaria-talcahuano','Av. Colón 567','talcahuano',-36.7175,-73.0900),
  ('clinica-los-angeles','Av. Alemania 890','los-angeles',-37.4707,-72.3500),
  ('veterinaria-san-pedro-24h','Av. San Pedro 123','san-pedro-de-la-paz',-36.8435,-73.0965)
) AS v(slug, address, commune, lat, lon) ON c.slug = v.slug
ON CONFLICT DO NOTHING;

-- 3) Servicios por clínica
INSERT INTO clinic_service (clinic_id, service_id, verification_status, verified_at)
SELECT c.id, s.id, 'VERIFIED', '2026-09-01' FROM clinic c, service s
WHERE (c.slug, s.slug) IN (
  ('clinica-veterinaria-concepcion','consulta-general'),('clinica-veterinaria-concepcion','vacunacion'),('clinica-veterinaria-concepcion','cirugia-general'),
  ('veterinaria-talcahuano','consulta-general'),('veterinaria-talcahuano','vacunacion'),
  ('clinica-los-angeles','consulta-general'),
  ('veterinaria-san-pedro-24h','consulta-general'),('veterinaria-san-pedro-24h','atencion-urgencias'))
ON CONFLICT DO NOTHING;

-- 4) Exámenes por clínica (radiografía/ecografía son exam)
INSERT INTO clinic_exam (clinic_id, exam_id, verification_status, verified_at)
SELECT c.id, e.id, 'VERIFIED', '2026-09-01' FROM clinic c, exam e
WHERE (c.slug, e.slug) IN (
  ('clinica-veterinaria-concepcion','radiografia'),('clinica-veterinaria-concepcion','ecografia'),('clinica-veterinaria-concepcion','hemograma'),
  ('veterinaria-talcahuano','radiografia'),
  ('clinica-los-angeles','ecografia'),
  ('veterinaria-san-pedro-24h','radiografia'))
ON CONFLICT DO NOTHING;

-- 5) Precios con historial (consulta Concepción 20000→25000)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 20000, 20000, 'FIXED', '2026-08-01', '2026-08-31', 'VERIFIED', '2026-08-01'
FROM clinic_service cs JOIN clinic c ON c.id = cs.clinic_id JOIN service s ON s.id = cs.service_id
WHERE c.slug = 'clinica-veterinaria-concepcion' AND s.slug = 'consulta-general'
  AND NOT EXISTS (SELECT 1 FROM clinic_service_price p WHERE p.clinic_service_id = cs.id AND p.valid_from = '2026-08-01');

INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, valid_from, verification_status, verified_at)
SELECT cs.id, v.minv, v.maxv, v.ptype::pricing_type, v.vfrom::date, 'VERIFIED', '2026-09-01'
FROM clinic_service cs JOIN clinic c ON c.id = cs.clinic_id JOIN service s ON s.id = cs.service_id
JOIN (VALUES
  ('clinica-veterinaria-concepcion','consulta-general',25000,25000,'FIXED','2026-09-01'),
  ('veterinaria-talcahuano','consulta-general',18000,18000,'FIXED','2026-09-15'),
  ('veterinaria-san-pedro-24h','consulta-general',30000,NULL,'FROM','2026-09-01')
) AS v(cslug, sslug, minv, maxv, ptype, vfrom) ON c.slug = v.cslug AND s.slug = v.sslug
WHERE NOT EXISTS (SELECT 1 FROM clinic_service_price p WHERE p.clinic_service_id = cs.id AND p.valid_until IS NULL);

-- Precio CONTACT (Los Ángeles, sin montos)
INSERT INTO clinic_service_price (clinic_service_id, pricing_type, valid_from, verification_status)
SELECT cs.id, 'CONTACT', '2026-09-01', 'UNVERIFIED'
FROM clinic_service cs JOIN clinic c ON c.id = cs.clinic_id JOIN service s ON s.id = cs.service_id
WHERE c.slug = 'clinica-los-angeles' AND s.slug = 'consulta-general'
  AND NOT EXISTS (SELECT 1 FROM clinic_service_price p WHERE p.clinic_service_id = cs.id);

-- Precios de exámenes
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, valid_from, verification_status, verified_at)
SELECT ce.id, v.minv, v.maxv, 'FIXED', '2026-09-01', 'VERIFIED', '2026-09-01'
FROM clinic_exam ce JOIN clinic c ON c.id = ce.clinic_id JOIN exam e ON e.id = ce.exam_id
JOIN (VALUES
  ('clinica-veterinaria-concepcion','radiografia',35000,35000),
  ('clinica-veterinaria-concepcion','ecografia',40000,40000),
  ('veterinaria-talcahuano','radiografia',30000,30000)
) AS v(cslug, eslug, minv, maxv) ON c.slug = v.cslug AND e.slug = v.eslug
WHERE NOT EXISTS (SELECT 1 FROM clinic_exam_price p WHERE p.clinic_exam_id = ce.id AND p.valid_until IS NULL);

-- 6) Profesional dermatóloga en Concepción
INSERT INTO professional (first_name, last_name, slug, professional_type, status) VALUES
  ('María','González','maria-gonzalez','SPECIALIST','ACTIVE')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO professional_specialty (professional_id, specialty_id)
SELECT pr.id, sp.id FROM professional pr, specialty sp
WHERE pr.slug = 'maria-gonzalez' AND sp.slug = 'dermatologia'
ON CONFLICT DO NOTHING;

INSERT INTO clinic_professional (clinic_id, professional_id, role, verification_status, verified_at)
SELECT c.id, pr.id, 'Dermatóloga', 'VERIFIED', '2026-09-01' FROM clinic c, professional pr
WHERE c.slug = 'clinica-veterinaria-concepcion' AND pr.slug = 'maria-gonzalez'
ON CONFLICT DO NOTHING;

-- 7) Horarios demo (Concepción lun–vie 9–18)
INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, verification_status)
SELECT c.id, d, '09:00', '18:00', 'VERIFIED' FROM clinic c, generate_series(1,5) AS d
WHERE c.slug = 'clinica-veterinaria-concepcion'
ON CONFLICT DO NOTHING;
