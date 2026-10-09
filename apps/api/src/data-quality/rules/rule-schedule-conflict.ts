import { QualityRule, RuleEvaluationContext, RuleViolation } from './quality-rule.interface';

export class RuleScheduleConflict implements QualityRule {
  readonly code = 'RULE_SCHEDULE_CONFLICT';
  readonly name = 'Horarios Contradictorios o Inconsistentes';
  readonly defaultSeverity = 'HIGH' as const;

  evaluate(ctx: RuleEvaluationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    if (!ctx.schedules || ctx.schedules.length === 0) return violations;

    // Agrupar horarios por día de la semana
    const byDay = new Map<number, typeof ctx.schedules>();
    for (const s of ctx.schedules) {
      if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
      byDay.get(s.dayOfWeek)!.push(s);
    }

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    for (const [day, daySchedules] of byDay.entries()) {
      const activeRows = daySchedules.filter((s) => !s.isClosed);

      for (const row of activeRows) {
        if (!row.openingTime || !row.closingTime) {
          violations.push({
            ruleCode: this.code,
            severity: this.defaultSeverity,
            causeDescription: `El horario de ${dayNames[day]} está marcado como abierto pero carece de hora de apertura o cierre.`,
            recommendedAction: 'Establecer las horas de apertura y cierre o marcar el día como cerrado.',
            metadata: { dayOfWeek: day, scheduleId: row.id.toString() },
            targetEntityId: row.id.toString(),
          });
          continue;
        }

        const openStr = typeof row.openingTime === 'string' ? row.openingTime : (row.openingTime as Date).toISOString().slice(11, 16);
        const closeStr = typeof row.closingTime === 'string' ? row.closingTime : (row.closingTime as Date).toISOString().slice(11, 16);

        // Si apertura >= cierre y no es overnight
        if (openStr >= closeStr && !row.isOvernight) {
          violations.push({
            ruleCode: this.code,
            severity: this.defaultSeverity,
            causeDescription: `En ${dayNames[day]}, la hora de apertura (${openStr}) es posterior o igual al cierre (${closeStr}) sin marcar turno nocturno (isOvernight).`,
            recommendedAction: 'Corregir el rango horario o activar la casilla de atención nocturna/trasnoche.',
            metadata: { dayOfWeek: day, openingTime: openStr, closingTime: closeStr, scheduleId: row.id.toString() },
            targetEntityId: row.id.toString(),
          });
        }
      }

      // Si hay más de un bloque abierto en el mismo día, verificar traslapes
      if (activeRows.length > 1) {
        for (let i = 0; i < activeRows.length; i++) {
          for (let j = i + 1; j < activeRows.length; j++) {
            const a = activeRows[i];
            const b = activeRows[j];
            if (a.openingTime && a.closingTime && b.openingTime && b.closingTime && !a.isOvernight && !b.isOvernight) {
              const aOpen = typeof a.openingTime === 'string' ? a.openingTime : (a.openingTime as Date).toISOString().slice(11, 16);
              const aClose = typeof a.closingTime === 'string' ? a.closingTime : (a.closingTime as Date).toISOString().slice(11, 16);
              const bOpen = typeof b.openingTime === 'string' ? b.openingTime : (b.openingTime as Date).toISOString().slice(11, 16);
              const bClose = typeof b.closingTime === 'string' ? b.closingTime : (b.closingTime as Date).toISOString().slice(11, 16);

              // Comprobar solapamiento: max(aOpen, bOpen) < min(aClose, bClose)
              if (Math.max(aOpen.localeCompare(bOpen), 0) && aOpen < bClose && bOpen < aClose) {
                violations.push({
                  ruleCode: this.code,
                  severity: this.defaultSeverity,
                  causeDescription: `En ${dayNames[day]} existen dos bloques horarios que se solapan: [${aOpen}–${aClose}] y [${bOpen}–${bClose}].`,
                  recommendedAction: 'Separar los turnos (ej. mañana y tarde) sin solapamiento horario.',
                  metadata: { dayOfWeek: day, scheduleA: a.id.toString(), scheduleB: b.id.toString() },
                  targetEntityId: `${a.id}_${b.id}`,
                });
              }
            }
          }
        }
      }
    }

    return violations;
  }
}
