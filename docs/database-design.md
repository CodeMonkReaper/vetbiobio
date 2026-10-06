# Diseño de base de datos — VetBiobío (PostgreSQL 16 + PostGIS 3.4)

> Decisiones aplicadas: ADR-001 a ADR-005, `taxonomy-catalogs.md`, `verification-policy.md`.
> Convenciones: `TIMESTAMPTZ UTC`, dinero `INTEGER CLP`, slugs `CITEXT UNIQUE inmutables`, soft-delete por `status + deleted_at`.

## 1. ERD (textual)

```text
country 1—N region 1—N commune 1—N clinic 1—1 clinic_location
clinic 1—N clinic_service N—1 service
clinic 1—N clinic_exam N—1 exam
clinic_service 1—N clinic_service_price (append-only)
clinic_exam 1—N clinic_exam_price (append-only)
clinic 1—N schedule | clinic_photo | clinic_animal | clinic_equipment N—1 equipment
professional N—N clinic via clinic_professional
professional N—N specialty via professional_specialty
clinic 1—N report | verification_log | advertisement | premium_subscription
user 1—N audit_log
```

## 2. Extensiones y enums

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE clinic_status AS ENUM
 ('DRAFT','ACTIVE','INACTIVE','CLOSED','PENDING_VERIFICATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM
 ('UNVERIFIED','PENDING_REVIEW','VERIFIED','OUTDATED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_source AS ENUM
 ('OFFICIAL_WEBSITE','OFFICIAL_SOCIAL_MEDIA','PHONE','WHATSAPP','EMAIL',
  'DIRECT_COMMUNICATION','PUBLIC_SOURCE','ADMIN_RESEARCH','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pricing_type AS ENUM ('FIXED','RANGE','FROM','CONTACT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE professional_type AS ENUM ('VETERINARIAN','VETERINARY_TECHNICIAN','SPECIALIST','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE animal_species AS ENUM ('DOG','CAT','RABBIT','BIRD','REPTILE','RODENT','EXOTIC','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

## 3. Geografía normalizada

```sql
CREATE TABLE country (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, iso2 CHAR(2) UNIQUE NOT NULL, name TEXT NOT NULL);
CREATE TABLE region (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES country(id),
  code TEXT NOT NULL, -- '08' Biobío
  name TEXT NOT NULL, UNIQUE(country_id, code));
CREATE TABLE commune (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES region(id),
  cut TEXT NOT NULL,  -- código oficial SUBDERE/INE
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(region_id, cut));
CREATE INDEX ON commune (region_id);
```

## 4. Clínica + ubicación PostGIS

```sql
CREATE TABLE clinic (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL,
  legal_name TEXT, description TEXT,
  phone_e164 TEXT, email CITEXT, website TEXT, whatsapp_e164 TEXT,
  status clinic_status NOT NULL DEFAULT 'DRAFT',
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, verification_method TEXT,
  verified_by BIGINT, next_review_at DATE,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,  -- atributo, no servicio
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,        -- atributo
  search_tsv TSVECTOR, deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE clinic_location (
  clinic_id BIGINT PRIMARY KEY REFERENCES clinic(id) ON DELETE CASCADE,
  address TEXT, street TEXT, street_number TEXT, additional_address TEXT, postal_code TEXT,
  commune_id BIGINT NOT NULL REFERENCES commune(id),
  latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point,4326) NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source,
  next_review_at DATE,
  CONSTRAINT valid_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT valid_lon CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT biobio_bbox CHECK (latitude BETWEEN -38.5 AND -36.0 AND longitude BETWEEN -74.5 AND -70.5)
  -- bounding box aproximada Biobío; validar con seed real
);

CREATE OR REPLACE FUNCTION sync_location() RETURNS TRIGGER AS $$
BEGIN NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude),4326)::geography; RETURN NEW; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sync_location ON clinic_location;
CREATE TRIGGER trg_sync_location BEFORE INSERT OR UPDATE OF latitude, longitude ON clinic_location
  FOR EACH ROW EXECUTE FUNCTION sync_location();
```

## 5. Catálogos

```sql
CREATE TABLE service (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE, sort_order INT DEFAULT 0);
CREATE TABLE exam (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT, sample_type TEXT, is_active BOOLEAN DEFAULT TRUE, sort_order INT DEFAULT 0);
CREATE TABLE specialty (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE);
CREATE TABLE equipment (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE);
```

## 6. N:N clínica ↔ servicio / examen / equipo / animal

```sql
CREATE TABLE clinic_service (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES service(id),
  description TEXT, is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, next_review_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, service_id));

CREATE TABLE clinic_exam (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exam(id),
  description TEXT, preparation_notes TEXT, turnaround_hours INT CHECK (turnaround_hours IS NULL OR turnaround_hours >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, next_review_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, exam_id));

CREATE TABLE clinic_equipment (
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id),
  notes TEXT, PRIMARY KEY (clinic_id, equipment_id));

CREATE TABLE clinic_animal (
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  species animal_species NOT NULL, PRIMARY KEY (clinic_id, species));
```

## 7. Precios append-only + vistas current (ADR-005)

```sql
CREATE TABLE clinic_service_price (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_service_id BIGINT NOT NULL REFERENCES clinic_service(id) ON DELETE CASCADE,
  min_amount INT CHECK (min_amount IS NULL OR min_amount >= 0),
  max_amount INT CHECK (max_amount IS NULL OR max_amount >= 0),
  pricing_type pricing_type NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'CLP',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_until DATE,
  source verification_source, verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, next_review_at DATE, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CHECK (pricing_type <> 'FIXED' OR (min_amount IS NOT NULL AND min_amount = max_amount)),
  CHECK (pricing_type <> 'RANGE' OR (min_amount IS NOT NULL AND max_amount IS NOT NULL AND min_amount < max_amount)),
  CHECK (pricing_type <> 'FROM'  OR (min_amount IS NOT NULL AND max_amount IS NULL)),
  CHECK (pricing_type <> 'CONTACT' OR (min_amount IS NULL AND max_amount IS NULL)));

CREATE TABLE clinic_exam_price (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_exam_id BIGINT NOT NULL REFERENCES clinic_exam(id) ON DELETE CASCADE,
  min_amount INT CHECK (min_amount IS NULL OR min_amount >= 0),
  max_amount INT CHECK (max_amount IS NULL OR max_amount >= 0),
  pricing_type pricing_type NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'CLP',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_until DATE,
  source verification_source, verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, next_review_at DATE, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from));

CREATE VIEW v_current_service_price AS SELECT DISTINCT ON (clinic_service_id) *
  FROM clinic_service_price WHERE valid_until IS NULL ORDER BY clinic_service_id, valid_from DESC, id DESC;
CREATE VIEW v_current_exam_price AS SELECT DISTINCT ON (clinic_exam_id) *
  FROM clinic_exam_price WHERE valid_until IS NULL ORDER BY clinic_exam_id, valid_from DESC, id DESC;
-- Cierre de vigencia en transacción (repositorio): UPDATE anterior SET valid_until = new_from - 1; INSERT nuevo.
```

## 8. Horarios estructurados

```sql
CREATE TABLE schedule (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo ISO adaptado
  opening_time TIME, closing_time TIME, is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_overnight BOOLEAN NOT NULL DEFAULT FALSE, -- ej. 20:00–02:00
  valid_from DATE, valid_until DATE, label TEXT, -- 'feriado', 'horario verano'
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED', verified_at TIMESTAMPTZ,
  CHECK (is_closed OR (opening_time IS NOT NULL AND closing_time IS NOT NULL)),
  UNIQUE(clinic_id, day_of_week, opening_time, valid_from));
```

## 9. Profesionales

```sql
CREATE TABLE professional (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL, display_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  slug CITEXT UNIQUE NOT NULL, professional_type professional_type NOT NULL DEFAULT 'VETERINARIAN',
  description TEXT, license_number TEXT, -- nullable, no unique global (Chile sin colegiatura única)
  status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE professional_specialty (professional_id BIGINT REFERENCES professional(id) ON DELETE CASCADE, specialty_id BIGINT REFERENCES specialty(id), PRIMARY KEY (professional_id, specialty_id));

CREATE TABLE clinic_professional (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  professional_id BIGINT NOT NULL REFERENCES professional(id),
  role TEXT, is_active BOOLEAN DEFAULT TRUE, schedule_note TEXT,
  started_at DATE, ended_at DATE,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED', verified_at TIMESTAMPTZ,
  UNIQUE(clinic_id, professional_id));
```

## 10. Fotos / reportes / verificación / auditoría / negocio

```sql
CREATE TABLE clinic_photo (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, clinic_id BIGINT NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  url TEXT NOT NULL, public_id TEXT, alt_text TEXT, sort_order INT DEFAULT 0, is_primary BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'UNVERIFIED', created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE report (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, clinic_id BIGINT REFERENCES clinic(id),
  reason TEXT NOT NULL CHECK (reason IN ('CLOSED','WRONG_PRICE','WRONG_SCHEDULE','WRONG_PHONE','SERVICE_UNAVAILABLE','PROFESSIONAL_LEFT','OTHER')),
  message TEXT, reporter_hash TEXT, status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','TRIAGED','RESOLVED','REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE verification_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, entity_type TEXT NOT NULL, entity_id BIGINT NOT NULL,
  old_status verification_status, new_status verification_status NOT NULL,
  changed_by BIGINT, source verification_source, method TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX ON verification_log (entity_type, entity_id);

CREATE TABLE "user" (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email CITEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('ADMIN','EDITOR')), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id BIGINT REFERENCES "user"(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','VERIFY','UNVERIFY','DEACTIVATE','PUBLISH')),
  entity_type TEXT NOT NULL, entity_id BIGINT NOT NULL, old_values JSONB, new_values JSONB,
  ip_address INET, created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX ON audit_log (entity_type, entity_id);

CREATE TABLE clinic_event (clinic_id BIGINT REFERENCES clinic(id), type TEXT NOT NULL, session_hash TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX ON clinic_event (clinic_id, type, created_at);

CREATE TABLE slug_redirect (old_slug CITEXT PRIMARY KEY, new_slug CITEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE advertisement (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, clinic_id BIGINT REFERENCES clinic(id), campaign_name TEXT NOT NULL, placement TEXT NOT NULL CHECK (placement IN ('SPONSORED_CLINIC','BANNER','FEATURED_SERVICE')), start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', created_at TIMESTAMPTZ DEFAULT now(), CHECK (end_at > start_at));
CREATE TABLE premium_subscription (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, clinic_id BIGINT NOT NULL REFERENCES clinic(id), plan_id TEXT NOT NULL CHECK (plan_id IN ('FREE','PREMIUM','PREMIUM_PLUS')), status TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
```

## 11. Índices

```sql
CREATE INDEX ON clinic (status); CREATE INDEX ON clinic (verification_status);
CREATE INDEX clinic_name_trgm ON clinic USING GIN (name gin_trgm_ops);
CREATE INDEX ON clinic_service (service_id); CREATE INDEX ON clinic_exam (exam_id);
CREATE INDEX ON clinic_location USING GIST (location);
CREATE INDEX ON clinic (slug); CREATE INDEX ON commune (slug);
CREATE INDEX ON clinic_service_price (clinic_service_id, valid_until);
CREATE INDEX ON clinic_exam_price (clinic_exam_id, valid_until);
-- search_tsv se mantiene por trigger (nombre + comuna + servicios) con diccionario spanish.
```

## 12. Búsqueda: tsvector + trigram + geo

```sql
-- Ejemplo: veterinarias con radiografía a <5km de Concepción (-36.827,-73.050), solo verificadas, orden distancia + precio
SELECT c.slug, cl.address,
  ST_Distance(cl.location, ST_SetSRID(ST_MakePoint(-73.050,-36.827),4326)::geography)/1000 AS km,
  p.min_amount
FROM clinic c
JOIN clinic_location cl ON cl.clinic_id = c.id
JOIN clinic_exam ce ON ce.clinic_id = c.id AND ce.is_available
JOIN exam e ON e.id = ce.exam_id AND e.slug = 'radiografia'
LEFT JOIN v_current_exam_price p ON p.clinic_exam_id = ce.id
WHERE c.status='ACTIVE' AND c.deleted_at IS NULL
  AND ST_DWithin(cl.location, ST_SetSRID(ST_MakePoint(-73.050,-36.827),4326)::geography, 5000)
ORDER BY km ASC, p.min_amount ASC NULLS LAST LIMIT 20;
-- Full-text: WHERE c.search_tsv @@ plainto_tsquery('spanish','dermatologia concepcion')
-- Validar con EXPLAIN ANALYZE; toda query geo vía $queryRaw (ADR-001).
```

## 13. Migraciones y seeds

Orden: `0000 extensions+enums → 0001 geo → 0002 clinic+location → 0003 catalogs → 0004 relations → 0005 prices → 0006 schedules/professionals → 0007 media/reports/logs/business`.
Seeds: `country(CL,Chile) → region(08,Biobío) → 33 communes` (Concepción×12, Arauco×7, Biobío×14 — ver taxonomy + CUT oficial SUBDERE), `services/exams/specialties/equipment/species`, usuario admin bootstrap, 3 clínicas demo con precios históricos.
Nunca DDL manual en prod sin migración versionada.
