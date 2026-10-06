-- Migración 0003_fix — next_review_at faltante en schedule y clinic_photo.
-- Toda entidad verificable lleva next_review_at (verification-policy §2).

ALTER TABLE schedule ADD COLUMN IF NOT EXISTS next_review_at DATE;
ALTER TABLE clinic_photo ADD COLUMN IF NOT EXISTS next_review_at DATE;
