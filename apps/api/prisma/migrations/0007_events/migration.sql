-- Migración 0007_events — analítica mínima sin PII (ver project_context §76).
-- session_hash opaco (no IP cruda, no cookies de terceros). Agregación por día en consultas.

CREATE TABLE IF NOT EXISTS clinic_event (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT REFERENCES clinic(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'clinic_profile_view','search_performed','clinic_contact_click',
    'phone_click','whatsapp_click','website_click','map_click','comparison_started')),
  session_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_clinic_idx ON clinic_event (clinic_id, type, created_at);
