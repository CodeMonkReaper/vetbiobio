-- Job diario OUTDATED (ver docs/verification-policy.md §4).
-- Marca VERIFIED → OUTDATED cuando next_review_at < hoy. No borra datos.
-- Tablas con next_review_at: clinic, clinic_location, clinic_service, clinic_exam,
-- clinic_service_price, clinic_exam_price, schedule, clinic_photo.

UPDATE clinic SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_location SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_service SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_exam SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_service_price SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_exam_price SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE schedule SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;

UPDATE clinic_photo SET verification_status = 'OUTDATED'
WHERE verification_status = 'VERIFIED' AND next_review_at < CURRENT_DATE;
