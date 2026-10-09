import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';
import { isValidChileanPhone } from './chilean-phone';

export class RuleInvalidPhone implements QualityRule {
  readonly code = 'RULE_INVALID_PHONE';
  readonly name = 'Teléfono con Formato Inválido';
  readonly defaultSeverity = 'CRITICAL' as const;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    if (ctx.clinic.phoneE164 && !isValidChileanPhone(ctx.clinic.phoneE164)) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `El teléfono principal "${ctx.clinic.phoneE164}" no cumple el formato E.164 chileno válido (+569XXXXXXXX o fijo regional).`,
        recommendedAction: 'Normalizar o corregir el teléfono a formato internacional estándar +56.',
        metadata: { phone: ctx.clinic.phoneE164, field: 'phoneE164' },
        targetEntityId: 'phoneE164',
      });
    }

    if (ctx.clinic.whatsappE164 && !isValidChileanPhone(ctx.clinic.whatsappE164)) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `El WhatsApp "${ctx.clinic.whatsappE164}" no cumple el formato E.164 chileno válido (+569XXXXXXXX).`,
        recommendedAction: 'Normalizar o corregir el WhatsApp a formato internacional estándar +56.',
        metadata: { phone: ctx.clinic.whatsappE164, field: 'whatsappE164' },
        targetEntityId: 'whatsappE164',
      });
    }

    return violations;
  }
}
