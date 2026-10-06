import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SearchClinicsDto } from './dto/search-clinics.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { ClinicsGeoRepository } from './clinics.geo.repository';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, uniqueSlug } from '../common/slug';

@Injectable()
export class ClinicsService {
  constructor(private readonly geo: ClinicsGeoRepository, private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  search(q: SearchClinicsDto) {
    return this.geo.searchNearby(q);
  }

  // Alta admin: clínica DRAFT + ubicación (el trigger sync_location genera GEOGRAPHY).
  async createDraft(dto: CreateClinicDto, userId?: number | null) {
    if (!this.prisma) return { queued: true, slug: slugify(dto.name) };
    const slug = await uniqueSlug(dto.name, async (s) => {
      const exists = await this.prisma.clinic.findUnique({ where: { slug: s } });
      return !!exists;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created: any = await this.prisma.$transaction(async (tx: any) => {
      const clinic = await tx.clinic.create({
        data: {
          name: dto.name, slug, description: dto.description ?? null,
          phoneE164: dto.phone ?? null, website: dto.website ?? null,
          status: 'DRAFT', isEmergency: dto.isEmergency ?? false, is24h: dto.is24h ?? false,
        },
      });
      await tx.$executeRaw`
        INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location)
        SELECT ${clinic.id}, ${dto.address}, c.id, ${dto.latitude}, ${dto.longitude},
               ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
        FROM commune c WHERE c.cut = ${dto.communeCut}`;
      return clinic;
    });
    const safe = { ...created, id: created.id.toString() };
    await this.audit?.record({ userId: userId ?? null, action: 'CREATE', entityType: 'clinic', entityId: Number(created.id), newValues: safe });
    return safe;
  }

  // Desactivación lógica — nunca DELETE físico.
  async deactivate(id: number, userId?: number | null) {
    if (!this.prisma) return { queued: true };
    const updated = await this.prisma.clinic.update({ where: { id }, data: { status: 'INACTIVE' } });
    const safe = { ...updated, id: updated.id.toString() };
    await this.audit?.record({ userId: userId ?? null, action: 'DEACTIVATE', entityType: 'clinic', entityId: id, newValues: safe });
    return safe;
  }

  // Perfil público: una query agregada con precios vigentes y verificación por sección.
  async getProfile(slug: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT c.slug, c.name, c.description, c.phone_e164 AS phone, c.email, c.website,
             c.whatsapp_e164 AS whatsapp, c.status, c.verification_status, c.verified_at,
             c.is_emergency, c.is_24h,
             cl.address, cl.latitude, cl.longitude, com.name AS commune, com.slug AS commune_slug,
             cl.verification_status AS location_status, cl.verified_at AS location_verified_at,
             (c.is_24h OR EXISTS (
               SELECT 1 FROM schedule s WHERE s.clinic_id = c.id
                 AND s.day_of_week = EXTRACT(DOW FROM (now() AT TIME ZONE 'America/Santiago'))::int
                 AND NOT s.is_closed
                 AND (s.valid_from IS NULL OR (now() AT TIME ZONE 'America/Santiago')::date >= s.valid_from)
                 AND (s.valid_until IS NULL OR (now() AT TIME ZONE 'America/Santiago')::date <= s.valid_until)
                 AND ((NOT s.is_overnight AND (now() AT TIME ZONE 'America/Santiago')::time BETWEEN s.opening_time AND s.closing_time)
                   OR (s.is_overnight AND ((now() AT TIME ZONE 'America/Santiago')::time >= s.opening_time
                     OR (now() AT TIME ZONE 'America/Santiago')::time <= s.closing_time)))
             )) AS open_now,
             EXISTS (SELECT 1 FROM premium_subscription ps WHERE ps.clinic_id = c.id AND ps.status = 'ACTIVE'
               AND ps.plan_id IN ('PREMIUM', 'PREMIUM_PLUS')
               AND (ps.expires_at IS NULL OR ps.expires_at > now())) AS is_premium,
             EXISTS (SELECT 1 FROM advertisement a WHERE a.clinic_id = c.id AND a.status = 'ACTIVE'
               AND a.placement = 'SPONSORED_CLINIC' AND a.start_at <= now() AND a.end_at > now()) AS is_sponsored,
             COALESCE((SELECT json_agg(s ORDER BY s.name) FROM (
               SELECT sv.name, sv.slug, cs.verification_status, cs.verified_at,
                      p.min_amount, p.max_amount, p.pricing_type, p.currency, p.verified_at AS price_verified_at
               FROM clinic_service cs JOIN service sv ON sv.id = cs.service_id
               LEFT JOIN v_current_service_price p ON p.clinic_service_id = cs.id
               WHERE cs.clinic_id = c.id AND cs.is_available) s), '[]') AS services,
             COALESCE((SELECT json_agg(e ORDER BY e.name) FROM (
               SELECT ex.name, ex.slug, ce.verification_status, ce.verified_at,
                      p.min_amount, p.max_amount, p.pricing_type, p.currency, p.verified_at AS price_verified_at
               FROM clinic_exam ce JOIN exam ex ON ex.id = ce.exam_id
               LEFT JOIN v_current_exam_price p ON p.clinic_exam_id = ce.id
               WHERE ce.clinic_id = c.id AND ce.is_available) e), '[]') AS exams,
             COALESCE((SELECT json_agg(pr ORDER BY pr.display_name) FROM (
               SELECT pf.display_name, pf.professional_type, cp.role, cp.verification_status,
                      (SELECT coalesce(string_agg(sp.name, ', '), '') FROM professional_specialty ps
                       JOIN specialty sp ON sp.id = ps.specialty_id WHERE ps.professional_id = pf.id) AS specialties
               FROM clinic_professional cp JOIN professional pf ON pf.id = cp.professional_id
               WHERE cp.clinic_id = c.id AND cp.is_active) pr), '[]') AS professionals,
             COALESCE((SELECT json_agg(h ORDER BY h.day_of_week, h.opening_time) FROM (
               SELECT day_of_week, opening_time, closing_time, is_closed, is_overnight, label, verification_status
               FROM schedule WHERE clinic_id = c.id) h), '[]') AS schedules,
             COALESCE((SELECT json_agg(ph ORDER BY ph.sort_order) FROM (
               SELECT url, alt_text, is_primary, sort_order FROM clinic_photo WHERE clinic_id = c.id) ph), '[]') AS photos,
             COALESCE((SELECT json_agg(a.species) FROM clinic_animal a WHERE a.clinic_id = c.id), '[]') AS animals,
             COALESCE((SELECT json_agg(eq ORDER BY eq.name) FROM (
               SELECT e2.name FROM clinic_equipment ceq JOIN equipment e2 ON e2.id = ceq.equipment_id
               WHERE ceq.clinic_id = c.id) eq), '[]') AS equipment
      FROM clinic c
      LEFT JOIN clinic_location cl ON cl.clinic_id = c.id
      LEFT JOIN commune com ON com.id = cl.commune_id
      WHERE c.slug = ${slug} AND c.status = 'ACTIVE' AND c.deleted_at IS NULL`;
    if (!rows[0]) throw new NotFoundException('Clínica no existe');
    return { data: rows[0] };
  }
  async bySlugWithRedirect(slug: string) {
    if (!this.prisma) return { data: null };
    const clinic = await this.prisma.clinic.findUnique({ where: { slug } });
    if (clinic) return { data: { ...clinic, id: clinic.id.toString() } };
    const redir = await this.prisma.slugRedirect.findUnique({ where: { oldSlug: slug } });
    if (!redir) throw new NotFoundException('Clínica no existe');
    return { redirect: redir.newSlug };
  }

  // Servicios/exámenes con ids + precio vigente (para el formulario de precios).
  async adminServices(slug: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT cs.id, 'service' AS kind, sv.slug, sv.name,
             p.min_amount, p.max_amount, p.pricing_type
      FROM clinic c JOIN clinic_service cs ON cs.clinic_id = c.id
      JOIN service sv ON sv.id = cs.service_id
      LEFT JOIN v_current_service_price p ON p.clinic_service_id = cs.id
      WHERE c.slug = ${slug}
      UNION ALL
      SELECT ce.id, 'exam' AS kind, ex.slug, ex.name,
             p.min_amount, p.max_amount, p.pricing_type
      FROM clinic c JOIN clinic_exam ce ON ce.clinic_id = c.id
      JOIN exam ex ON ex.id = ce.exam_id
      LEFT JOIN v_current_exam_price p ON p.clinic_exam_id = ce.id
      WHERE c.slug = ${slug}
      ORDER BY kind, name`;
    return { data: rows };
  }

  async adminSchedules(slug: string) {
    const clinic = await this.prisma.clinic.findUnique({ where: { slug }, select: { id: true } });
    if (!clinic) throw new NotFoundException('Clínica no existe');
    return this.prisma.schedule.findMany({
      where: { clinicId: clinic.id },
      orderBy: [{ dayOfWeek: 'asc' }, { openingTime: 'asc' }],
    });
  }

  async adminAddSchedule(
    slug: string,
    dto: { dayOfWeek: number; openingTime?: string; closingTime?: string; isClosed?: boolean; isOvernight?: boolean; label?: string },
    userId?: number | null,
  ) {
    const clinic = await this.prisma.clinic.findUnique({ where: { slug }, select: { id: true } });
    if (!clinic) throw new NotFoundException('Clínica no existe');
    if (!dto.isClosed && (!dto.openingTime || !dto.closingTime)) {
      throw new BadRequestException('Horario abierto requiere apertura y cierre');
    }
    const toTime = (t: string) => new Date(`1970-01-01T${t}:00`);
    const created = await this.prisma.schedule.create({
      data: {
        clinicId: clinic.id,
        dayOfWeek: dto.dayOfWeek,
        openingTime: dto.openingTime ? toTime(dto.openingTime) : null,
        closingTime: dto.closingTime ? toTime(dto.closingTime) : null,
        isClosed: dto.isClosed ?? false,
        isOvernight: dto.isOvernight ?? false,
        label: dto.label ?? null,
      },
    });
    await this.audit.record({ userId: userId ?? null, action: 'CREATE', entityType: 'schedule', entityId: Number(created.id) });
    return created;
  }

  // Comparación: 2–3 perfiles vigentes por slug. Falla 404 si alguno no existe/inactivo.
  async compare(slugs: string[], lat?: number, lng?: number) {
    const uniq = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))];
    if (uniq.length < 2 || uniq.length > 3) {
      throw new BadRequestException('Indica 2 o 3 slugs para comparar');
    }
    const profiles = [];
    for (const slug of uniq) {
      const p = await this.getProfile(slug);
      profiles.push(p.data);
    }
    if (lat !== undefined && lng !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kms: any[] = await this.prisma.$queryRaw`
        SELECT c.slug, ST_Distance(cl.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 AS km
        FROM clinic c JOIN clinic_location cl ON cl.clinic_id = c.id WHERE c.slug = ANY(${uniq})`;
      const bySlug = new Map(kms.map((r) => [r.slug, Number(r.km)]));
      for (const p of profiles) p.km = bySlug.get(p.slug) ?? null;
    }
    return { data: profiles };
  }
}
