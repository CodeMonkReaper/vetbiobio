import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleOutdatedVerification implements QualityRule {
  readonly code = 'RULE_OUTDATED_VERIFICATION';
  readonly name = 'Verificación Caducada o Vencida';
  readonly defaultSeverity = 'HIGH' as const;

  // Umbral máximo de días que una ficha VERIFIED puede permanecer sin revalidación
  private readonly MAX_VERIFICATION_DAYS = 180;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    if (ctx.clinic.verificationStatus !== 'VERIFIED') return violations;

    const now = new Date();

    // 1. Revisión programada superada (nextReviewAt < now)
    if (ctx.clinic.nextReviewAt) {
      const nextReview = new Date(ctx.clinic.nextReviewAt);
      if (nextReview < now) {
        violations.push({
          ruleCode: this.code,
          severity: this.defaultSeverity,
          causeDescription: `La verificación oficial de la clínica venció el ${nextReview.toISOString().slice(0, 10)} según su fecha programada de revisión.`,
          recommendedAction: 'Programar llamada de reverificación telefónica o revisión de fuentes oficiales.',
          metadata: { nextReviewAt: nextReview.toISOString().slice(0, 10) },
          targetEntityId: 'verification',
        });
        return violations;
      }
    }

    // 2. Ficha verificada hace más de 180 días
    if (ctx.clinic.verifiedAt) {
      const verifiedDate = new Date(ctx.clinic.verifiedAt);
      const diffDays = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > this.MAX_VERIFICATION_DAYS) {
        violations.push({
          ruleCode: this.code,
          severity: this.defaultSeverity,
          causeDescription: `La verificación de la clínica tiene ${diffDays} días de antigüedad (supera el límite de ${this.MAX_VERIFICATION_DAYS} días).`,
          recommendedAction: 'Revalidar los datos de contacto y horarios con la clínica.',
          metadata: { verifiedAt: verifiedDate.toISOString().slice(0, 10), daysSinceVerification: diffDays },
          targetEntityId: 'verification',
        });
      }
    }

    return violations;
  }
}
