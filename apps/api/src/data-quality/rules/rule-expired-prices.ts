import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleExpiredPrices implements QualityRule {
  readonly code = 'RULE_EXPIRED_PRICES';
  readonly name = 'Aranceles y Precios Desactualizados';
  readonly defaultSeverity = 'HIGH' as const;

  // Umbral de vigencia máxima sin actualización ni confirmación: 365 días
  private readonly MAX_AGE_DAYS = 365;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    if (!ctx.prices || ctx.prices.length === 0) return violations;

    const now = new Date();
    const activePrices = ctx.prices.filter((p) => p.validUntil === null);

    for (const p of activePrices) {
      const referenceDate = p.verifiedAt ? new Date(p.verifiedAt) : new Date(p.validFrom);
      const diffMs = now.getTime() - referenceDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > this.MAX_AGE_DAYS) {
        violations.push({
          ruleCode: this.code,
          severity: this.defaultSeverity,
          causeDescription: `El precio activo (ID ${p.id}, tipo ${p.pricingType}) tiene ${diffDays} días de antigüedad sin confirmación (desde ${referenceDate.toISOString().slice(0, 10)}).`,
          recommendedAction: 'Contactar a la clínica para confirmar si el arancel se mantiene vigente o ingresar nuevo valor.',
          metadata: {
            priceId: p.id.toString(),
            clinicServiceId: p.clinicServiceId.toString(),
            pricingType: p.pricingType,
            daysOld: diffDays,
            referenceDate: referenceDate.toISOString().slice(0, 10),
          },
          targetEntityId: p.id.toString(),
        });
      }
    }

    return violations;
  }
}
