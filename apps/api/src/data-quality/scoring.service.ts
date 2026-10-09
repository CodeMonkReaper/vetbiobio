import { Injectable } from '@nestjs/common';
import { RuleEvaluationContext, RuleViolation } from './rules';

export const QUALITY_DISCLAIMER =
  'El Puntaje de Confiabilidad de VetBiobío refleja exclusivamente la frescura, integridad y corroboración documental de los datos de contacto y horarios publicados en la plataforma. No constituye una certificación sanitaria ni avala la calidad médica de los servicios veterinarios.';

export interface ScoreBreakdown {
  score: number;
  completenessScore: number;
  verificationScore: number;
  freshnessScore: number;
  penalties: number;
  activeIssuesCount: number;
  tier: 'ALTA' | 'MEDIA' | 'BAJA' | 'CRITICA';
  factors: {
    completeness: { points: number; max: number; detail: string };
    verification: { points: number; max: number; detail: string };
    freshness: { points: number; max: number; detail: string };
    penalties: { points: number; detail: string };
  };
  disclaimer: string;
}

@Injectable()
export class ScoringService {
  calculateScore(ctx: RuleEvaluationContext, violations: RuleViolation[]): ScoreBreakdown {
    // 1. Completitud (0 a 30 puntos)
    let completeness = 0;
    const completenessDetails: string[] = [];

    if (ctx.clinic.name && ctx.clinic.slug) {
      completeness += 6;
      completenessDetails.push('Ficha base registrada');
    }
    if (ctx.location && ctx.location.address) {
      completeness += 8;
      completenessDetails.push('Dirección física y ubicación');
    }
    if (ctx.clinic.phoneE164 || ctx.clinic.whatsappE164) {
      completeness += 6;
      completenessDetails.push('Canal telefónico');
    }
    if (ctx.schedules && ctx.schedules.length > 0) {
      completeness += 5;
      completenessDetails.push('Horarios configurados');
    }
    if (ctx.services && ctx.services.length >= 2) {
      completeness += 5;
      completenessDetails.push('Catálogo de servicios');
    }

    // 2. Verificación Humana (0 a 40 puntos)
    let verification = 0;
    let verificationDetail = 'Sin verificación humana previa';

    if (ctx.clinic.verificationStatus === 'VERIFIED') {
      verification += 25;
      verificationDetail = 'Ficha principal verificada';
      if (ctx.location && ctx.location.verificationStatus === 'VERIFIED') {
        verification += 15;
        verificationDetail += ' y ubicación contrastada';
      }
    } else if (ctx.clinic.verificationStatus === 'PENDING_REVIEW') {
      verification += 10;
      verificationDetail = 'En proceso de revisión telefónica';
    }

    // 3. Frescura y Actualización (0 a 30 puntos)
    let freshness = 0;
    let freshnessDetail = 'Sin actualizaciones recientes';
    const now = new Date();
    const referenceDate = ctx.clinic.verifiedAt
      ? new Date(ctx.clinic.verifiedAt)
      : new Date(ctx.clinic.updatedAt || ctx.clinic.createdAt);

    const diffDays = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 90) {
      freshness = 30;
      freshnessDetail = `Actualizado hace ${diffDays} días`;
    } else if (diffDays <= 180) {
      freshness = 20;
      freshnessDetail = `Actualizado hace ${diffDays} días (último semestre)`;
    } else if (diffDays <= 365) {
      freshness = 10;
      freshnessDetail = `Actualizado hace ${diffDays} días (último año)`;
    } else {
      freshness = 0;
      freshnessDetail = 'Más de 365 días sin actualización registrada';
    }

    // 4. Penalización por infracciones activas
    let penalties = 0;
    const penaltyDetails: string[] = [];

    for (const v of violations) {
      if (v.severity === 'CRITICAL') {
        penalties += 25;
        penaltyDetails.push(`${v.ruleCode} (-25)`);
      } else if (v.severity === 'HIGH') {
        penalties += 10;
        penaltyDetails.push(`${v.ruleCode} (-10)`);
      }
    }

    const rawScore = completeness + verification + freshness - penalties;
    const finalScore = Math.max(0, Math.min(100, rawScore));

    let tier: 'ALTA' | 'MEDIA' | 'BAJA' | 'CRITICA' = 'CRITICA';
    if (finalScore >= 80) tier = 'ALTA';
    else if (finalScore >= 55) tier = 'MEDIA';
    else if (finalScore >= 30) tier = 'BAJA';

    return {
      score: finalScore,
      completenessScore: completeness,
      verificationScore: verification,
      freshnessScore: freshness,
      penalties,
      activeIssuesCount: violations.length,
      tier,
      factors: {
        completeness: {
          points: completeness,
          max: 30,
          detail: completenessDetails.join(', ') || 'Datos incompletos',
        },
        verification: {
          points: verification,
          max: 40,
          detail: verificationDetail,
        },
        freshness: {
          points: freshness,
          max: 30,
          detail: freshnessDetail,
        },
        penalties: {
          points: penalties,
          detail: penaltyDetails.join(', ') || 'Sin penalizaciones',
        },
      },
      disclaimer: QUALITY_DISCLAIMER,
    };
  }
}
