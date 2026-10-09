import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { VerificationSource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { canTransition, requiresEvidence } from './transitions';

interface TableMeta {
  pk: string;
  hasVerifiedAt: boolean;
  sourceColumn: 'verification_source' | 'source' | null;
  hasNextReviewAt: boolean;
}

// Tablas verificables y su metadata de esquema en PostgreSQL.
// DB-001: clinic_location usa clinic_id como PK, no id.
// DB-002: clinic_photo no tiene verified_at/source/review_at; schedule no tiene source/review_at; precios usan "source".
const TABLE_META: Record<string, TableMeta> = {
  clinic: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: 'verification_source',
    hasNextReviewAt: true,
  },
  clinic_location: {
    pk: 'clinic_id',
    hasVerifiedAt: true,
    sourceColumn: 'verification_source',
    hasNextReviewAt: true,
  },
  clinic_service: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: 'verification_source',
    hasNextReviewAt: true,
  },
  clinic_exam: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: 'verification_source',
    hasNextReviewAt: true,
  },
  clinic_service_price: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: 'source',
    hasNextReviewAt: false,
  },
  clinic_exam_price: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: 'source',
    hasNextReviewAt: false,
  },
  schedule: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: null,
    hasNextReviewAt: false,
  },
  clinic_professional: {
    pk: 'id',
    hasVerifiedAt: true,
    sourceColumn: null,
    hasNextReviewAt: true,
  },
  clinic_photo: {
    pk: 'id',
    hasVerifiedAt: false,
    sourceColumn: null,
    hasNextReviewAt: false,
  },
};

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
    const meta = TABLE_META[input.entityType];
    if (!meta) throw new BadRequestException(`Entidad no verificable: ${input.entityType}`);
    if (!this.prisma) return { queued: true };

    const table = `"${input.entityType}"`;
    const pk = meta.pk;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT verification_status FROM ${table} WHERE ${pk} = $1`, input.entityId,
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Entidad ${input.entityType} con identificador ${input.entityId} no encontrada`);
    }

    const oldStatus = (rows[0]?.verification_status ?? null) as
      | 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED' | null;

    if (!canTransition(oldStatus, input.newStatus)) {
      throw new BadRequestException(`Transición ${oldStatus ?? 'NULL'} → ${input.newStatus} no permitida`);
    }
    if (requiresEvidence(input.newStatus, input.source, input.method, input.notes)) {
      throw new BadRequestException('VERIFIED exige fuente + método o nota de evidencia');
    }

    // Construcción dinámica de UPDATE según capacidades reales de la tabla
    const setClauses: string[] = ['verification_status = $2::verification_status'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any[] = [input.entityId, input.newStatus];

    if (meta.hasVerifiedAt) {
      setClauses.push("verified_at = CASE WHEN $2::verification_status = 'VERIFIED' THEN now() ELSE verified_at END");
    }

    if (meta.sourceColumn) {
      queryParams.push(input.source ?? null);
      const sourceParamIdx = queryParams.length;
      setClauses.push(`${meta.sourceColumn} = COALESCE($${sourceParamIdx}::verification_source, ${meta.sourceColumn})`);
    }

    if (meta.hasNextReviewAt) {
      queryParams.push(input.nextReviewAt ?? null);
      const reviewParamIdx = queryParams.length;
      setClauses.push(`next_review_at = COALESCE($${reviewParamIdx}::date, next_review_at)`);
    }

    const updateSql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${pk} = $1`;
    await this.prisma.$executeRawUnsafe(updateSql, ...queryParams);

    await this.prisma.verificationLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        oldStatus,
        newStatus: input.newStatus,
        changedBy: input.userId ?? null,
        source: (input.source as VerificationSource) ?? null,
        method: input.method ?? null,
        notes: input.notes ?? null,
      },
    });

    await this.audit?.record({
      userId: input.userId ?? null,
      action: input.newStatus === 'VERIFIED' ? 'VERIFY' : 'UNVERIFY',
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: { verification_status: oldStatus },
      newValues: { verification_status: input.newStatus },
    });

    return { entityType: input.entityType, entityId: input.entityId, oldStatus, newStatus: input.newStatus };
  }
}
