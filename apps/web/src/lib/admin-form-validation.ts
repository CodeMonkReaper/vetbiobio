/**
 * Reglas de validación previa del lado del cliente para formularios
 * administrativos de Precios (aranceles) y Horarios de atención.
 */

export interface PriceFormState {
  id: string;
  min: string;
  max: string;
  type: string;
}

export interface ScheduleFormState {
  open: string;
  close: string;
  closed: boolean;
  is24h: boolean;
}

/**
 * Valida consistencia de aranceles antes de invocar el backend.
 * Previene montos negativos, montos nulos en FIXED/FROM/RANGE, y rangos invertidos.
 */
export function validatePriceForm(form: PriceFormState): string | null {
  if (!form.id) {
    return 'Debes seleccionar una prestación o examen.';
  }

  const minVal = form.min !== '' ? Number(form.min) : null;
  const maxVal = form.max !== '' ? Number(form.max) : null;

  if (form.type === 'FIXED') {
    if (minVal === null || isNaN(minVal) || minVal <= 0) {
      return 'Para tarifa fija (FIXED), el monto debe ser un número positivo mayor a 0.';
    }
  } else if (form.type === 'RANGE') {
    if (minVal === null || isNaN(minVal) || minVal <= 0) {
      return 'Para rango (RANGE), el monto mínimo debe ser mayor a 0.';
    }
    if (maxVal === null || isNaN(maxVal) || maxVal <= 0) {
      return 'Para rango (RANGE), el monto máximo debe ser mayor a 0.';
    }
    if (maxVal < minVal) {
      return 'El arancel máximo no puede ser menor al arancel mínimo.';
    }
  } else if (form.type === 'FROM') {
    if (minVal === null || isNaN(minVal) || minVal <= 0) {
      return 'Para modalidad base (FROM), el monto mínimo debe ser mayor a 0.';
    }
  }

  return null;
}

/**
 * Valida consistencia de intervalos de horarios antes de invocar el backend.
 * Previene cierres anteriores o iguales a la apertura y formatos no conformes (HH:mm).
 */
export function validateScheduleForm(form: ScheduleFormState): string | null {
  if (form.closed || form.is24h) {
    return null;
  }

  if (!form.open || !form.close) {
    return 'Debes ingresar tanto la hora de apertura como la hora de cierre.';
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(form.open) || !timeRegex.test(form.close)) {
    return 'El formato de hora debe ser válido (HH:mm).';
  }

  if (form.close <= form.open) {
    return `La hora de cierre (${form.close}) debe ser posterior a la hora de apertura (${form.open}). Si la atención cruza la medianoche o es continua, activa la opción "Urgencia 24 Horas".`;
  }

  return null;
}
