import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReportDto } from './dto/report.dto';

// Reportes públicos "información incorrecta". Sin PII del reportante en MVP.
// La validación de motivo/longitudes vive en CreateReportDto (400 automático).
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(input: CreateReportDto) {
    let clinicId: number | null = input.clinicId ?? null;
    if (clinicId === null && input.clinicSlug) {
      const c = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
      clinicId = c ? Number(c.id) : null;
    }
    const created = await this.prisma.report.create({
      data: { clinicId, reason: input.reason, message: input.message?.trim() || null },
    });
    return { data: { id: created.id.toString(), status: created.status } };
  }

  async list(status: string) {
    const rows = await this.prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { clinic: { select: { slug: true, name: true } } },
    });
    return rows.map((r) => ({ ...r, id: r.id.toString(), clinicId: r.clinicId?.toString() ?? null }));
  }

  async resolve(id: number, status: 'TRIAGED' | 'RESOLVED' | 'REJECTED', userId?: number | null) {
    const before = await this.prisma.report.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Reporte no existe');
    const updated = await this.prisma.report.update({ where: { id }, data: { status } });
    await this.audit.record({
      userId: userId ?? null, action: 'UPDATE', entityType: 'report', entityId: id,
      oldValues: { status: before.status }, newValues: { status },
    });
    return { ...updated, id: updated.id.toString() };
  }
}
