-- Migración 0005_professionals — profesionales y vínculo con clínicas/especialidades.
-- Ver docs/database-design.md §9. license_number nullable sin unique global (Chile).

DO $$ BEGIN CREATE TYPE professional_type AS ENUM
 ('VETERINARIAN','VETERINARY_TECHNICIAN','SPECIALIST','OTHER');
 EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS professional (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  display_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  slug CITEXT UNIQUE NOT NULL,
  professional_type professional_type NOT NULL DEFAULT 'VETERINARIAN',
  description TEXT, license_number TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professional_specialty (
  professional_id BIGINT NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  specialty_id BIGINT NOT NULL REFERENCES specialty(id),
  PRIMARY KEY (professional_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS clinic_professional (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  professional_id BIGINT NOT NULL REFERENCES professional(id),
  role TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, schedule_note TEXT,
  started_at DATE, ended_at DATE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, next_review_at DATE,
  UNIQUE(clinic_id, professional_id)
);
CREATE INDEX IF NOT EXISTS cprof_prof_idx ON clinic_professional (professional_id);
