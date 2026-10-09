-- Migración 0010_data_quality — Motor de calidad, incidencias y confiabilidad explicable.

DO $$ BEGIN
  CREATE TYPE data_quality_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  CREATE TYPE data_quality_status AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
  CREATE TYPE data_quality_trigger AS ENUM ('MANUAL', 'SCHEDULED_CRON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Historial de corridas del motor
CREATE TABLE IF NOT EXISTS data_quality_run (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trigger_type data_quality_trigger NOT NULL DEFAULT 'MANUAL',
  triggered_by BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  evaluated_clinics INT NOT NULL DEFAULT 0,
  open_issues_count INT NOT NULL DEFAULT 0,
  resolved_issues_count INT NOT NULL DEFAULT 0,
  execution_time_ms INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS dq_run_started_idx ON data_quality_run (started_at DESC);

-- 2. Incidencias de calidad de datos
CREATE TABLE IF NOT EXISTS data_quality_issue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  run_id BIGINT REFERENCES data_quality_run(id) ON DELETE SET NULL,
  rule_code TEXT NOT NULL,
  severity data_quality_severity NOT NULL,
  status data_quality_status NOT NULL DEFAULT 'OPEN',
  cause_description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  fingerprint TEXT NOT NULL,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolution_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_open_issue_fingerprint UNIQUE (fingerprint, status)
);
CREATE INDEX IF NOT EXISTS dq_issue_clinic_status_idx ON data_quality_issue (clinic_id, status);
CREATE INDEX IF NOT EXISTS dq_issue_severity_idx ON data_quality_issue (severity, status);
CREATE INDEX IF NOT EXISTS dq_issue_rule_idx ON data_quality_issue (rule_code);

-- 3. Puntaje calculado de confiabilidad por clínica
CREATE TABLE IF NOT EXISTS clinic_quality_score (
  clinic_id BIGINT PRIMARY KEY REFERENCES clinic(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  completeness_score INT NOT NULL CHECK (completeness_score BETWEEN 0 AND 30),
  verification_score INT NOT NULL CHECK (verification_score BETWEEN 0 AND 40),
  freshness_score INT NOT NULL CHECK (freshness_score BETWEEN 0 AND 30),
  active_issues_count INT NOT NULL DEFAULT 0,
  factor_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
