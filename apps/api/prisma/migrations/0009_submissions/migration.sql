-- Migración 0009_submissions — aportes ciudadanos moderados (ADR-006).
-- Cualquier persona envía información; queda PENDING hasta que un ADMIN/EDITOR
-- la apruebe (se aplica a las tablas reales como UNVERIFIED + fuente COMMUNITY)
-- o la rechace. Sin IP cruda: solo hash con sal. Contacto opcional con consentimiento.

ALTER TYPE verification_source ADD VALUE IF NOT EXISTS 'COMMUNITY';

CREATE TABLE IF NOT EXISTS submission (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tracking_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN
    ('NEW_CLINIC','CLINIC_UPDATE','PRICE','SCHEDULE','SERVICE','PROFESSIONAL','OTHER')),
  clinic_id BIGINT REFERENCES clinic(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  message TEXT CHECK (message IS NULL OR length(message) <= 2000),
  evidence_url TEXT CHECK (evidence_url IS NULL OR length(evidence_url) <= 500),
  submitter_name TEXT CHECK (submitter_name IS NULL OR length(submitter_name) <= 120),
  submitter_email CITEXT,
  consent_at TIMESTAMPTZ,
  submitter_hash TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  applied_entity_type TEXT,
  applied_entity_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ley 19.628: si hay email, debe existir consentimiento explícito.
  CONSTRAINT submission_email_consent CHECK (submitter_email IS NULL OR consent_at IS NOT NULL),
  -- Revisión coherente: estado final exige revisor/fecha.
  CONSTRAINT submission_review_coherent CHECK (status = 'PENDING' OR reviewed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS submission_status_idx ON submission (status, created_at DESC);
CREATE INDEX IF NOT EXISTS submission_clinic_idx ON submission (clinic_id);
CREATE INDEX IF NOT EXISTS submission_hash_idx ON submission (submitter_hash, created_at DESC);
