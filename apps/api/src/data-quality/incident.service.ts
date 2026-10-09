import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma, DataQualityStatus, DataQualitySeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RuleViolation } from './rules';
import { ScoreBreakdown } from './scoring.service';

export interface SyncResult {
  opened: number;
  updated: number;
  autoResolved: number;
}

@Injectable()
export class IncidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  computeFingerprint(clinicId: bigint, ruleCode: string, targetEntityId?: string | number): string {
    const raw = `${clinicId.toString()}:${ruleCode}:${targetEntityId ?? 'root'}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async syncClinicQuality(
    clinicId: bigint,
    runId: bigint | null,
    violations: RuleViolation[],
    scoreBreakdown: ScoreBreakdown,
  ): Promise<SyncResult> {
    const now = new Date();
    let opened = 0;
    let updated = 0;
    let autoResolved = 0;

    const currentFingerprints = new Set<string>();

    for (const v of violations) {
      const fingerprint = this.computeFingerprint(clinicId, v.ruleCode, v.targetEntityId);
      currentFingerprints.add(fingerprint);

      // Buscar si ya existe una incidencia abierta con esta fingerprint
      const existingOpen = await this.prisma.dataQualityIssue.findFirst({
        where: {
          fingerprint,
          status: DataQualityStatus.OPEN,
        },
      });

      if (existingOpen) {
        // Actualizar última evaluación y metadata si cambió
        await this.prisma.dataQualityIssue.update({
          where: { id: existingOpen.id },
          data: {
            runId: runId ?? existingOpen.runId,
            lastEvaluatedAt: now,
            severity: v.severity as DataQualitySeverity,
            causeDescription: v.causeDescription,
            recommendedAction: v.recommendedAction,
            metadata: (v.metadata ?? {}) as Prisma.InputJsonValue,
          },
        });
        updated++;
      } else {
        // Nueva incidencia abierta
        await this.prisma.dataQualityIssue.create({
          data: {
            clinicId,
            runId,
            ruleCode: v.ruleCode,
            severity: v.severity as DataQualitySeverity,
            status: DataQualityStatus.OPEN,
            causeDescription: v.causeDescription,
            recommendedAction: v.recommendedAction,
            metadata: (v.metadata ?? {}) as Prisma.InputJsonValue,
            fingerprint,
            firstDetectedAt: now,
            lastEvaluatedAt: now,
          },
        });
        opened++;
      }
    }

    // Auto-resolución (Auto-healing): Incidencias previamente abiertas de esta clínica
    // cuya anomalía ya no está presente en la evaluación actual
    const openIssues = await this.prisma.dataQualityIssue.findMany({
      where: {
        clinicId,
        status: DataQualityStatus.OPEN,
      },
    });

    for (const issue of openIssues) {
      if (!currentFingerprints.has(issue.fingerprint)) {
        await this.prisma.dataQualityIssue.update({
          where: { id: issue.id },
          data: {
            status: DataQualityStatus.RESOLVED,
            resolvedAt: now,
            resolutionReason: 'AUTO_RESOLVED',
            resolutionNotes: 'Anomalía resuelta automáticamente tras la reevaluación de reglas.',
            lastEvaluatedAt: now,
          },
        });
        autoResolved++;
      }
    }

    // Actualizar o crear puntaje de calidad de la clínica
    await this.prisma.clinicQualityScore.upsert({
      where: { clinicId },
      create: {
        clinicId,
        score: scoreBreakdown.score,
        completenessScore: scoreBreakdown.completenessScore,
        verificationScore: scoreBreakdown.verificationScore,
        freshnessScore: scoreBreakdown.freshnessScore,
        activeIssuesCount: violations.length,
        factorBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
        updatedAt: now,
      },
      update: {
        score: scoreBreakdown.score,
        completenessScore: scoreBreakdown.completenessScore,
        verificationScore: scoreBreakdown.verificationScore,
        freshnessScore: scoreBreakdown.freshnessScore,
        activeIssuesCount: violations.length,
        factorBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
        updatedAt: now,
      },
    });

    return { opened, updated, autoResolved };
  }

  async resolveIssue(
    issueId: bigint,
    userId?: bigint | null,
    notes?: string,
  ) {
    const issue = await this.prisma.dataQualityIssue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException(`Incidencia con id ${issueId} no encontrada.`);
    }

    if (issue.status !== DataQualityStatus.OPEN) {
      throw new BadRequestException(
        `La incidencia no puede resolverse porque su estado actual es ${issue.status}.`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.dataQualityIssue.update({
      where: { id: issueId },
      data: {
        status: DataQualityStatus.RESOLVED,
        resolvedAt: now,
        resolvedBy: userId ?? null,
        resolutionNotes: notes ?? 'Resuelta manualmente por el administrador.',
        resolutionReason: 'MANUAL_RESOLVED',
      },
    });

    // Actualizar conteo de incidencias activas en el score si existe
    await this.prisma.clinicQualityScore.updateMany({
      where: { clinicId: issue.clinicId },
      data: {
        activeIssuesCount: { decrement: 1 },
      },
    });

    await this.audit.record({
      userId: userId ?? null,
      action: 'UPDATE',
      entityType: 'data_quality_issue',
      entityId: issueId,
      oldValues: { status: issue.status },
      newValues: {
        status: DataQualityStatus.RESOLVED,
        resolutionReason: 'MANUAL_RESOLVED',
        notes: notes ?? null,
      },
    });

    return updated;
  }

  async dismissIssue(
    issueId: bigint,
    userId?: bigint | null,
    notes?: string,
  ) {
    const issue = await this.prisma.dataQualityIssue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException(`Incidencia con id ${issueId} no encontrada.`);
    }

    if (issue.status !== DataQualityStatus.OPEN) {
      throw new BadRequestException(
        `La incidencia no puede descartarse porque su estado actual es ${issue.status}.`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.dataQualityIssue.update({
      where: { id: issueId },
      data: {
        status: DataQualityStatus.DISMISSED,
        resolvedAt: now,
        resolvedBy: userId ?? null,
        resolutionNotes: notes ?? 'Descartada por el administrador como falso positivo o excepción tolerada.',
        resolutionReason: 'MANUAL_DISMISSED',
      },
    });

    // Actualizar conteo de incidencias activas en el score si existe
    await this.prisma.clinicQualityScore.updateMany({
      where: { clinicId: issue.clinicId },
      data: {
        activeIssuesCount: { decrement: 1 },
      },
    });

    await this.audit.record({
      userId: userId ?? null,
      action: 'UPDATE',
      entityType: 'data_quality_issue',
      entityId: issueId,
      oldValues: { status: issue.status },
      newValues: {
        status: DataQualityStatus.DISMISSED,
        resolutionReason: 'MANUAL_DISMISSED',
        notes: notes ?? null,
      },
    });

    return updated;
  }
}
