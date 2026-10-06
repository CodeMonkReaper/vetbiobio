import { Injectable, BadRequestException } from '@nestjs/common';
import { VerificationSource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { canTransition, requiresEvidence } from './transitions';

// Tablas verificables (whitelist — nunca interpolar input directo en SQL).
const VERIFIABLE = new Set([
  'clinic', 'clinic_location', 'clinic_service', 'clinic_exam',
  'clinic_service_price', 'clinic_exam_price', 'schedule',
  'clinic_professional', 'clinic_photo',
]);

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async changeStatus(input: {
    entityType: string;
    entityId: number;
    newStatus: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED';
    source?: string | null;
    method?: string | null;
    notes?: string | null;
    userId?: number | null;
    nextReviewAt?: string | null;
  }) {
    if (!VERIFIABLE.has(input.entityType)) throw new BadRequestException('Entidad no verificable');
    if (!this.prisma) return { queued: true };
    const table = `"${input.entityType}"`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT verification_status FROM ${table} WHERE id = $1`, input.entityId,
    );
    const oldStatus = (rows[0]?.verification_status ?? null) as
      | 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED' | null;
    if (!canTransition(oldStatus, input.newStatus)) {
      throw new BadRequestException(`Transición ${oldStatus ?? 'NULL'} → ${input.newStatus} no permitida`);
    }
    if (requiresEvidence(input.newStatus, input.source, input.method, input.notes)) {
      throw new BadRequestException('VERIFIED exige fuente + método o nota de evidencia');
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${table} SET verification_status = $2::verification_status, verified_at = CASE WHEN $2::verification_status = 'VERIFIED' THEN now() ELSE verified_at END, verification_source = COALESCE($3::verification_source, verification_source), next_review_at = COALESCE($4::date, next_review_at) WHERE id = $1`,
      input.entityId, input.newStatus, input.source ?? null, input.nextReviewAt ?? null,
    );
    await this.prisma.verificationLog.create({
      data: {
        entityType: input.entityType, entityId: input.entityId,
        oldStatus, newStatus: input.newStatus,
        changedBy: input.userId ?? null, source: (input.source as VerificationSource) ?? null,
        method: input.method ?? null, notes: input.notes ?? null,
      },
    });
    await this.audit?.record({
      userId: input.userId ?? null,
      action: input.newStatus === 'VERIFIED' ? 'VERIFY' : 'UNVERIFY',
      entityType: input.entityType, entityId: input.entityId,
      oldValues: { verification_status: oldStatus }, newValues: { verification_status: input.newStatus },
    });
    return { entityType: input.entityType, entityId: input.entityId, oldStatus, newStatus: input.newStatus };
  }
}
