import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REASONS = new Set([
  'CLOSED', 'WRONG_PRICE', 'WRONG_SCHEDULE', 'WRONG_PHONE',
  'SERVICE_UNAVAILABLE', 'PROFESSIONAL_LEFT', 'OTHER',
]);

// Reportes públicos "información incorrecta". Sin PII del reportante en MVP.
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { clinicId?: number | null; clinicSlug?: string | null; reason: string; message?: string | null }) {
    if (!REASONS.has(input.reason)) throw new Error('Motivo inválido');
    if (!this.prisma) return { queued: true };
    let clinicId = input.clinicId ?? null;
    if (clinicId === null && input.clinicSlug) {
      const c = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
      clinicId = c ? Number(c.id) : null;
    }
    const created = await this.prisma.report.create({
      data: { clinicId, reason: input.reason, message: input.message ?? null },
    });
    return { ...created, id: created.id.toString() };
  }

  async listOpen() {
    if (!this.prisma) return { data: [] };
    return this.prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { clinic: { select: { slug: true, name: true } } },
    });
  }

  async resolve(id: number, status: 'TRIAGED' | 'RESOLVED' | 'REJECTED') {
    if (!['TRIAGED', 'RESOLVED', 'REJECTED'].includes(status)) throw new Error('Estado inválido');
    return this.prisma.report.update({ where: { id }, data: { status } });
  }
}
