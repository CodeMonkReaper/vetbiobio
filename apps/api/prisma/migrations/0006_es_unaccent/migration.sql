-- Migración 0006_es_unaccent — aplica a BDs existentes lo ya corregido en 0004:
-- configuración es_unaccent (unaccent antes de stemizar) + función con 'es_unaccent' + backfill.
-- Hallazgo: 'Dermatología' vs 'dermatologia' daban lexemas distintos con 'spanish' puro.

DO $$ BEGIN
  CREATE TEXT SEARCH CONFIGURATION es_unaccent (COPY = spanish);
EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL; END $$;
ALTER TEXT SEARCH CONFIGURATION es_unaccent ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

CREATE OR REPLACE FUNCTION refresh_clinic_search(p_clinic_id BIGINT) RETURNS void AS $$
BEGIN
  UPDATE clinic c SET search_tsv = (
    SELECT
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(c2.name), '')), 'A') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(com.name, '')), '')), 'B') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(string_agg(DISTINCT s.name, ' '), '')), '')), 'C') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(string_agg(DISTINCT e.name, ' '), '')), '')), 'C') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(string_agg(DISTINCT sp.name, ' '), '')), '')), 'C') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(c2.description, '')), '')), 'D')
    FROM clinic c2
    LEFT JOIN clinic_location cl ON cl.clinic_id = c2.id
    LEFT JOIN commune com ON com.id = cl.commune_id
    LEFT JOIN clinic_service cs ON cs.clinic_id = c2.id AND cs.is_available
    LEFT JOIN service s ON s.id = cs.service_id AND s.is_active
    LEFT JOIN clinic_exam ce ON ce.clinic_id = c2.id AND ce.is_available
    LEFT JOIN exam e ON e.id = ce.exam_id AND e.is_active
    LEFT JOIN clinic_professional cp ON cp.clinic_id = c2.id AND cp.is_active
    LEFT JOIN professional_specialty ps ON ps.professional_id = cp.professional_id
    LEFT JOIN specialty sp ON sp.id = ps.specialty_id AND sp.is_active
    WHERE c2.id = p_clinic_id
    GROUP BY c2.name, c2.description, com.name
  ) WHERE c.id = p_clinic_id;
END $$ LANGUAGE plpgsql;

SELECT refresh_clinic_search(id) FROM clinic;
