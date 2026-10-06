-- Seed demo monetización: Talcahuano PREMIUM vigente, Concepción con campaña patrocinada vigente.
-- No tocan verification_status (independencia comercial, ADR implícito §79).

INSERT INTO premium_subscription (clinic_id, plan_id, status, started_at, expires_at)
SELECT id, 'PREMIUM', 'ACTIVE', CURRENT_DATE - 10, CURRENT_DATE + 355
FROM clinic WHERE slug = 'veterinaria-talcahuano'
  AND NOT EXISTS (SELECT 1 FROM premium_subscription p WHERE p.clinic_id = clinic.id AND p.status = 'ACTIVE');

INSERT INTO advertisement (clinic_id, campaign_name, placement, start_at, end_at, status)
SELECT id, 'Demo lanzamiento Biobío', 'SPONSORED_CLINIC', now() - INTERVAL '1 day', now() + INTERVAL '30 days', 'ACTIVE'
FROM clinic WHERE slug = 'clinica-veterinaria-concepcion'
  AND NOT EXISTS (SELECT 1 FROM advertisement a WHERE a.clinic_id = clinic.id AND a.status = 'ACTIVE');
