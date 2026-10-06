-- Migración 0002_admin — verificación, auditoría, reportes, fotos, horarios.
-- Ver docs/database-design.md §8-10 y docs/verification-policy.md. Requiere 0000 + 0001.

CREATE TABLE IF NOT EXISTS verification_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL, entity_id BIGINT NOT NULL,
  old_status verification_status, new_status verification_status NOT NULL,
  changed_by BIGINT REFERENCES "user"(id),
  source verification_source, method TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vlog_entity_idx ON verification_log (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES "user"(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','VERIFY','UNVERIFY','DEACTIVATE','PUBLISH')),
  entity_type TEXT NOT NULL, entity_id BIGINT NOT NULL,
  old_values JSONB, new_values JSONB, ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alog_entity_idx ON audit_log (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS report (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT REFERENCES clinic(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('CLOSED','WRONG_PRICE','WRONG_SCHEDULE','WRONG_PHONE','SERVICE_UNAVAILABLE','PROFESSIONAL_LEFT','OTHER')),
  message TEXT, reporter_hash TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','TRIAGED','RESOLVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_status_idx ON report (status);

CREATE TABLE IF NOT EXISTS slug_redirect (
  old_slug CITEXT PRIMARY KEY, new_slug CITEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_photo (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  url TEXT NOT NULL, public_id TEXT, alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photo_clinic_idx ON clinic_photo (clinic_id, sort_order);

CREATE TABLE IF NOT EXISTS schedule (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opening_time TIME, closing_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_overnight BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from DATE, valid_until DATE, label TEXT,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ,
  CHECK (is_closed OR (opening_time IS NOT NULL AND closing_time IS NOT NULL)),
  UNIQUE(clinic_id, day_of_week, opening_time, valid_from)
);
