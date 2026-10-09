-- ============================================================================
-- Seed 0010: Ecosistema enriquecido de datos para VetBiobío
-- Pobla clínicas en todas las comunas clave, fotos reales de Unsplash,
-- horarios completos, aranceles CLP vigentes, profesionales médicos,
-- equipamiento, aportes ciudadanos con seguimiento, reportes y métricas.
-- Idempotente y validado contra restricciones DDL estrictas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Nuevas clínicas en Chiguayante, Los Ángeles, Coronel, Hualpén, Penco, Tomé
-- ----------------------------------------------------------------------------
INSERT INTO clinic (name, slug, description, phone_e164, email, website, whatsapp_e164, status, verification_status, verified_at, is_emergency, is_24h)
VALUES
  ('Hospital Clínico Veterinario Los Ángeles 24h', 'hospital-clinico-veterinario-los-angeles-24h',
   'Centro hospitalario de alta complejidad en la provincia de Biobío. Atención continua las 24 horas, pabellones quirúrgicos certificados, diagnóstico por imágenes y UCI veterinaria.',
   '+56943218899', 'contacto@vetlosangeles24h.cl', 'https://vetlosangeles24h.cl', '+56943218899',
   'ACTIVE', 'VERIFIED', '2026-08-15', TRUE, TRUE),

  ('Veterinaria Biobío Cordillera', 'veterinaria-biobio-cordillera',
   'Atención veterinaria integral y preventiva para animales de compañía y pequeñas especies en Los Ángeles. Planes de salud familiar y vacunas.',
   '+56943224411', 'consultas@vetcordillera.cl', 'https://vetcordillera.cl', '+56943224411',
   'ACTIVE', 'VERIFIED', '2026-09-02', FALSE, FALSE),

  ('Clínica Veterinaria Chiguayante Centro', 'clinica-veterinaria-chiguayante-centro',
   'Clínica moderna en el corazón de Chiguayante. Especialistas en medicina felina, cardiología y medicina interna.',
   '+56941236778', 'hola@vetchiguayante.cl', 'https://vetchiguayante.cl', '+56941236778',
   'ACTIVE', 'VERIFIED', '2026-09-10', TRUE, FALSE),

  ('Centro Veterinario Manquimávida', 'centro-veterinario-manquimavida',
   'Atención preventiva, cirugías de tejidos blandos y ecografía en sector Manquimávida. Enfoque cercano y familiar.',
   '+56941239900', 'manquimavida@vetbiobio.cl', NULL, '+56941239900',
   'ACTIVE', 'VERIFIED', '2026-09-20', FALSE, FALSE),

  ('Clínica Veterinaria Hualpén Pets', 'clinica-veterinaria-hualpen-pets',
   'Centro veterinario equipado con radiografía digital, laboratorio express y urgencias diurnas para Hualpén y Talcahuano.',
   '+56941288554', 'urgencias@hualpenpets.cl', 'https://hualpenpets.cl', '+56941288554',
   'ACTIVE', 'VERIFIED', '2026-08-28', TRUE, FALSE),

  ('Centro Veterinario Las Golondrinas', 'centro-veterinario-las-golondrinas',
   'Especialistas en perros, gatos y animales exóticos (conejos, erizos, aves). Cirugías menores y medicina preventiva.',
   '+56941288112', 'contacto@lasgolondrinasvet.cl', NULL, '+56941288112',
   'ACTIVE', 'PENDING_REVIEW', '2026-07-10', FALSE, FALSE),

  ('Clínica Veterinaria Costa Coronel', 'clinica-veterinaria-costa-coronel',
   'Atención veterinaria clínica y traumatológica en Coronel. Cirugía general, hospitalización diurna y farmacia veterinaria completa.',
   '+56941271330', 'recepcion@costacoronelvet.cl', 'https://costacoronelvet.cl', '+56941271330',
   'ACTIVE', 'VERIFIED', '2026-09-12', TRUE, FALSE),

  ('Veterinaria Playa Blanca Coronel', 'veterinaria-playa-blanca',
   'Servicios veterinarios a precios accesibles. Vacunación, desparasitaciones, cirugías de esterilización y peluquería canina.',
   '+56941271889', 'playablanca@vetcoronel.cl', NULL, '+56941271889',
   'ACTIVE', 'VERIFIED', '2026-09-05', FALSE, FALSE),

  ('Veterinaria Penco Lirquén', 'veterinaria-penco-lirquen',
   'Atención veterinaria para la comunidad costera de Penco y Lirquén. Consultas a domicilio, ecografías y cirugías programadas.',
   '+56941245667', 'vetpenco@biobiovet.cl', 'https://veterinariapenco.cl', '+56941245667',
   'ACTIVE', 'VERIFIED', '2026-09-18', FALSE, FALSE),

  ('Clínica Veterinaria Bellavista Tomé', 'clinica-veterinaria-bellavista-tome',
   'Clínica veterinaria con urgencias diurnas en Bellavista Tomé. Servicios de rayos X, medicina interna y hospitalización de pacientes.',
   '+56941265882', 'info@vetbellavistatome.cl', 'https://vetbellavistatome.cl', '+56941265882',
   'ACTIVE', 'VERIFIED', '2026-08-30', TRUE, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  phone_e164 = EXCLUDED.phone_e164,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  whatsapp_e164 = EXCLUDED.whatsapp_e164,
  status = EXCLUDED.status,
  verification_status = EXCLUDED.verification_status,
  verified_at = EXCLUDED.verified_at,
  is_emergency = EXCLUDED.is_emergency,
  is_24h = EXCLUDED.is_24h;

-- ----------------------------------------------------------------------------
-- 2. Enriquecer descripciones y contactos de las clínicas existentes
-- ----------------------------------------------------------------------------
UPDATE clinic SET
  description = 'Hospital clínico docente y asistencial de alta complejidad. Atención de urgencias 24 horas, imagenología avanzada, UCI y cirugía de especialidad.',
  phone_e164 = '+56941262800',
  whatsapp_e164 = '+56941262800',
  email = 'hospitalveterinario@uss.cl',
  website = 'https://uss.cl/hospital-veterinario',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-01',
  is_emergency = TRUE,
  is_24h = TRUE
WHERE slug = 'hospital-clinico-veterinario-uss';

UPDATE clinic SET
  description = 'Centro de urgencias veterinarias y cuidados intensivos en el centro de Concepción. Pabellón equipado y atención médica continua.',
  phone_e164 = '+56941222991',
  whatsapp_e164 = '+56941222991',
  email = 'urgencias@vetsos.cl',
  website = 'https://veterinariasos.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-05',
  is_emergency = TRUE,
  is_24h = TRUE
WHERE slug = 'clinica-veterinaria-sos';

UPDATE clinic SET
  description = 'Clínica veterinaria integral en Valle Nonguén. Enfoque en medicina preventiva, bienestar animal, dermatología y ecografías diagnósticas.',
  phone_e164 = '+56941249112',
  whatsapp_e164 = '+56941249112',
  email = 'contacto@vetvallenonguen.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-10',
  is_emergency = FALSE,
  is_24h = FALSE
WHERE slug = 'centro-veterinario-valle-nonguen';

UPDATE clinic SET
  description = 'Medicina veterinaria familiar con atención personalizada. Vacunación, implante de microchip, cirugías menores y laboratorio express.',
  phone_e164 = '+56941273445',
  whatsapp_e164 = '+56941273445',
  email = 'hola@miveterinaria.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-12'
WHERE slug = 'mi-veterinaria-concepcion';

UPDATE clinic SET
  description = 'Centro médico veterinario con tecnología diagnóstica avanzada en Barrio Norte. Rayos X, ecografía Doppler y cardiología.',
  phone_e164 = '+56941255667',
  whatsapp_e164 = '+56941255667',
  email = 'consultas@cmvconcepcion.cl',
  website = 'https://cmvconcepcion.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-08'
WHERE slug = 'centro-medico-veterinario-concepcion';

UPDATE clinic SET
  description = 'Atención veterinaria cercana y accesible. Consultas preventivas, desparasitación, corte de uñas y venta de fármacos veterinarios.',
  phone_e164 = '+56941289110',
  whatsapp_e164 = '+56941289110',
  verification_status = 'VERIFIED',
  verified_at = '2026-08-25'
WHERE slug = 'veterinaria-mascoti';

UPDATE clinic SET
  description = 'Medicina preventiva, estética canina y felina, y cirugías de rutina con equipo médico certificado.',
  phone_e164 = '+56941234778',
  whatsapp_e164 = '+56941234778',
  verification_status = 'PENDING_REVIEW',
  verified_at = '2026-06-15'
WHERE slug = 'clinica-veterinaria-honu';

UPDATE clinic SET
  description = 'Centro veterinario histórico en Talcahuano puerto. Atención general, urgencias, hospitalización diurna y radiografías.',
  phone_e164 = '+56941254112',
  whatsapp_e164 = '+56941254112',
  email = 'contacto@mascotastalcahuano.cl',
  website = 'https://mascotastalcahuano.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-14',
  is_emergency = TRUE,
  is_24h = FALSE
WHERE slug = 'veterinaria-mascotas-talcahuano';

UPDATE clinic SET
  description = 'Clínica y centro de especialidades en Talcahuano. Traumatología, cirugías ortopédicas y rehabilitación animal.',
  phone_e164 = '+56941258990',
  whatsapp_e164 = '+56941258990',
  email = 'admision@clinicakennel.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-16'
WHERE slug = 'clinica-kennel';

UPDATE clinic SET
  description = 'Centro médico para mascotas en Talcahuano con atención integral: vacunas, microchips, limpiezas dentales y ecografía.',
  phone_e164 = '+56941252119',
  whatsapp_e164 = '+56941252119',
  verification_status = 'VERIFIED',
  verified_at = '2026-08-20'
WHERE slug = 'centro-veterinario-aitue';

UPDATE clinic SET
  description = 'Atención veterinaria integral en sector Brisas del Sol, Talcahuano. Ecografía, dermatología y consulta general.',
  phone_e164 = '+56941279001',
  whatsapp_e164 = '+56941279001',
  verification_status = 'OUTDATED',
  verified_at = '2026-02-10'
WHERE slug = 'condorvet';

UPDATE clinic SET
  description = 'Servicio veterinario ambulatorio y a domicilio en la intercomuna. Vacunas, controles pediátricos y gerontología.',
  phone_e164 = '+56941278334',
  whatsapp_e164 = '+56941278334',
  verification_status = 'PENDING_REVIEW'
WHERE slug = 'javivets';

UPDATE clinic SET
  description = 'Hospital veterinario líder en San Pedro de la Paz. Atención continua 24 horas, urgencias traumáticas, cirugía laparoscópica y pabellón mayor.',
  phone_e164 = '+56941237440',
  whatsapp_e164 = '+56941237440',
  email = 'urgencias@vetsanpedro24h.cl',
  website = 'https://vetsanpedro24h.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-18',
  is_emergency = TRUE,
  is_24h = TRUE
WHERE slug = 'clinica-veterinaria-san-pedro';

UPDATE clinic SET
  description = 'Clínica de especialidades en el sector Andalué de San Pedro de la Paz. Especialistas en felinos, oftalmología y nutrición clínica.',
  phone_e164 = '+56941239120',
  whatsapp_e164 = '+56941239120',
  email = 'contacto@vetandalue.cl',
  website = 'https://vetandalue.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-15'
WHERE slug = 'veterinaria-andalue';

UPDATE clinic SET
  description = 'Atención médica veterinaria en San Pedro de la Paz. Vacunas, controles sanos y cirugías programadas.',
  phone_e164 = '+56941237889',
  whatsapp_e164 = '+56941237889',
  verification_status = 'PENDING_REVIEW'
WHERE slug = 'clinica-veterinaria-san-pedro-de-la-paz';

UPDATE clinic SET
  description = 'Clínica veterinaria central en Concepción. Urgencias, medicina interna, dermatología especializada y radiografías.',
  phone_e164 = '+56941224550',
  whatsapp_e164 = '+56941224550',
  email = 'contacto@clinicaconcepcion.cl',
  website = 'https://clinicaconcepcion.cl',
  verification_status = 'VERIFIED',
  verified_at = '2026-09-01',
  is_emergency = TRUE,
  is_24h = FALSE
WHERE slug = 'clinica-veterinaria-concepcion';

-- ----------------------------------------------------------------------------
-- 3. Ubicaciones geográficas de las nuevas clínicas (con geom PostGIS)
-- ----------------------------------------------------------------------------
INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location, verification_status, verified_at)
SELECT
  c.id, v.address, (SELECT id FROM commune WHERE slug = v.commune), v.lat, v.lon,
  ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326)::geography, 'VERIFIED', '2026-09-01'
