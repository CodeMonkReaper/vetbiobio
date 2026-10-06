-- Verificación piloto: 1 VERIFIED (sitio oficial leído) + 15 PENDING_REVIEW.
-- Evidencia CVC: clinicaveterinariaconcepcion.cl (dirección, teléfonos, email,
-- horario Lun-Vie 10:30-19:00, urgencias, cirugías, hospitalización).
-- Las fichas se publican (ACTIVE): lo pendiente es la *confianza*, no la existencia.

UPDATE clinic SET status = 'ACTIVE' WHERE status = 'PENDING_VERIFICATION';

-- 1) Clínica Veterinaria Concepción → VERIFIED
UPDATE clinic SET verification_status = 'VERIFIED', verified_at = now(),
  verification_source = 'OFFICIAL_WEBSITE',
  verification_method = 'Sitio oficial: direccion, telefonos, email, horario y servicios coinciden con la ficha',
  verified_by = (SELECT id FROM "user" WHERE email = 'admin@vetbiobio.local'),
  next_review_at = CURRENT_DATE + 180
WHERE slug = 'clinica-veterinaria-concepcion';

UPDATE clinic_location SET verification_status = 'VERIFIED', verified_at = now(),
  verification_source = 'OFFICIAL_WEBSITE', next_review_at = CURRENT_DATE + 180
WHERE clinic_id = (SELECT id FROM clinic WHERE slug = 'clinica-veterinaria-concepcion');

INSERT INTO verification_log (entity_type, entity_id, old_status, new_status, source, method, notes)
SELECT 'clinic', id, 'UNVERIFIED', 'VERIFIED', 'OFFICIAL_WEBSITE',
  'Sitio oficial clinicaveterinariaconcepcion.cl',
  'Piloto 2026-10-06: direccion/horario/servicios verificados contra sitio oficial'
FROM clinic WHERE slug = 'clinica-veterinaria-concepcion';

-- 2) Resto del piloto → PENDING_REVIEW (origen: directorios públicos, confirmar por teléfono)
UPDATE clinic SET verification_status = 'PENDING_REVIEW'
WHERE verification_status = 'UNVERIFIED' AND slug IN (
  'clinica-veterinaria-sos','hospital-clinico-veterinario-uss','centro-veterinario-valle-nonguen',
  'mi-veterinaria-concepcion','centro-medico-veterinario-concepcion','veterinaria-mascoti',
  'clinica-veterinaria-honu','veterinaria-mascotas-talcahuano','clinica-kennel',
  'centro-veterinario-aitue','condorvet','javivets','clinica-veterinaria-san-pedro',
  'veterinaria-andalue','clinica-veterinaria-san-pedro-de-la-paz');

INSERT INTO verification_log (entity_type, entity_id, old_status, new_status, source, method, notes)
SELECT 'clinic', id, 'UNVERIFIED', 'PENDING_REVIEW', 'PUBLIC_SOURCE',
  'Directorio publico (Exa Places / clinicaveterinaria24.help / soleduc)',
  'Piloto 2026-10-06: pendiente confirmacion telefonica o sitio oficial'
FROM clinic WHERE verification_status = 'PENDING_REVIEW';
