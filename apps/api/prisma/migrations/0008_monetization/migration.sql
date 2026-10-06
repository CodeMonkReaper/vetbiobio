-- Migración 0008_monetization — premium y publicidad (ver docs/database-design.md §10).
-- Regla comercial: premium/publicidad NUNCA alteran verification_status.

CREATE TABLE IF NOT EXISTS advertisement (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT REFERENCES clinic(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('SPONSORED_CLINIC','BANNER','FEATURED_SERVICE')),
  start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','ENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS ad_active_idx ON advertisement (placement, status, start_at, end_at);

CREATE TABLE IF NOT EXISTS premium_subscription (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('FREE','PREMIUM','PREMIUM_PLUS')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS premium_active_idx ON premium_subscription (clinic_id, status, expires_at);
