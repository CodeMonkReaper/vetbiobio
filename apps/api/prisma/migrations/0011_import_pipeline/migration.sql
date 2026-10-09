-- Migración 0011_import_pipeline — Staging tables y pipeline de ingesta (Fase 3, ADR-007)

DO $$ BEGIN
  CREATE TYPE import_batch_status AS ENUM (
    'PENDING_ANALYSIS',
    'ANALYZING',
    'ANALYZED',
    'APPLYING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
  CREATE TYPE import_row_status AS ENUM (
    'PENDING',
    'VALID',
    'POSSIBLE_DUPLICATE',
    'INVALID',
    'APPLIED',
    'REJECTED',
    'ERROR'
  );
  CREATE TYPE import_action_type AS ENUM (
    'INSERT',
    'UPDATE',
    'SKIP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Tabla de Lotes de Importación
CREATE TABLE IF NOT EXISTS import_batch (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
  status import_batch_status NOT NULL DEFAULT 'PENDING_ANALYSIS',
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  applied_rows INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS import_batch_status_idx ON import_batch(status, created_at DESC);

-- 2. Tabla de Filas de Staging
CREATE TABLE IF NOT EXISTS import_batch_row (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  raw_data JSONB NOT NULL,
  parsed_data JSONB,
  status import_row_status NOT NULL DEFAULT 'PENDING',
  action_type import_action_type NOT NULL DEFAULT 'INSERT',
  matched_clinic_id BIGINT REFERENCES clinic(id) ON DELETE SET NULL,
  match_reason TEXT,
  match_score DOUBLE PRECISION,
  differences JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_batch_row_number UNIQUE (batch_id, row_number)
);
CREATE INDEX IF NOT EXISTS import_row_worker_idx ON import_batch_row(batch_id, status);
CREATE INDEX IF NOT EXISTS import_row_matched_clinic_idx ON import_batch_row(matched_clinic_id);
