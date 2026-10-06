# Seguridad y privacidad

## 1. Mínimos
HTTPS, `argon2/bcrypt`, sesión cookie `httpOnly+Secure+SameSite`, CORS allowlist (`WEB_BASE_URL`), rate-limit (pública 100/min IP, `/reports` 5/h, login 10/min), validación DTO, ORM + `$queryRaw` parametrizado (sin concatenar SQL), escape XSS, CSRF según cookie, RBAC `ADMIN/EDITOR`.

## 2. Secretos
Nunca en git. Solo `.env` local + env prod. `.env.example` sin valores. `JWT/SESSION_SECRET >=32 chars`, rotación documentada. Logs sin passwords/tokens/PII.

## 3. Privacidad (Ley 19.628 + minimización)
Sin cuentas de dueños en MVP. Profesionales: solo datos laborales. `report.reporter_hash` opaco, sin email/IP cruda. `clinic_event` con `session_hash`, agregación diaria, sin tracking cross-site. Términos/privacidad/cookies pendientes de revisión jurídica antes de prod.

## 4. Disclaimers (texto provisorio, revisar con abogado)
* Precios: "Referenciales, pueden variar según clínica, profesional, procedimiento y fecha. Confirmar directamente."
* Info: "Puede cambiar sin aviso. Confirmar con el establecimiento. La plataforma no presta servicios veterinarios."
