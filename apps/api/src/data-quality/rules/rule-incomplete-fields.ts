import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleIncompleteFields implements QualityRule {
  readonly code = 'RULE_INCOMPLETE_FIELDS';
  readonly name = 'Campos Obligatorios Incompletos';
  readonly defaultSeverity = 'MEDIUM' as const;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const missing: string[] = [];

    if (!ctx.location || !ctx.location.address || ctx.location.address.trim().length === 0) {
      missing.push('dirección física');
    }

    if (!ctx.clinic.phoneE164 && !ctx.clinic.whatsappE164) {
      missing.push('teléfono de contacto');
    }

    if (!ctx.schedules || ctx.schedules.length === 0) {
      missing.push('horarios de atención');
    }

    if (!ctx.services || ctx.services.length === 0) {
      missing.push('catálogo de servicios/exámenes');
    }

    if (missing.length > 0) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `La ficha clínica carece de información esencial obligatoria: ${missing.join(', ')}.`,
        recommendedAction: 'Completar los datos faltantes para que la ficha sea publicable con alta calidad.',
        metadata: { missingFields: missing },
        targetEntityId: 'profile',
      });
    }

    return violations;
  }
}
