import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleDuplicatePhone implements QualityRule {
  readonly code = 'RULE_DUPLICATE_PHONE';
  readonly name = 'Teléfono Duplicado en Otra Clínica';
  readonly defaultSeverity = 'HIGH' as const;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    if (!ctx.clinic.phoneE164) return violations;

    const currentPhone = ctx.clinic.phoneE164.trim();
    const matches = ctx.allClinicsPhones.filter(
      (item) => item.clinicId !== ctx.clinic.id && item.phoneE164.trim() === currentPhone,
    );

    if (matches.length > 0) {
      const otherNames = matches.map((m) => `"${m.clinicName}" (ID ${m.clinicId})`).join(', ');
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `El teléfono "${currentPhone}" está duplicado y también asignado a: ${otherNames}.`,
        recommendedAction: 'Verificar si corresponde a una misma cadena/sucursal o corregir número de contacto.',
        metadata: {
          phone: currentPhone,
          matchedClinics: matches.map((m) => ({ id: m.clinicId.toString(), name: m.clinicName })),
        },
        targetEntityId: currentPhone,
      });
    }

    return violations;
  }
}
