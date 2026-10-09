import { Injectable, NotFoundException } from '@nestjs/common';
import { DataQualityTrigger, DataQualityStatus, DataQualitySeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService, QUALITY_DISCLAIMER } from './scoring.service';
import { IncidentService } from './incident.service';
import {
  QualityRule,
  RuleEvaluationContext,
  RuleInvalidPhone,
  RuleDuplicatePhone,
  RuleSuspiciousGeo,
  RuleScheduleConflict,
  RuleExpiredPrices,
  RuleOutdatedVerification,
  RuleIncompleteFields,
} from './rules';
import { QueryIssuesDto } from './dto/query-issues.dto';

export interface QualityRunSummary {
  runId: string;
  evaluatedClinics: number;
  openIssues: number;
  resolvedIssues: number;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
}

@Injectable()
export class DataQualityService {
  private readonly rules: QualityRule[] = [
    new RuleInvalidPhone(),
    new RuleDuplicatePhone(),
    new RuleSuspiciousGeo(),
    new RuleScheduleConflict(),
    new RuleExpiredPrices(),
    new RuleOutdatedVerification(),
    new RuleIncompleteFields(),
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly incidentService: IncidentService,
  ) {}

  async runQualityEvaluation(
    triggerType: DataQualityTrigger = DataQualityTrigger.MANUAL,
    triggeredByUserId?: bigint | null,
    targetClinicId?: bigint | null,
  ): Promise<QualityRunSummary> {
    const startTime = Date.now();
    const run = await this.prisma.dataQualityRun.create({
      data: {
        triggerType,
        triggeredBy: triggeredByUserId ?? null,
        startedAt: new Date(),
      },
    });

    // 1. Obtener clínicas a evaluar
    const clinicsQuery = targetClinicId
      ? `SELECT id, name, slug, phone_e164, whatsapp_e164, email, website, description, status, verification_status, verified_at, next_review_at, created_at, updated_at FROM clinic WHERE id = ${targetClinicId} AND deleted_at IS NULL`
      : `SELECT id, name, slug, phone_e164, whatsapp_e164, email, website, description, status, verification_status, verified_at, next_review_at, created_at, updated_at FROM clinic WHERE deleted_at IS NULL ORDER BY id ASC`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clinics: any[] = await this.prisma.$queryRawUnsafe(clinicsQuery);

    // 2. Obtener teléfonos de todas las clínicas para detección de duplicados
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPhonesRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, name, phone_e164, whatsapp_e164 FROM clinic WHERE deleted_at IS NULL
    `);
    const allClinicsPhones: Array<{ clinicId: bigint; phoneE164: string; clinicName: string }> = [];
    for (const r of allPhonesRows) {
      if (r.phone_e164) {
        allClinicsPhones.push({ clinicId: BigInt(r.id), phoneE164: r.phone_e164, clinicName: r.name });
      }
      if (r.whatsapp_e164 && r.whatsapp_e164 !== r.phone_e164) {
        allClinicsPhones.push({ clinicId: BigInt(r.id), phoneE164: r.whatsapp_e164, clinicName: r.name });
      }
    }

    // 3. Obtener ubicaciones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locationsRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT clinic_id, address, commune_id, latitude, longitude, verification_status, verified_at, next_review_at
      FROM clinic_location
    `);
    const locationsMap = new Map<string, any>();
    for (const loc of locationsRows) {
      locationsMap.set(loc.clinic_id.toString(), loc);
    }

