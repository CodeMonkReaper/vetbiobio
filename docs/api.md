# API REST v1 — VetBiobío

> Base: `/api/v1`. Stack: NestJS + DTOs + validación. Envelopes únicos. Admin con auth.

## 1. Envelopes

```json
// Lista
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 132, "totalPages": 7 } }
// Objeto
{ "data": { "slug": "clinica-x" } }
// Error
{ "error": { "code": "NOT_FOUND", "message": "Clínica no existe", "details": null, "request_id": "req_abc" } }
```

Códigos: `200,201,204,400,401,403,404,409,422,429,500`. Paginación `?page=1&limit=20` (`limit max 50`).

## 2. Pública (sin auth)

```text
GET /api/v1/clinics?q=radiografia&commune=concepcion&service=consulta&exam=radiografia
    &specialty=dermatologia&species=DOG&emergency=true&open_now=true
    &min_price=20000&max_price=30000&lat=-36.827&lng=-73.050&radius_km=5
    &sort=RELEVANCE|DISTANCE|PRICE_ASC|PRICE_DESC|VERIFICATION&verified_only=true
GET /api/v1/clinics/:slug
GET /api/v1/services | /specialties | /exams | /equipment | /communes?region=08
GET /api/v1/search?q=dermatologia+perro&lat&lng
POST /api/v1/reports  { clinic_id, reason, message }  (rate-limit 5/h IP)
GET /health  { status, db, postgis, uptime }
```

Respuesta clínica incluye: `verificación por sección, current_price (vista), distancia km si lat/lng, disclaimer precios`.

## 3. Admin (cookie httpOnly + `ADMIN|EDITOR`)

```text
POST /api/v1/admin/auth/login
POST/ PATCH /api/v1/admin/clinics[/:id]      (slug inmutable, genera redirect si cambia)
POST /api/v1/admin/clinics/:id/services | exams | schedules | photos | professionals
POST /api/v1/admin/prices                    (append-only: cierra vigencia anterior en tx)
POST /api/v1/admin/verifications             (cambia status + escribe verification_log + audit_log)
GET  /api/v1/admin/reports?status=OPEN
POST /api/v1/admin/communes/import            (CSV CUT)
```

## 4. Validación

* Todos los inputs por DTO (`class-validator`): query, body, params. Nunca confiar en cliente.
* Teléfonos `E.164`, URLs `http/https`, montos `int >=0`, `day 0-6`, bbox Biobío.
* `422` con `details[]` por campo. Errores loggeados con `request_id`, sin secretos.

## 5. Ejemplo

```text
GET /api/v1/clinics?exam=radiografia&commune=concepcion&lat=-36.827&lng=-73.05&radius_km=5&sort=DISTANCE
→ { data:[{ slug, name, commune, km:1.2, current_exam_price:{min:25000,type:FIXED,verified_at}, is_emergency }], meta:{...} }
```
