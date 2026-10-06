-- Migración 0000_init — extensiones + enums + geografía + clínica + ubicación PostGIS
-- Ver docs/database-design.md §2-4. Generada a mano para control total PostGIS (ADR-001).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE clinic_status AS ENUM ('DRAFT','ACTIVE','INACTIVE','CLOSED','PENDING_VERIFICATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('UNVERIFIED','PENDING_REVIEW','VERIFIED','OUTDATED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_source AS ENUM ('OFFICIAL_WEBSITE','OFFICIAL_SOCIAL_MEDIA','PHONE','WHATSAPP','EMAIL','DIRECT_COMMUNICATION','PUBLIC_SOURCE','ADMIN_RESEARCH','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS country (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  iso2 CHAR(2) UNIQUE NOT NULL, name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS region (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES country(id),
  code TEXT NOT NULL, name TEXT NOT NULL, UNIQUE(country_id, code)
);
CREATE TABLE IF NOT EXISTS commune (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES region(id),
  cut TEXT NOT NULL, name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE, UNIQUE(region_id, cut)
);
CREATE INDEX IF NOT EXISTS commune_region_idx ON commune (region_id);

CREATE TABLE IF NOT EXISTS clinic (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, slug CITEXT UNIQUE NOT NULL,
  legal_name TEXT, description TEXT,
  phone_e164 TEXT, email CITEXT, website TEXT, whatsapp_e164 TEXT,
  status clinic_status NOT NULL DEFAULT 'DRAFT',
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source,
  verification_method TEXT, verified_by BIGINT, next_review_at DATE,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  search_tsv TSVECTOR, deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinic_status_idx ON clinic (status);
CREATE INDEX IF NOT EXISTS clinic_name_trgm ON clinic USING GIN (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS clinic_location (
  clinic_id BIGINT PRIMARY KEY REFERENCES clinic(id) ON DELETE CASCADE,
  address TEXT, street TEXT, street_number TEXT, additional_address TEXT, postal_code TEXT,
  commune_id BIGINT NOT NULL REFERENCES commune(id),
  latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point,4326) NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at TIMESTAMPTZ, verification_source verification_source, next_review_at DATE,
  CONSTRAINT valid_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT valid_lon CHECK (longitude BETWEEN -180 AND 180)
);

CREATE OR REPLACE FUNCTION sync_location() RETURNS TRIGGER AS $$
BEGIN NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude),4326)::geography; RETURN NEW; END
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sync_location ON clinic_location;
CREATE TRIGGER trg_sync_location BEFORE INSERT OR UPDATE OF latitude, longitude ON clinic_location
  FOR EACH ROW EXECUTE FUNCTION sync_location();
CREATE INDEX IF NOT EXISTS clinic_location_gist ON clinic_location USING GIST (location);

CREATE TABLE IF NOT EXISTS "user" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','EDITOR')),
  is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now()
);
