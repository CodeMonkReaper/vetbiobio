import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { SearchClinicsDto } from './dto/search-clinics.dto';
import { PrismaService } from '../prisma/prisma.service';

// ADR-001: geoespacial + full-text vía $queryRaw parametrizado.
// Prisma.sql compone fragmentos; los valores viajan como parámetros ($1, $2...),
// nunca concatenados. Orden NULLS LAST para precios CONTACT (sin monto).
@Injectable()
export class ClinicsGeoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchNearby(q: SearchClinicsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const offset = (page - 1) * limit;
    const hasGeo = q.lat !== undefined && q.lng !== undefined;
    const radiusM = Math.min(q.radius_km ?? 5, 50) * 1000;
    const sort = q.sort ?? (hasGeo ? 'DISTANCE' : q.q ? 'RELEVANCE' : 'VERIFICATION');

    const conds: Prisma.Sql[] = [
      Prisma.sql`c.status = 'ACTIVE' AND c.deleted_at IS NULL`,
    ];
    if (q.commune) conds.push(Prisma.sql`com.slug = ${q.commune}`);
    if (q.emergency) conds.push(Prisma.sql`c.is_emergency = TRUE`);
    if (q.verified_only) conds.push(Prisma.sql`c.verification_status = 'VERIFIED'`);
    if (q.q) conds.push(Prisma.sql`c.search_tsv @@ plainto_tsquery('es_unaccent', ${q.q})`);
    if (hasGeo) conds.push(Prisma.sql`ST_DWithin(cl.location, ST_SetSRID(ST_MakePoint(${q.lng}, ${q.lat}), 4326)::geography, ${radiusM})`);
    if (q.exam) conds.push(Prisma.sql`EXISTS (SELECT 1 FROM clinic_exam ce JOIN exam e ON e.id = ce.exam_id WHERE ce.clinic_id = c.id AND ce.is_available AND e.slug = ${q.exam})`);
    if (q.service) conds.push(Prisma.sql`EXISTS (SELECT 1 FROM clinic_service cs JOIN service s ON s.id = cs.service_id WHERE cs.clinic_id = c.id AND cs.is_available AND s.slug = ${q.service})`);
    if (q.specialty) conds.push(Prisma.sql`EXISTS (SELECT 1 FROM clinic_professional cp JOIN professional_specialty ps ON ps.professional_id = cp.professional_id JOIN specialty sp ON sp.id = ps.specialty_id WHERE cp.clinic_id = c.id AND cp.is_active AND sp.slug = ${q.specialty})`);
    if (q.species) conds.push(Prisma.sql`EXISTS (SELECT 1 FROM clinic_animal ca WHERE ca.clinic_id = c.id AND ca.species = ${q.species}::animal_species)`);
    if (q.min_price !== undefined || q.max_price !== undefined) {
      conds.push(Prisma.sql`(SELECT min(p.min_amount) FROM v_current_service_price p JOIN clinic_service cs ON cs.id = p.clinic_service_id WHERE cs.clinic_id = c.id) BETWEEN ${q.min_price ?? 0} AND ${q.max_price ?? 2147483647}`);
    }
    const where = Prisma.join(conds, ' AND ');

    const order = {
      DISTANCE: hasGeo
        ? Prisma.sql`meters ASC NULLS LAST`
        : Prisma.sql`c.verified_at DESC NULLS LAST`,
      PRICE_ASC: Prisma.sql`min_price ASC NULLS LAST`,
      PRICE_DESC: Prisma.sql`min_price DESC NULLS LAST`,
      VERIFICATION: Prisma.sql`CASE c.verification_status WHEN 'VERIFIED' THEN 0 WHEN 'PENDING_REVIEW' THEN 1 WHEN 'OUTDATED' THEN 2 ELSE 3 END, c.verified_at DESC NULLS LAST`,
      RELEVANCE: q.q
        ? Prisma.sql`ts_rank(c.search_tsv, plainto_tsquery('es_unaccent', ${q.q})) DESC`
        : Prisma.sql`c.verified_at DESC NULLS LAST`,
    }[sort];

    const geoSelect = hasGeo
      ? Prisma.sql`ST_Distance(cl.location, ST_SetSRID(ST_MakePoint(${q.lng}, ${q.lat}), 4326)::geography) / 1000 AS km,`
      : Prisma.sql`NULL::double precision AS km,`;
    const metersSelect = hasGeo
      ? Prisma.sql`ST_Distance(cl.location, ST_SetSRID(ST_MakePoint(${q.lng}, ${q.lat}), 4326)::geography) AS meters,`
      : Prisma.sql`NULL::double precision AS meters,`;

    // Abierto ahora: 24h o fila de horario vigente (incluye overnight y vigencias).
    // day_of_week 0=domingo = EXTRACT(DOW). Zona: America/Santiago.
    const openNowSelect = Prisma.sql`(c.is_24h OR EXISTS (
      SELECT 1 FROM schedule s WHERE s.clinic_id = c.id
        AND s.day_of_week = EXTRACT(DOW FROM (now() AT TIME ZONE 'America/Santiago'))::int
        AND NOT s.is_closed
        AND (s.valid_from IS NULL OR (now() AT TIME ZONE 'America/Santiago')::date >= s.valid_from)
        AND (s.valid_until IS NULL OR (now() AT TIME ZONE 'America/Santiago')::date <= s.valid_until)
        AND ((NOT s.is_overnight AND (now() AT TIME ZONE 'America/Santiago')::time BETWEEN s.opening_time AND s.closing_time)
          OR (s.is_overnight AND ((now() AT TIME ZONE 'America/Santiago')::time >= s.opening_time
            OR (now() AT TIME ZONE 'America/Santiago')::time <= s.closing_time)))
    )) AS open_now,`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT c.slug, c.name, c.verification_status, c.verified_at,
             c.is_emergency, c.is_24h, com.name AS commune, com.slug AS commune_slug,
             ${geoSelect}
             ${metersSelect}
             ${openNowSelect}
             EXISTS (SELECT 1 FROM premium_subscription ps WHERE ps.clinic_id = c.id AND ps.status = 'ACTIVE'
               AND ps.plan_id IN ('PREMIUM', 'PREMIUM_PLUS')
               AND (ps.expires_at IS NULL OR ps.expires_at > now())) AS is_premium,
             EXISTS (SELECT 1 FROM advertisement a WHERE a.clinic_id = c.id AND a.status = 'ACTIVE'
               AND a.placement = 'SPONSORED_CLINIC' AND a.start_at <= now() AND a.end_at > now()) AS is_sponsored,
             (SELECT min(p.min_amount) FROM v_current_service_price p JOIN clinic_service cs ON cs.id = p.clinic_service_id WHERE cs.clinic_id = c.id) AS min_price
      FROM clinic c
      JOIN clinic_location cl ON cl.clinic_id = c.id
      LEFT JOIN commune com ON com.id = cl.commune_id
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${limit} OFFSET ${offset}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRows: any[] = await this.prisma.$queryRaw`
      SELECT count(DISTINCT c.id)::int AS total
      FROM clinic c
      JOIN clinic_location cl ON cl.clinic_id = c.id
      LEFT JOIN commune com ON com.id = cl.commune_id
      WHERE ${where}`;
    const total = totalRows[0]?.total ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