    // 4. Obtener horarios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schedulesRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, clinic_id, day_of_week, opening_time, closing_time, is_closed, is_overnight, valid_from, valid_until
      FROM schedule
    `);
    const schedulesMap = new Map<string, any[]>();
    for (const s of schedulesRows) {
      const cid = s.clinic_id.toString();
      const list = schedulesMap.get(cid) || [];
      list.push({
        id: BigInt(s.id),
        clinicId: BigInt(s.clinic_id),
        dayOfWeek: s.day_of_week,
        openingTime: s.opening_time,
        closingTime: s.closing_time,
        isClosed: s.is_closed,
        isOvernight: s.is_overnight,
        validFrom: s.valid_from ? new Date(s.valid_from) : null,
        validUntil: s.valid_until ? new Date(s.valid_until) : null,
      });
      schedulesMap.set(cid, list);
    }

    // 5. Obtener servicios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const servicesRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT cs.id, cs.clinic_id, cs.service_id, s.name AS service_name
      FROM clinic_service cs
      JOIN service s ON s.id = cs.service_id
    `);
    const servicesMap = new Map<string, any[]>();
    const clinicServiceIdsToClinicId = new Map<string, string>();
    for (const s of servicesRows) {
      const cid = s.clinic_id.toString();
      clinicServiceIdsToClinicId.set(s.id.toString(), cid);
      const list = servicesMap.get(cid) || [];
      list.push({
        id: BigInt(s.id),
        clinicId: BigInt(s.clinic_id),
        serviceId: BigInt(s.service_id),
        isAvailable: true,
        serviceName: s.service_name,
      });
      servicesMap.set(cid, list);
    }

    // 6. Obtener precios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pricesRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, clinic_service_id, min_amount, max_amount, pricing_type, valid_from, valid_until, verified_at
      FROM clinic_service_price
    `);
    const pricesMap = new Map<string, any[]>();
    for (const p of pricesRows) {
      const csId = p.clinic_service_id.toString();
      const cid = clinicServiceIdsToClinicId.get(csId);
      if (cid) {
        const list = pricesMap.get(cid) || [];
        list.push({
          id: BigInt(p.id),
          clinicServiceId: BigInt(p.clinic_service_id),
          minAmount: p.min_amount,
          maxAmount: p.max_amount,
          pricingType: p.pricing_type,
          validFrom: new Date(p.valid_from),
          validUntil: p.valid_until ? new Date(p.valid_until) : null,
          verifiedAt: p.verified_at ? new Date(p.verified_at) : null,
        });
        pricesMap.set(cid, list);
      }
    }

    let totalOpened = 0;
    let totalUpdated = 0;
    let totalResolved = 0;

    // 7. Evaluar cada clínica
    for (const c of clinics) {
      const cidStr = c.id.toString();
      const loc = locationsMap.get(cidStr) || null;

      const ctx: RuleEvaluationContext = {
        clinic: {
          id: BigInt(c.id),
          name: c.name,
          slug: c.slug,
          phoneE164: c.phone_e164,
          whatsappE164: c.whatsapp_e164,
          email: c.email,
          website: c.website,
          description: c.description,
          status: c.status,
          verificationStatus: c.verification_status,
          verifiedAt: c.verified_at ? new Date(c.verified_at) : null,
          nextReviewAt: c.next_review_at ? new Date(c.next_review_at) : null,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
        },
        location: loc
          ? {
              clinicId: BigInt(loc.clinic_id),
              address: loc.address,
              communeId: BigInt(loc.commune_id),
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
              verificationStatus: loc.verification_status,
              verifiedAt: loc.verified_at ? new Date(loc.verified_at) : null,
              nextReviewAt: loc.next_review_at ? new Date(loc.next_review_at) : null,
            }
          : null,
        schedules: schedulesMap.get(cidStr) || [],
        services: servicesMap.get(cidStr) || [],
        prices: pricesMap.get(cidStr) || [],
        allClinicsPhones,
      };

      const violations = this.rules.flatMap((rule) => rule.evaluate(ctx));
      const scoreBreakdown = this.scoringService.calculateScore(ctx, violations);

      const syncResult = await this.incidentService.syncClinicQuality(
        BigInt(c.id),
        run.id,
        violations,
        scoreBreakdown,
      );

      totalOpened += syncResult.opened;
      totalUpdated += syncResult.updated;
      totalResolved += syncResult.autoResolved;
    }

    const durationMs = Date.now() - startTime;
    const finishedAt = new Date();

    const openIssuesCount = await this.prisma.dataQualityIssue.count({
      where: { status: DataQualityStatus.OPEN },
    });

    await this.prisma.dataQualityRun.update({
      where: { id: run.id },
      data: {
        evaluatedClinics: clinics.length,
        openIssuesCount,
        resolvedIssuesCount: totalResolved,
        executionTimeMs: durationMs,
        finishedAt,
      },
    });

    return {
      runId: run.id.toString(),
      evaluatedClinics: clinics.length,
      openIssues: openIssuesCount,
      resolvedIssues: totalResolved,
      durationMs,
      startedAt: run.startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
    };
  }

  async getOverview() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clinicsCountRes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT count(*)::int AS count FROM clinic WHERE deleted_at IS NULL
    `);
    const totalClinics = clinicsCountRes[0]?.count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avgScoreRes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT COALESCE(ROUND(AVG(score)), 0)::int AS avg_score FROM clinic_quality_score
    `);
    const averageScore = avgScoreRes[0]?.avg_score ?? 0;

    // Conteo por severidad de incidencias abiertas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const severityRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT severity, count(*)::int AS count
      FROM data_quality_issue
      WHERE status = 'OPEN'
      GROUP BY severity
    `);
    const issuesBySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    for (const r of severityRows) {
      if (r.severity in issuesBySeverity) {
        issuesBySeverity[r.severity as keyof typeof issuesBySeverity] = r.count;
      }
    }

    // Conteo por regla
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ruleRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT rule_code, count(*)::int AS count
      FROM data_quality_issue
      WHERE status = 'OPEN'
      GROUP BY rule_code
      ORDER BY count DESC
    `);
    const issuesByRule = ruleRows.map((r) => ({
      ruleCode: r.rule_code,
      count: r.count,
    }));

    // Distribución por nivel de score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tierRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        COUNT(CASE WHEN score >= 80 THEN 1 END)::int AS tier_alta,
        COUNT(CASE WHEN score >= 55 AND score < 80 THEN 1 END)::int AS tier_media,
        COUNT(CASE WHEN score >= 30 AND score < 55 THEN 1 END)::int AS tier_baja,
        COUNT(CASE WHEN score < 30 THEN 1 END)::int AS tier_critica
      FROM clinic_quality_score
    `);
    const tiers = {
      ALTA: tierRows[0]?.tier_alta ?? 0,
      MEDIA: tierRows[0]?.tier_media ?? 0,
      BAJA: tierRows[0]?.tier_baja ?? 0,
      CRITICA: tierRows[0]?.tier_critica ?? 0,
    };

    // Última ejecución
    const lastRun = await this.prisma.dataQualityRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const totalOpenIssues =
      issuesBySeverity.CRITICAL +
      issuesBySeverity.HIGH +
      issuesBySeverity.MEDIUM +
      issuesBySeverity.LOW;

    const healthyClinicsPercent =
      totalClinics > 0 ? Math.round((tiers.ALTA / totalClinics) * 100) : 0;

    return {
      totalClinics,
      averageScore,
      healthyClinicsPercent,
      totalOpenIssues,
      issuesBySeverity,
      issuesByRule,
      tiers,
      lastRun: lastRun
        ? {
            id: lastRun.id.toString(),
            triggerType: lastRun.triggerType,
            startedAt: lastRun.startedAt.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString() ?? null,
            evaluatedClinics: lastRun.evaluatedClinics,
            openIssuesCount: lastRun.openIssuesCount,
            resolvedIssuesCount: lastRun.resolvedIssuesCount,
            executionTimeMs: lastRun.executionTimeMs,
          }
        : null,
      disclaimer: QUALITY_DISCLAIMER,
    };
  }

  async getRuns(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [runs, total] = await Promise.all([
      this.prisma.dataQualityRun.findMany({
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.dataQualityRun.count(),
    ]);

    return {
      data: runs.map((r) => ({
        id: r.id.toString(),
        triggerType: r.triggerType,
        triggeredBy: r.triggeredBy?.toString() ?? null,
        evaluatedClinics: r.evaluatedClinics,
        openIssuesCount: r.openIssuesCount,
        resolvedIssuesCount: r.resolvedIssuesCount,
        executionTimeMs: r.executionTimeMs,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getIssues(filter: QueryIssuesDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    if (filter.status) {
      conditions.push(`dqi.status = '${filter.status}'`);
    }
    if (filter.severity) {
      conditions.push(`dqi.severity = '${filter.severity}'`);
    }
    if (filter.ruleCode) {
      conditions.push(`dqi.rule_code = '${filter.ruleCode}'`);
    }
    if (filter.clinicId) {
      conditions.push(`dqi.clinic_id = ${filter.clinicId}`);
    }
    if (filter.commune) {
      conditions.push(`LOWER(com.slug) = LOWER('${filter.commune}')`);
    }

    const whereClause = conditions.join(' AND ');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT dqi.id, dqi.clinic_id, dqi.run_id, dqi.rule_code, dqi.severity,
             dqi.status, dqi.cause_description, dqi.recommended_action, dqi.metadata,
             dqi.fingerprint, dqi.first_detected_at, dqi.last_evaluated_at,
             dqi.resolved_at, dqi.resolved_by, dqi.resolution_notes, dqi.resolution_reason,
             c.name AS clinic_name, c.slug AS clinic_slug,
             com.name AS commune_name, com.slug AS commune_slug
      FROM data_quality_issue dqi
      JOIN clinic c ON c.id = dqi.clinic_id
      LEFT JOIN clinic_location cl ON cl.clinic_id = c.id
      LEFT JOIN commune com ON com.id = cl.commune_id
      WHERE ${whereClause}
      ORDER BY 
        CASE dqi.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END,
        dqi.first_detected_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totals: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT count(*)::int AS total
      FROM data_quality_issue dqi
      JOIN clinic c ON c.id = dqi.clinic_id
      LEFT JOIN clinic_location cl ON cl.clinic_id = c.id
      LEFT JOIN commune com ON com.id = cl.commune_id
      WHERE ${whereClause}
    `);
    const total = totals[0]?.total ?? 0;

    return {
      data: rows.map((r) => ({
        id: r.id.toString(),
        clinicId: r.clinic_id.toString(),
        runId: r.run_id?.toString() ?? null,
        ruleCode: r.rule_code,
        severity: r.severity,
        status: r.status,
        causeDescription: r.cause_description,
        recommendedAction: r.recommended_action,
        metadata: r.metadata,
        fingerprint: r.fingerprint,
        firstDetectedAt: r.first_detected_at ? new Date(r.first_detected_at).toISOString() : null,
        lastEvaluatedAt: r.last_evaluated_at ? new Date(r.last_evaluated_at).toISOString() : null,
        resolvedAt: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
        resolvedBy: r.resolved_by?.toString() ?? null,
        resolutionNotes: r.resolution_notes,
        resolutionReason: r.resolution_reason,
        clinic: {
          id: r.clinic_id.toString(),
          name: r.clinic_name,
          slug: r.clinic_slug,
          communeName: r.commune_name,
          communeSlug: r.commune_slug,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClinicReliability(slug: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!clinic) {
      throw new NotFoundException(`Clínica con slug '${slug}' no encontrada.`);
    }

    let qualityScore = await this.prisma.clinicQualityScore.findUnique({
      where: { clinicId: clinic.id },
    });

    // Si aún no se ha evaluado esta clínica, calcular bajo demanda
    if (!qualityScore) {
      await this.runQualityEvaluation(DataQualityTrigger.MANUAL, null, clinic.id);
      qualityScore = await this.prisma.clinicQualityScore.findUnique({
        where: { clinicId: clinic.id },
      });
    }

    const score = qualityScore ? qualityScore.score : 0;
    let tier: 'ALTA' | 'MEDIA' | 'BAJA' | 'CRITICA' = 'CRITICA';
    if (score >= 80) tier = 'ALTA';
    else if (score >= 55) tier = 'MEDIA';
    else if (score >= 30) tier = 'BAJA';

    return {
      clinic: {
        id: clinic.id.toString(),
        name: clinic.name,
        slug: clinic.slug,
      },
      score,
      tier,
      completenessScore: qualityScore?.completenessScore ?? 0,
      verificationScore: qualityScore?.verificationScore ?? 0,
      freshnessScore: qualityScore?.freshnessScore ?? 0,
      activeIssuesCount: qualityScore?.activeIssuesCount ?? 0,
      breakdown: qualityScore?.factorBreakdown ?? {},
      updatedAt: qualityScore?.updatedAt ? qualityScore.updatedAt.toISOString() : null,
      disclaimer: QUALITY_DISCLAIMER,
    };
  }
}