FROM clinic c JOIN (VALUES
  ('hospital-clinico-veterinario-los-angeles-24h', 'Av. Alemania 1420', 'los-angeles', -37.4720, -72.3520),
  ('veterinaria-biobio-cordillera', 'Calle Valdivia 310', 'los-angeles', -37.4680, -72.3550),
  ('clinica-veterinaria-chiguayante-centro', 'Av. Manuel Rodríguez 850', 'chiguayante', -36.9200, -73.0240),
  ('centro-veterinario-manquimavida', 'Calle Manquimávida 420', 'chiguayante', -36.9150, -73.0200),
  ('clinica-veterinaria-hualpen-pets', 'Av. Cristóbal Colón 9120', 'hualpen', -36.7870, -73.0980),
  ('centro-veterinario-las-golondrinas', 'Av. Las Golondrinas 1580', 'hualpen', -36.7920, -73.1040),
  ('clinica-veterinaria-costa-coronel', 'Calle Manuel Montt 412', 'coronel', -37.0270, -73.1410),
  ('veterinaria-playa-blanca', 'Av. Carlos Prats 1150', 'coronel', -37.0320, -73.1460),
  ('veterinaria-penco-lirquen', 'Calle Freire 340', 'penco', -36.7380, -72.9960),
  ('clinica-veterinaria-bellavista-tome', 'Calle Mariano Egaña 730', 'tome', -36.6180, -72.9560)
) AS v(slug, address, commune, lat, lon) ON c.slug = v.slug
ON CONFLICT (clinic_id) DO UPDATE SET
  address = EXCLUDED.address,
  commune_id = EXCLUDED.commune_id,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location = EXCLUDED.location;

