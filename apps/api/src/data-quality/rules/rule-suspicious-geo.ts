import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleSuspiciousGeo implements QualityRule {
  readonly code = 'RULE_SUSPICIOUS_GEO';
  readonly name = 'Coordenadas Sospechosas o Fuera de Región';
  readonly defaultSeverity = 'CRITICAL' as const;

  // Bounding Box oficial ampliado de la Región del Biobío (Chile)
  private readonly MIN_LAT = -38.5;
  private readonly MAX_LAT = -36.0;
  private readonly MIN_LNG = -74.5;
  private readonly MAX_LNG = -71.0;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    if (!ctx.location) return violations;

    const lat = ctx.location.latitude;
    const lng = ctx.location.longitude;

    // Coordenadas nulas o por defecto (0,0)
    if (lat === 0 && lng === 0) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: 'Las coordenadas geográficas son (0, 0) (punto nulo en el océano Atlántico).',
        recommendedAction: 'Geocodificar la dirección real de la clínica para asignar latitud y longitud válidas.',
        metadata: { lat, lng },
        targetEntityId: 'location',
      });
      return violations;
    }

    // Coordenadas fuera de la Región del Biobío
    if (lat < this.MIN_LAT || lat > this.MAX_LAT || lng < this.MIN_LNG || lng > this.MAX_LNG) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `Las coordenadas (${lat}, ${lng}) se encuentran fuera de los límites de la Región del Biobío.`,
        recommendedAction: 'Re-geocodificar la dirección de la clínica dentro de la comuna correspondiente.',
        metadata: { lat, lng, bbox: { minLat: this.MIN_LAT, maxLat: this.MAX_LAT, minLng: this.MIN_LNG, maxLng: this.MAX_LNG } },
        targetEntityId: 'location',
      });
      return violations;
    }

    // Detección aproximada de mar abierto en la costa del Biobío
    // La costa de Concepción/Arauco se sitúa al este de -73.20 (excepto Isla Mocha en lat ~ -38.35, lng ~ -73.9)
    const isIslaMocha = lat <= -38.2 && lat >= -38.5 && lng <= -73.8 && lng >= -74.1;
    if (!isIslaMocha && lng < -73.30) {
      violations.push({
        ruleCode: this.code,
        severity: this.defaultSeverity,
        causeDescription: `Las coordenadas (${lat}, ${lng}) se sitúan en zona marítima mar adentro en el Océano Pacífico.`,
        recommendedAction: 'Revisar la dirección física y reposicionar el marcador en tierra firme.',
        metadata: { lat, lng, inOcean: true },
        targetEntityId: 'location',
      });
    }

    return violations;
  }
}
