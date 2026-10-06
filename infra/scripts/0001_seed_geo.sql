-- Seed 0001 — geografía base Biobío + verificación PostGIS.
-- Idempotente vía ON CONFLICT DO NOTHING. CUT a validar contra SUBDERE/INE antes de prod.

INSERT INTO country (iso2, name) VALUES ('CL', 'Chile')
ON CONFLICT DO NOTHING;

INSERT INTO region (country_id, code, name)
SELECT id, '08', 'Biobío' FROM country WHERE iso2 = 'CL'
ON CONFLICT DO NOTHING;

DO $$
DECLARE rid BIGINT;
BEGIN
  SELECT id INTO rid FROM region WHERE code = '08' LIMIT 1;
  IF rid IS NULL THEN RAISE EXCEPTION 'region 08 no existe'; END IF;
  INSERT INTO commune (region_id, cut, name, slug) VALUES
    (rid,'08101','Concepción','concepcion'),(rid,'08102','Coronel','coronel'),
    (rid,'08103','Chiguayante','chiguayante'),(rid,'08104','Florida','florida'),
    (rid,'08105','Hualqui','hualqui'),(rid,'08106','Lota','lota'),
    (rid,'08107','Penco','penco'),(rid,'08108','San Pedro de la Paz','san-pedro-de-la-paz'),
    (rid,'08109','Santa Juana','santa-juana'),(rid,'08110','Talcahuano','talcahuano'),
    (rid,'08111','Tomé','tome'),(rid,'08112','Hualpén','hualpen'),
    (rid,'08201','Lebu','lebu'),(rid,'08202','Arauco','arauco'),
    (rid,'08203','Curanilahue','curanilahue'),(rid,'08204','Los Álamos','los-alamos'),
    (rid,'08205','Cañete','canete'),(rid,'08206','Contulmo','contulmo'),(rid,'08207','Tirúa','tirua'),
    (rid,'08301','Los Ángeles','los-angeles'),(rid,'08302','Antuco','antuco'),
    (rid,'08303','Cabrero','cabrero'),(rid,'08304','Laja','laja'),(rid,'08305','Mulchén','mulchen'),
    (rid,'08306','Nacimiento','nacimiento'),(rid,'08307','Negrete','negrete'),
    (rid,'08308','Quilaco','quilaco'),(rid,'08309','Quilleco','quilleco'),
    (rid,'08310','San Rosendo','san-rosendo'),(rid,'08311','Santa Bárbara','santa-barbara'),
    (rid,'08312','Tucapel','tucapel'),(rid,'08313','Yumbel','yumbel'),(rid,'08314','Alto Biobío','alto-biobio')
  ON CONFLICT DO NOTHING;
END $$;
