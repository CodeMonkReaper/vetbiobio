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

  async create(input: { clinicId?: number | null; reason: string; message?: string | null }) {
    if (!REASONS.has(input.reason)) throw new Error('Motivo inválido');
    if (!this.prisma) return { queued: true };
    const created = await this.prisma.report.create({
      data: { clinicId: input.clinicId ?? null, reason: input.reason, message: input.message ?? null },
    });
    return { ...created, id: created.id.toString() };
  }

  async listOpen() {
    if (!this.prisma) return { data: [] };
    return this.prisma.report.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
