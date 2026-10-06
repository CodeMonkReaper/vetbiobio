import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TYPES = new Set([
  'clinic_profile_view', 'search_performed', 'clinic_contact_click',
  'phone_click', 'whatsapp_click', 'website_click', 'map_click', 'comparison_started',
]);

// Analítica sin PII: sin IP, sin user-agent, session_hash opaco opcional.
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: { clinicSlug?: string | null; type: string; sessionHash?: string | null }) {
    if (!TYPES.has(input.type)) throw new BadRequestException('Tipo de evento inválido');
    let clinicId: number | null = null;
    if (input.clinicSlug) {
      const c = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
      clinicId = c ? Number(c.id) : null;
    }
    const created = await this.prisma.clinicEvent.create({
      data: { clinicId, type: input.type, sessionHash: input.sessionHash?.slice(0, 64) ?? null },
    });
    return { ...created, id: created.id.toString() };
  }

  async dailyCounts(clinicSlug: string, days = 30) {
    const c = await this.prisma.clinic.findUnique({ where: { slug: clinicSlug }, select: { id: true } });
    if (!c) return { data: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT created_at::date AS day, type, count(*)::int AS n
      FROM clinic_event WHERE clinic_id = ${c.id} AND created_at >= now() - (${days}::int * INTERVAL '1 day')
      GROUP BY 1, 2 ORDER BY 1 DESC, 2`;
    return { data: rows };
  }
}