-- ----------------------------------------------------------------------------
-- 4. Galería fotográfica rica de instalaciones y consultas (ClinicPhoto)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_photo;

INSERT INTO clinic_photo (clinic_id, url, alt_text, sort_order, is_primary, verification_status)
SELECT c.id, p.url, p.alt_text, p.sort_order, p.is_primary, 'VERIFIED'
FROM clinic c JOIN (VALUES
  -- 1) Hospital Clínico Veterinario USS
  ('hospital-clinico-veterinario-uss', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'Pabellón quirúrgico y equipamiento clínico de alta complejidad', 0, true),
  ('hospital-clinico-veterinario-uss', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', 'Box de consulta veterinaria y diagnóstico médico', 1, false),
  ('hospital-clinico-veterinario-uss', 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80', 'Laboratorio clínico y análisis automatizado', 2, false),
  ('hospital-clinico-veterinario-uss', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80', 'Sala de diagnóstico por imágenes y ecografía', 3, false),

  -- 2) Clínica Veterinaria Concepción
  ('clinica-veterinaria-concepcion', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', 'Veterinario examinando paciente canino con fonendoscopio', 0, true),
  ('clinica-veterinaria-concepcion', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'Recepción luminosa y área de espera para mascotas', 1, false),
  ('clinica-veterinaria-concepcion', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', 'Sala de control preventivo y vacunación de gatito', 2, false),

  -- 3) Clínica Veterinaria SOS
  ('clinica-veterinaria-sos', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80', 'Unidad de urgencias veterinarias y monitoreo crítico 24h', 0, true),
  ('clinica-veterinaria-sos', 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80', 'Equipo quirúrgico preparado para intervención de urgencia', 1, false),
  ('clinica-veterinaria-sos', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 'Área de hospitalización canina y cuidados intensivos', 2, false),

  -- 4) Centro Veterinario Valle Nonguén
  ('centro-veterinario-valle-nonguen', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', 'Revisión médica preventiva y atención felina', 0, true),
  ('centro-veterinario-valle-nonguen', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80', 'Espacio de recuperación y control de salud canina', 1, false),

  -- 5) Mi Veterinaria Concepción
  ('mi-veterinaria-concepcion', 'https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?auto=format&fit=crop&w=800&q=80', 'Consulta general veterinaria con paciente descansando', 0, true),
  ('mi-veterinaria-concepcion', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80', 'Cachorro en control médico pediátrico y vacunas', 1, false),

  -- 6) Centro Médico Veterinario Concepción
  ('centro-medico-veterinario-concepcion', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80', 'Sala de ecografía Doppler y diagnóstico de imagen', 0, true),
  ('centro-medico-veterinario-concepcion', 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80', 'Laboratorio de hematología y perfiles bioquímicos', 1, false),

  -- 7) Veterinaria Mascoti
  ('veterinaria-mascoti', 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80', 'Examen veterinario de rutina y control dental', 0, true),

  -- 8) Clínica Veterinaria Honu
  ('clinica-veterinaria-honu', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', 'Atención amigable para felinos y medicina preventiva', 0, true),

  -- 9) Veterinaria Mascotas Talcahuano
  ('veterinaria-mascotas-talcahuano', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', 'Revisión clínica completa y control de signos vitales', 0, true),
  ('veterinaria-mascotas-talcahuano', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'Pabellón de esterilizaciones y cirugías generales', 1, false),

  -- 10) Clínica Kennel Talcahuano
  ('clinica-kennel', 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80', 'Intervención de traumatología y cirugía ortopédica', 0, true),
  ('clinica-kennel', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80', 'Sala de kinesiología y rehabilitación física animal', 1, false),

  -- 11) Centro Veterinario Aitue
  ('centro-veterinario-aitue', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', 'Box de examen clínico y control nutricional', 0, true),

  -- 12) CondorVet
  ('condorvet', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80', 'Fachada y acceso a la clínica en Brisas del Sol', 0, true),

  -- 13) JaviVets
  ('javivets', 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=800&q=80', 'Atención pediátrica veterinaria y vacunas a domicilio', 0, true),

  -- 14) Clínica Veterinaria San Pedro 24h
  ('clinica-veterinaria-san-pedro', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80', 'Servicio de urgencia permanente 24 horas y monitoreo', 0, true),
  ('clinica-veterinaria-san-pedro', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'Pabellón quirúrgico de alta complejidad en San Pedro', 1, false),
  ('clinica-veterinaria-san-pedro', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 'Boxes de hospitalización climatizados e individuales', 2, false),

  -- 15) Veterinaria Andalué
  ('veterinaria-andalue', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', 'Instalación amigable certificada Cat-Friendly', 0, true),
  ('veterinaria-andalue', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'Recepción tranquila separada para perros y gatos', 1, false),

  -- 16) Clínica Veterinaria San Pedro de la Paz
  ('clinica-veterinaria-san-pedro-de-la-paz', 'https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?auto=format&fit=crop&w=800&q=80', 'Examen clínico general y medicina preventiva', 0, true),

  -- 17) Hospital Clínico Veterinario Los Ángeles 24h
  ('hospital-clinico-veterinario-los-angeles-24h', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'Hospital veterinario central Los Ángeles: pabellón avanzado', 0, true),
  ('hospital-clinico-veterinario-los-angeles-24h', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80', 'Urgencias 24h y sala de reanimación veterinaria', 1, false),
  ('hospital-clinico-veterinario-los-angeles-24h', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80', 'Servicio de radiografía digital y ecografía avanzada', 2, false),

  -- 18) Veterinaria Biobío Cordillera (Los Ángeles)
  ('veterinaria-biobio-cordillera', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', 'Consulta médica veterinaria en Los Ángeles', 0, true),
  ('veterinaria-biobio-cordillera', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80', 'Plan de vacunas y desparasitación para mascotas', 1, false),

  -- 19) Clínica Veterinaria Chiguayante Centro
  ('clinica-veterinaria-chiguayante-centro', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', 'Consulta cardiológica y dermatología en Chiguayante', 0, true),
  ('clinica-veterinaria-chiguayante-centro', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', 'Área de consulta felina libre de estrés', 1, false),

  -- 20) Centro Veterinario Manquimávida
  ('centro-veterinario-manquimavida', 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80', 'Cirugías de esterilización y cuidado dental', 0, true),

  -- 21) Clínica Veterinaria Hualpén Pets
  ('clinica-veterinaria-hualpen-pets', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80', 'Rayos X digital y exámenes ecográficos en Hualpén', 0, true),
  ('clinica-veterinaria-hualpen-pets', 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80', 'Laboratorio clínico interno para diagnósticos rápidos', 1, false),

  -- 22) Centro Veterinario Las Golondrinas
  ('centro-veterinario-las-golondrinas', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=800&q=80', 'Atención médica experta para conejos y exóticos', 0, true),

  -- 23) Clínica Veterinaria Costa Coronel
  ('clinica-veterinaria-costa-coronel', 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80', 'Pabellón quirúrgico y cirugías ortopédicas en Coronel', 0, true),
  ('clinica-veterinaria-costa-coronel', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 'Área de recuperación hospitalaria postoperatoria', 1, false),

  -- 24) Veterinaria Playa Blanca Coronel
  ('veterinaria-playa-blanca', 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=800&q=80', 'Atención cercana y accesible para la comunidad', 0, true),

  -- 25) Veterinaria Penco Lirquén
  ('veterinaria-penco-lirquen', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', 'Consulta veterinaria costera y ecografías de control', 0, true),

  -- 26) Clínica Veterinaria Bellavista Tomé
  ('clinica-veterinaria-bellavista-tome', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', 'Atención integral y urgencias diurnas en Tomé', 0, true),
  ('clinica-veterinaria-bellavista-tome', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'Sala de espera y atención veterinaria Bellavista', 1, false)
) AS p(slug, url, alt_text, sort_order, is_primary) ON c.slug = p.slug;

-- ----------------------------------------------------------------------------
-- 5. Horarios completos de atención (Schedule)
-- ----------------------------------------------------------------------------
DELETE FROM schedule;

-- 5.1 Clínicas 24h: Abiertas los 7 días de la semana continuo
INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, d, '00:00'::time, '23:59'::time, FALSE, TRUE, 'Urgencias 24 Horas Continuado', 'VERIFIED', '2026-09-01'
FROM clinic c, generate_series(0, 6) AS d
WHERE c.is_24h = TRUE;

-- 5.2 Clínicas de horario extendido lun-sáb (08:30 a 20:30, domingos 10:00 a 14:00)
INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, d, '08:30'::time, '20:30'::time, FALSE, FALSE, 'Horario Continuado', 'VERIFIED', '2026-09-01'
FROM clinic c, generate_series(1, 5) AS d
WHERE c.is_24h = FALSE AND c.slug IN (
  'clinica-veterinaria-concepcion', 'veterinaria-mascotas-talcahuano',
  'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets',
  'clinica-veterinaria-costa-coronel', 'clinica-veterinaria-bellavista-tome'
);

INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, 6, '09:00'::time, '18:00'::time, FALSE, FALSE, 'Sábado Continuado', 'VERIFIED', '2026-09-01'
FROM clinic c
WHERE c.is_24h = FALSE AND c.slug IN (
  'clinica-veterinaria-concepcion', 'veterinaria-mascotas-talcahuano',
  'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets',
  'clinica-veterinaria-costa-coronel', 'clinica-veterinaria-bellavista-tome'
);

INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, 0, '10:00'::time, '14:00'::time, FALSE, FALSE, 'Turno Urgencias Domingo', 'VERIFIED', '2026-09-01'
FROM clinic c
WHERE c.is_24h = FALSE AND c.slug IN (
  'clinica-veterinaria-concepcion', 'veterinaria-mascotas-talcahuano',
  'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets'
);

-- 5.3 Resto de clínicas generales (lun-vie 09:00 a 19:00, sáb 09:00 a 14:00, dom cerrado)
INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, d, '09:00'::time, '19:00'::time, FALSE, FALSE, 'Jornada Ordinaria', 'VERIFIED', '2026-09-01'
FROM clinic c, generate_series(1, 5) AS d
WHERE c.is_24h = FALSE AND c.id NOT IN (SELECT DISTINCT clinic_id FROM schedule);

INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, 6, '09:00'::time, '14:00'::time, FALSE, FALSE, 'Atención Sábado', 'VERIFIED', '2026-09-01'
FROM clinic c
WHERE c.is_24h = FALSE AND c.slug NOT IN (
  'clinica-veterinaria-concepcion', 'veterinaria-mascotas-talcahuano',
  'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets',
  'clinica-veterinaria-costa-coronel', 'clinica-veterinaria-bellavista-tome'
);

INSERT INTO schedule (clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status, verified_at)
SELECT c.id, 0, NULL, NULL, TRUE, FALSE, 'Cerrado Domingos', 'VERIFIED', '2026-09-01'
FROM clinic c
WHERE c.is_24h = FALSE AND c.slug NOT IN (
  'clinica-veterinaria-concepcion', 'veterinaria-mascotas-talcahuano',
  'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets'
);

-- ----------------------------------------------------------------------------
-- 6. Servicios veterinarios por clínica (ClinicService)
-- ----------------------------------------------------------------------------
-- Servicios estándar
INSERT INTO clinic_service (clinic_id, service_id, is_available, verification_status, verified_at)
SELECT c.id, s.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN service s
WHERE s.slug IN ('consulta-general', 'vacunacion', 'desparasitacion')
ON CONFLICT (clinic_id, service_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- Cirugías, esterilizaciones y castraciones
INSERT INTO clinic_service (clinic_id, service_id, is_available, verification_status, verified_at)
SELECT c.id, s.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN service s
WHERE s.slug IN ('cirugia-general', 'esterilizacion', 'castracion', 'limpieza-dental')
  AND c.slug NOT IN ('veterinaria-mascoti', 'javivets')
ON CONFLICT (clinic_id, service_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- Urgencias y hospitalización
INSERT INTO clinic_service (clinic_id, service_id, is_available, verification_status, verified_at)
SELECT c.id, s.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN service s
WHERE s.slug IN ('atencion-urgencias', 'hospitalizacion')
  AND (c.is_emergency = TRUE OR c.is_24h = TRUE)
ON CONFLICT (clinic_id, service_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- Peluquería
INSERT INTO clinic_service (clinic_id, service_id, is_available, verification_status, verified_at)
SELECT c.id, s.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN service s
WHERE s.slug = 'peluqueria'
  AND c.slug IN ('veterinaria-mascoti', 'clinica-veterinaria-honu', 'centro-veterinario-aitue', 'veterinaria-playa-blanca', 'veterinaria-andalue')
ON CONFLICT (clinic_id, service_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- ----------------------------------------------------------------------------
-- 7. Precios vigentes de servicios (ClinicServicePrice)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_service_price;

-- Consulta general: FIXED con min_amount = max_amount
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id,
  CASE
    WHEN c.slug = 'hospital-clinico-veterinario-uss' THEN 28000
    WHEN c.slug = 'hospital-clinico-veterinario-los-angeles-24h' THEN 25000
    WHEN c.slug = 'clinica-veterinaria-san-pedro' THEN 25000
    WHEN c.slug = 'clinica-veterinaria-sos' THEN 24000
    WHEN c.slug = 'veterinaria-andalue' THEN 26000
    WHEN c.slug = 'clinica-veterinaria-concepcion' THEN 22000
    WHEN c.slug = 'clinica-veterinaria-chiguayante-centro' THEN 20000
    WHEN c.slug = 'veterinaria-mascotas-talcahuano' THEN 18000
    WHEN c.slug = 'veterinaria-playa-blanca' THEN 15000
    WHEN c.slug = 'veterinaria-mascoti' THEN 16000
    ELSE 19000
  END,
  CASE
    WHEN c.slug = 'hospital-clinico-veterinario-uss' THEN 28000
    WHEN c.slug = 'hospital-clinico-veterinario-los-angeles-24h' THEN 25000
    WHEN c.slug = 'clinica-veterinaria-san-pedro' THEN 25000
    WHEN c.slug = 'clinica-veterinaria-sos' THEN 24000
    WHEN c.slug = 'veterinaria-andalue' THEN 26000
    WHEN c.slug = 'clinica-veterinaria-concepcion' THEN 22000
    WHEN c.slug = 'clinica-veterinaria-chiguayante-centro' THEN 20000
    WHEN c.slug = 'veterinaria-mascotas-talcahuano' THEN 18000
    WHEN c.slug = 'veterinaria-playa-blanca' THEN 15000
    WHEN c.slug = 'veterinaria-mascoti' THEN 16000
    ELSE 19000
  END,
  'FIXED', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN clinic c ON c.id = cs.clinic_id
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'consulta-general';

-- Vacunación: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 16000, 22000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'vacunacion';

-- Desparasitación: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 8000, 14000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'desparasitacion';

-- Cirugía general: FROM (min_amount NOT NULL, max_amount NULL)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 85000, NULL, 'FROM', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'cirugia-general';

-- Esterilización: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 45000, 85000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'esterilizacion';

-- Castración: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 35000, 65000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'castracion';

-- Atención de urgencias: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 38000, 55000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'atencion-urgencias';

-- Hospitalización: FROM (min_amount NOT NULL, max_amount NULL)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 35000, NULL, 'FROM', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'hospitalizacion';

-- Limpieza dental: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 42000, 75000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'limpieza-dental';

-- Peluquería: RANGE (min_amount < max_amount)
INSERT INTO clinic_service_price (clinic_service_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT cs.id, 16000, 26000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_service cs
JOIN service s ON s.id = cs.service_id
WHERE s.slug = 'peluqueria';

-- ----------------------------------------------------------------------------
-- 8. Exámenes clínicos por clínica (ClinicExam)
-- ----------------------------------------------------------------------------
-- Radiografía y ecografía
INSERT INTO clinic_exam (clinic_id, exam_id, is_available, verification_status, verified_at)
SELECT c.id, e.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN exam e
WHERE e.slug IN ('radiografia', 'ecografia')
  AND c.slug IN (
    'hospital-clinico-veterinario-uss', 'clinica-veterinaria-concepcion',
    'clinica-veterinaria-sos', 'centro-medico-veterinario-concepcion',
    'veterinaria-mascotas-talcahuano', 'clinica-kennel',
    'clinica-veterinaria-san-pedro', 'veterinaria-andalue',
    'hospital-clinico-veterinario-los-angeles-24h', 'clinica-veterinaria-chiguayante-centro',
    'clinica-veterinaria-hualpen-pets', 'clinica-veterinaria-costa-coronel',
    'clinica-veterinaria-bellavista-tome'
  )
ON CONFLICT (clinic_id, exam_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- Hemograma y perfil bioquímico
INSERT INTO clinic_exam (clinic_id, exam_id, is_available, verification_status, verified_at)
SELECT c.id, e.id, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c CROSS JOIN exam e
WHERE e.slug IN ('hemograma', 'perfil-bioquimico', 'test-parvovirus', 'test-distemper')
  AND c.slug IN (
    'hospital-clinico-veterinario-uss', 'clinica-veterinaria-concepcion',
    'clinica-veterinaria-sos', 'centro-medico-veterinario-concepcion',
    'clinica-veterinaria-san-pedro', 'hospital-clinico-veterinario-los-angeles-24h',
    'clinica-veterinaria-hualpen-pets', 'clinica-veterinaria-chiguayante-centro'
  )
ON CONFLICT (clinic_id, exam_id) DO UPDATE SET is_available = TRUE, verification_status = 'VERIFIED';

-- ----------------------------------------------------------------------------
-- 9. Precios vigentes de exámenes (ClinicExamPrice)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_exam_price;

-- Radiografía: FIXED (min_amount = max_amount)
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT ce.id, 32000, 32000, 'FIXED', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_exam ce
JOIN exam e ON e.id = ce.exam_id
WHERE e.slug = 'radiografia';

-- Ecografía: RANGE (min_amount < max_amount)
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT ce.id, 35000, 48000, 'RANGE', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_exam ce
JOIN exam e ON e.id = ce.exam_id
WHERE e.slug = 'ecografia';

-- Hemograma: FIXED (min_amount = max_amount)
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT ce.id, 22000, 22000, 'FIXED', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_exam ce
JOIN exam e ON e.id = ce.exam_id
WHERE e.slug = 'hemograma';

-- Perfil bioquímico: FIXED (min_amount = max_amount)
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT ce.id, 32000, 32000, 'FIXED', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_exam ce
JOIN exam e ON e.id = ce.exam_id
WHERE e.slug = 'perfil-bioquimico';

-- Test parvovirus / distemper: FIXED (min_amount = max_amount)
INSERT INTO clinic_exam_price (clinic_exam_id, min_amount, max_amount, pricing_type, currency, valid_from, valid_until, verification_status, verified_at)
SELECT ce.id, 18000, 18000, 'FIXED', 'CLP', '2026-01-01', NULL, 'VERIFIED', '2026-09-01'
FROM clinic_exam ce
JOIN exam e ON e.id = ce.exam_id
WHERE e.slug IN ('test-parvovirus', 'test-distemper');

-- ----------------------------------------------------------------------------
-- 10. Profesionales Médicos, Especialidades y Equipos (Staff)
-- ----------------------------------------------------------------------------
INSERT INTO professional (first_name, last_name, slug, professional_type, license_number, status)
VALUES
  ('Felipe', 'Soto', 'felipe-soto', 'SPECIALIST', 'COLMEVET-7892', 'ACTIVE'),
  ('Camila', 'Morales', 'camila-morales', 'SPECIALIST', 'COLMEVET-8431', 'ACTIVE'),
  ('Ignacio', 'Riquelme', 'ignacio-riquelme', 'SPECIALIST', 'COLMEVET-6540', 'ACTIVE'),
  ('Valentina', 'Parra', 'valentina-parra', 'SPECIALIST', 'COLMEVET-9102', 'ACTIVE'),
  ('Andrés', 'Valenzuela', 'andres-valenzuela', 'SPECIALIST', 'COLMEVET-5511', 'ACTIVE'),
  ('Javiera', 'Muñoz', 'javiera-munoz', 'SPECIALIST', 'COLMEVET-8839', 'ACTIVE'),
  ('Gonzalo', 'Castro', 'gonzalo-castro', 'VETERINARIAN', 'COLMEVET-7720', 'ACTIVE'),
  ('Macarena', 'Silva', 'macarena-silva', 'SPECIALIST', 'COLMEVET-9401', 'ACTIVE'),
  ('Matías', 'Alarcón', 'matias-alarcon', 'VETERINARIAN', 'COLMEVET-8120', 'ACTIVE')
ON CONFLICT (slug) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  license_number = EXCLUDED.license_number;

-- Vincular profesionales a especialidades
INSERT INTO professional_specialty (professional_id, specialty_id)
SELECT p.id, s.id FROM professional p, specialty s
WHERE (p.slug, s.slug) IN (
  ('felipe-soto', 'cirugia-especialidad'),
  ('camila-morales', 'medicina-felina'),
  ('ignacio-riquelme', 'cardiologia'),
  ('valentina-parra', 'dermatologia'),
  ('andres-valenzuela', 'traumatologia'),
  ('javiera-munoz', 'imagenologia'),
  ('macarena-silva', 'medicina-interna')
)
ON CONFLICT DO NOTHING;

-- Asignar profesionales a clínicas
DELETE FROM clinic_professional;

INSERT INTO clinic_professional (clinic_id, professional_id, role, is_active, verification_status, verified_at)
SELECT c.id, p.id, v.role, TRUE, 'VERIFIED', '2026-09-01'
FROM clinic c JOIN (VALUES
  ('hospital-clinico-veterinario-uss', 'felipe-soto', 'Cirujano Jefe'),
  ('hospital-clinico-veterinario-uss', 'javiera-munoz', 'Especialista en Imagenología'),
  ('clinica-veterinaria-concepcion', 'valentina-parra', 'Dermatóloga Clínica'),
  ('clinica-veterinaria-concepcion', 'gonzalo-castro', 'Médico General'),
  ('clinica-veterinaria-sos', 'macarena-silva', 'Urgencióloga Veterinaria'),
  ('veterinaria-andalue', 'camila-morales', 'Especialista en Medicina Felina'),
  ('clinica-kennel', 'andres-valenzuela', 'Traumatólogo y Ortopedista'),
  ('hospital-clinico-veterinario-los-angeles-24h', 'ignacio-riquelme', 'Cardiólogo Veterinario'),
  ('hospital-clinico-veterinario-los-angeles-24h', 'felipe-soto', 'Consultor Quirúrgico'),
  ('clinica-veterinaria-san-pedro', 'matias-alarcon', 'Médico Veterinario Residente')
) AS v(cslug, pslug, role) ON c.slug = v.cslug
JOIN professional p ON p.slug = v.pslug;

-- ----------------------------------------------------------------------------
-- 11. Equipamiento clínico (ClinicEquipment)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_equipment;

INSERT INTO clinic_equipment (clinic_id, equipment_id)
SELECT c.id, eq.id
FROM clinic c CROSS JOIN equipment eq
WHERE (
  (c.slug IN ('hospital-clinico-veterinario-uss', 'hospital-clinico-veterinario-los-angeles-24h', 'clinica-veterinaria-san-pedro')
   AND eq.slug IN ('equipo-rayos-x', 'ecografo', 'laboratorio-clinico', 'quirofano', 'monitor-multiparametro', 'anestesia-inhalatoria', 'incubadora'))
  OR
  (c.slug IN ('clinica-veterinaria-concepcion', 'clinica-veterinaria-sos', 'centro-medico-veterinario-concepcion', 'clinica-veterinaria-chiguayante-centro', 'clinica-veterinaria-hualpen-pets', 'clinica-veterinaria-costa-coronel')
   AND eq.slug IN ('equipo-rayos-x', 'ecografo', 'quirofano', 'monitor-multiparametro', 'anestesia-inhalatoria'))
  OR
  (c.slug IN ('veterinaria-andalue', 'veterinaria-mascotas-talcahuano', 'clinica-kennel', 'clinica-veterinaria-bellavista-tome')
   AND eq.slug IN ('ecografo', 'quirofano', 'monitor-multiparametro'))
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. Especies atendidas (ClinicAnimal)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_animal;

-- Todas atienden perros y gatos
INSERT INTO clinic_animal (clinic_id, species)
SELECT id, 'DOG'::animal_species FROM clinic;

INSERT INTO clinic_animal (clinic_id, species)
SELECT id, 'CAT'::animal_species FROM clinic;

-- Clínicas especializadas en exóticos o pequeños mamíferos
INSERT INTO clinic_animal (clinic_id, species)
SELECT c.id, sp::animal_species
FROM clinic c CROSS JOIN (VALUES ('RABBIT'), ('BIRD'), ('RODENT'), ('EXOTIC')) AS s(sp)
WHERE c.slug IN ('centro-veterinario-las-golondrinas', 'hospital-clinico-veterinario-uss', 'veterinaria-andalue', 'hospital-clinico-veterinario-los-angeles-24h');

-- ----------------------------------------------------------------------------
-- 13. Monetización: Suscripciones Premium y Campañas Patrocinadas
-- ----------------------------------------------------------------------------
DELETE FROM premium_subscription;
DELETE FROM advertisement;

-- Hospital USS y Los Ángeles 24h como PREMIUM activas
INSERT INTO premium_subscription (clinic_id, plan_id, status, started_at, expires_at)
SELECT id, 'PREMIUM', 'ACTIVE', CURRENT_DATE - 30, CURRENT_DATE + 335
FROM clinic
WHERE slug IN ('hospital-clinico-veterinario-uss', 'hospital-clinico-veterinario-los-angeles-24h');

-- Clínica Veterinaria Concepción con anuncio SPONSORED_CLINIC
INSERT INTO advertisement (clinic_id, campaign_name, placement, start_at, end_at, status)
SELECT id, 'Campaña Primavera 2026', 'SPONSORED_CLINIC', now() - INTERVAL '3 days', now() + INTERVAL '27 days', 'ACTIVE'
FROM clinic
WHERE slug = 'clinica-veterinaria-concepcion';

-- ----------------------------------------------------------------------------
-- 14. Aportes ciudadanos con seguimiento (Submission)
-- ----------------------------------------------------------------------------
DELETE FROM submission;

INSERT INTO submission (tracking_code, type, clinic_id, payload, message, evidence_url, submitter_name, submitter_email, consent_at, status, reviewed_by, reviewed_at, review_notes)
VALUES
  ('VBB-2026-URG1', 'PRICE',
   (SELECT id FROM clinic WHERE slug = 'hospital-clinico-veterinario-uss'),
   '{"service": "consulta-general", "reported_price": 28000, "currency": "CLP", "notes": "Boleta de urgencia noche"}'::jsonb,
   'Adjunto comprobante de atención nocturna donde el arancel fue de $28.000.',
   'https://res.cloudinary.com/vetbiobio/image/upload/v1/evidence/boleta-uss-urgencia.jpg',
   'Constanza Riquelme', 'constanza.riquelme@gmail.com', now() - INTERVAL '2 days',
   'APPROVED', 1, now() - INTERVAL '1 day', 'Arancel contrastado y verificado con el centro asistencial.'),

  ('VBB-2026-CHIG2', 'NEW_CLINIC',
   NULL,
   '{"name": "Veterinaria Móvil Los Pinares", "commune": "chiguayante", "phone": "+56941299881", "address": "Móvil sector Los Pinares", "is_emergency": false}'::jsonb,
   'Sugerencia de nueva veterinaria a domicilio que opera en Chiguayante y Concepción.',
   NULL,
   'Ignacio Fuentes', 'ifuentes.biobio@gmail.com', now() - INTERVAL '3 days',
   'PENDING', NULL, NULL, NULL),

  ('VBB-2026-PRE3', 'PRICE',
   (SELECT id FROM clinic WHERE slug = 'clinica-veterinaria-concepcion'),
   '{"service": "esterilizacion", "reported_price": 55000, "currency": "CLP"}'::jsonb,
   'Campaña de esterilización canina hembra vigente este mes.',
   'https://instagram.com/p/campana-esterilizacion-conce',
   'Camila Torres', 'ctorres@veterinaria.cl', now() - INTERVAL '1 day',
   'PENDING', NULL, NULL, NULL),

  ('VBB-2026-VAL4', 'SCHEDULE',
   (SELECT id FROM clinic WHERE slug = 'clinica-veterinaria-san-pedro'),
   '{"change": "Confirmación de atención continuada en festivos"}'::jsonb,
   'Confirmo que siguen atendiendo 24 horas ininterrumpidas incluso en feriados.',
   NULL,
   'Patricio Alvear', 'patricio.alvear@gmail.com', now() - INTERVAL '5 days',
   'APPROVED', 1, now() - INTERVAL '4 days', 'Verificado vía llamado telefónico con la clínica.'),

  ('VBB-2026-HOR5', 'NEW_CLINIC',
   NULL,
   '{"name": "Pet Express Lomas", "commune": "concepcion", "phone": "123456"}'::jsonb,
   'Abrieron una veterinaria en las lomas pero no tengo más datos.',
   NULL,
   'Anónimo', NULL, NULL,
   'REJECTED', 1, now() - INTERVAL '5 days', 'Datos insuficientes para validar existencia y no cuenta con teléfono verificable.'),

  ('VBB-2026-MAS6', 'PRICE',
   (SELECT id FROM clinic WHERE slug = 'veterinaria-mascotas-talcahuano'),
   '{"service": "radiografia", "reported_price": 30000, "currency": "CLP"}'::jsonb,
   'Arancel actualizado de radiografía simple con informe.',
   NULL,
   'Sebastián Soto', 'ssoto@talcahuanovet.cl', now() - INTERVAL '4 hours',
   'PENDING', NULL, NULL, NULL);

-- ----------------------------------------------------------------------------
-- 15. Reportes ciudadanos (Report)
-- ----------------------------------------------------------------------------
DELETE FROM report;

INSERT INTO report (clinic_id, reason, message, reporter_hash, status, created_at)
VALUES
  ((SELECT id FROM clinic WHERE slug = 'condorvet'),
   'WRONG_PHONE', 'Llamé varias veces y el número suena como no asignado.',
   'hash_rep_101', 'OPEN', now() - INTERVAL '1 day'),

  ((SELECT id FROM clinic WHERE slug = 'veterinaria-mascoti'),
   'WRONG_SCHEDULE', 'El sábado cerraron a las 13:00 en lugar de las 14:00.',
   'hash_rep_102', 'OPEN', now() - INTERVAL '3 days'),

  ((SELECT id FROM clinic WHERE slug = 'clinica-veterinaria-honu'),
   'WRONG_PRICE', 'La consulta ahora tiene un valor algo mayor al indicado.',
   'hash_rep_103', 'OPEN', now() - INTERVAL '4 days');

-- ----------------------------------------------------------------------------
-- 16. Puntuaciones de Calidad y Confiabilidad (ClinicQualityScore)
-- Componentes: completeness (0-30), verification (0-40), freshness (0-30), total (0-100)
-- ----------------------------------------------------------------------------
DELETE FROM clinic_quality_score;

INSERT INTO clinic_quality_score (clinic_id, score, completeness_score, verification_score, freshness_score, active_issues_count, factor_breakdown, updated_at)
SELECT
  c.id,
  CASE
    WHEN c.verification_status = 'VERIFIED' AND c.is_24h THEN 98
    WHEN c.verification_status = 'VERIFIED' THEN 92
    WHEN c.verification_status = 'PENDING_REVIEW' THEN 72
    WHEN c.verification_status = 'OUTDATED' THEN 60
    ELSE 50
  END AS score,
  CASE WHEN c.verification_status = 'VERIFIED' THEN 29 ELSE 22 END AS completeness_score,
  CASE WHEN c.verification_status = 'VERIFIED' THEN 40 WHEN c.verification_status = 'PENDING_REVIEW' THEN 25 ELSE 15 END AS verification_score,
  CASE WHEN c.verification_status = 'OUTDATED' THEN 10 ELSE 28 END AS freshness_score,
  CASE WHEN c.verification_status = 'OUTDATED' THEN 1 ELSE 0 END AS active_issues_count,
  jsonb_build_object(
    'has_location', true,
    'has_photos', true,
    'has_schedules', true,
    'has_prices', true,
    'has_contact', true
  ),
  now()
FROM clinic c;

COMMIT;
