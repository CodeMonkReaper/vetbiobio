-- Migración 0004_search — full-text español con pesos + unaccent + GIN.
-- search_tsv pondera: nombre (A), comuna (B), servicios/exámenes/especialidades (C), descripción (D).
-- Ver docs/database-design.md §12 y docs/api.md §2.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Configuración propia: normaliza tildes ANTES de stemizar, para que
-- 'Dermatología' y 'dermatologia' produzcan el mismo lexema.
-- Hallazgo verificado: con 'spanish' puro daban 'dermatolog' vs 'dermatologi'.
DO $$ BEGIN
  CREATE TEXT SEARCH CONFIGURATION es_unaccent (COPY = spanish);
EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL; END $$;
ALTER TEXT SEARCH CONFIGURATION es_unaccent ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- Recalcula el tsv de una clínica (llamado por triggers).
CREATE OR REPLACE FUNCTION refresh_clinic_search(p_clinic_id BIGINT) RETURNS void AS $$
BEGIN
  UPDATE clinic c SET search_tsv = (
    SELECT
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(c2.name), '')), 'A') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(com.name, '')), '')), 'B') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(string_agg(DISTINCT s.name, ' '), '')), '')), 'C') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(string_agg(DISTINCT e.name, ' '), '')), '')), 'C') ||
      setweight(to_tsvector('es_unaccent', coalesce(unaccent(coalesce(c2.description, '')), '')), 'D')
    FROM clinic c2
    LEFT JOIN clinic_location cl ON cl.clinic_id = c2.id
    LEFT JOIN commune com ON com.id = cl.commune_id
    LEFT JOIN clinic_service cs ON cs.clinic_id = c2.id AND cs.is_available
    LEFT JOIN service s ON s.id = cs.service_id AND s.is_active
    LEFT JOIN clinic_exam ce ON ce.clinic_id = c2.id AND ce.is_available
    LEFT JOIN exam e ON e.id = ce.exam_id AND e.is_active
    WHERE c2.id = p_clinic_id
    GROUP BY c2.name, c2.description, com.name
  ) WHERE c.id = p_clinic_id;
END $$ LANGUAGE plpgsql;

-- Trigger en la propia clínica.
CREATE OR REPLACE FUNCTION trg_clinic_search() RETURNS TRIGGER AS $$
BEGIN PERFORM refresh_clinic_search(NEW.id); RETURN NEW; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sync_clinic_search ON clinic;
CREATE TRIGGER trg_sync_clinic_search AFTER INSERT OR UPDATE OF name, description ON clinic
  FOR EACH ROW EXECUTE FUNCTION trg_clinic_search();

-- Trigger genérico para tablas con clinic_id (inserción/actualización/borrado).
CREATE OR REPLACE FUNCTION trg_child_search() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM refresh_clinic_search(OLD.clinic_id); RETURN OLD;
  ELSE PERFORM refresh_clinic_search(NEW.clinic_id); RETURN NEW; END IF;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_location ON clinic_location;
CREATE TRIGGER trg_search_location AFTER INSERT OR UPDATE OR DELETE ON clinic_location
  FOR EACH ROW EXECUTE FUNCTION trg_child_search();
DROP TRIGGER IF EXISTS trg_search_cservice ON clinic_service;
CREATE TRIGGER trg_search_cservice AFTER INSERT OR UPDATE OR DELETE ON clinic_service
  FOR EACH ROW EXECUTE FUNCTION trg_child_search();
DROP TRIGGER IF EXISTS trg_search_cexam ON clinic_exam;
CREATE TRIGGER trg_search_cexam AFTER INSERT OR UPDATE OR DELETE ON clinic_exam
  FOR EACH ROW EXECUTE FUNCTION trg_child_search();

CREATE INDEX IF NOT EXISTS clinic_search_gin ON clinic USING GIN (search_tsv);

-- Backfill por si existen filas previas.
SELECT refresh_clinic_search(id) FROM clinic;
