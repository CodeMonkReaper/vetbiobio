-- Migración 0001_catalogs — catálogos + N:N + precios append-only + vistas current.
-- Ver docs/database-design.md §5-7 y ADR-002/ADR-005. Requiere 0000_init.

DO $$ BEGIN CREATE TYPE pricing_type AS ENUM ('FIXED','RANGE','FROM','CONTACT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE animal_species AS ENUM ('DOG','CAT','RABBIT','BIRD','REPTILE','RODENT','EXOTIC','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS service (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS exam (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT, sample_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS specialty (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS equipment (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clinic_service (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES service(id),
  description TEXT, is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, next_review_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, service_id)
);
CREATE INDEX IF NOT EXISTS clinic_service_service_idx ON clinic_service (service_id);

CREATE TABLE IF NOT EXISTS clinic_exam (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exam(id),
  description TEXT, preparation_notes TEXT,
  turnaround_hours INT CHECK (turnaround_hours IS NULL OR turnaround_hours >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, next_review_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, exam_id)
);
CREATE INDEX IF NOT EXISTS clinic_exam_exam_idx ON clinic_exam (exam_id);

CREATE TABLE IF NOT EXISTS clinic_equipment (
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id),
  notes TEXT, PRIMARY KEY (clinic_id, equipment_id)
);
CREATE TABLE IF NOT EXISTS clinic_animal (
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  species animal_species NOT NULL, PRIMARY KEY (clinic_id, species)
);

-- Precios append-only (ADR-005). CONTACT => montos NULL. Nunca UPDATE amount.
CREATE TABLE IF NOT EXISTS clinic_service_price (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_service_id BIGINT NOT NULL REFERENCES clinic_service(id) ON DELETE CASCADE,
  min_amount INT CHECK (min_amount IS NULL OR min_amount >= 0),
  max_amount INT CHECK (max_amount IS NULL OR max_amount >= 0),
  pricing_type pricing_type NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'CLP',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_until DATE,
  source verification_source,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, next_review_at DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CHECK (pricing_type <> 'FIXED' OR (min_amount IS NOT NULL AND min_amount = max_amount)),
  CHECK (pricing_type <> 'RANGE' OR (min_amount IS NOT NULL AND max_amount IS NOT NULL AND min_amount < max_amount)),
  CHECK (pricing_type <> 'FROM' OR (min_amount IS NOT NULL AND max_amount IS NULL)),
  CHECK (pricing_type <> 'CONTACT' OR (min_amount IS NULL AND max_amount IS NULL))
);
CREATE INDEX IF NOT EXISTS csp_current_idx ON clinic_service_price (clinic_service_id, valid_until);

CREATE TABLE IF NOT EXISTS clinic_exam_price (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_exam_id BIGINT NOT NULL REFERENCES clinic_exam(id) ON DELETE CASCADE,
  min_amount INT CHECK (min_amount IS NULL OR min_amount >= 0),
  max_amount INT CHECK (max_amount IS NULL OR max_amount >= 0),
  pricing_type pricing_type NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'CLP',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_until DATE,
  source verification_source,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, next_review_at DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CHECK (pricing_type <> 'FIXED' OR (min_amount IS NOT NULL AND min_amount = max_amount)),
  CHECK (pricing_type <> 'RANGE' OR (min_amount IS NOT NULL AND max_amount IS NOT NULL AND min_amount < max_amount)),
  CHECK (pricing_type <> 'FROM' OR (min_amount IS NOT NULL AND max_amount IS NULL)),
  CHECK (pricing_type <> 'CONTACT' OR (min_amount IS NULL AND max_amount IS NULL))
);
CREATE INDEX IF NOT EXISTS cep_current_idx ON clinic_exam_price (clinic_exam_id, valid_until);

CREATE OR REPLACE VIEW v_current_service_price AS
  SELECT DISTINCT ON (clinic_service_id) *
  FROM clinic_service_price WHERE valid_until IS NULL
  ORDER BY clinic_service_id, valid_from DESC, id DESC;
CREATE OR REPLACE VIEW v_current_exam_price AS
  SELECT DISTINCT ON (clinic_exam_id) *
  FROM clinic_exam_price WHERE valid_until IS NULL
  ORDER BY clinic_exam_id, valid_from DESC, id DESC;
