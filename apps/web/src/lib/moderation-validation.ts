export interface ValidationIssue {
  field?: string;
  message: string;
  isBlocking: boolean;
}

export function validateSubmissionForApproval(
  type: string,
  payload: Record<string, unknown>,
  hasAssociatedClinic: boolean
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  switch (type) {
    case 'NEW_CLINIC': {
      const name = payload.name || payload.nombre;
      if (!name || String(name).trim().length === 0) {
        issues.push({
          field: 'name',
          message: 'El nombre de la clínica es obligatorio para darla de alta.',
          isBlocking: true,
        });
      }

      const cut = payload.communeCut || payload.cut;
      if (!cut) {
        issues.push({
          field: 'communeCut',
          message: 'No se especificó código CUT de comuna (se asignará 08101 Concepción por defecto si se aprueba).',
          isBlocking: false,
        });
      }

      const phone = payload.phone || payload.telefono;
      const email = payload.email;
      const address = payload.address;
      if (!phone && !email && !address) {
        issues.push({
          message: 'Se recomienda incluir al menos un teléfono, email o dirección física.',
          isBlocking: false,
        });
      }
      break;
    }

    case 'UPDATE_PRICE':
    case 'PRICE': {
      if (!hasAssociatedClinic) {
        issues.push({
          message: 'Este aporte de arancel no tiene una clínica asociada en la base de datos.',
          isBlocking: true,
        });
      }

      const serviceSlug = payload.serviceSlug || payload.service;
      if (!serviceSlug || String(serviceSlug).trim().length === 0) {
        issues.push({
          field: 'serviceSlug',
          message: 'Se requiere el slug del servicio (ej: consulta-general, vacunacion-antirrabica).',
          isBlocking: true,
        });
      }

      const pricingType = payload.pricingType || 'FIXED';
      const minAmount = payload.minAmount != null ? Number(payload.minAmount) : (payload.amount != null ? Number(payload.amount) : null);
      const maxAmount = payload.maxAmount != null ? Number(payload.maxAmount) : null;

      if (pricingType === 'FIXED') {
        if (minAmount === null || isNaN(minAmount) || minAmount <= 0) {
          issues.push({
            field: 'minAmount',
            message: 'Para tarifa fija (FIXED), el monto debe ser un número mayor a 0.',
            isBlocking: true,
          });
        }
      } else if (pricingType === 'RANGE') {
        if (minAmount === null || maxAmount === null || isNaN(minAmount) || isNaN(maxAmount) || minAmount <= 0) {
          issues.push({
            field: 'minAmount',
            message: 'Para rango (RANGE), tanto el mínimo como el máximo deben ser números mayores a 0.',
            isBlocking: true,
          });
        } else if (maxAmount < minAmount) {
          issues.push({
            field: 'maxAmount',
            message: 'El monto máximo no puede ser menor al monto mínimo.',
            isBlocking: true,
          });
        }
      } else if (pricingType === 'FROM') {
        if (minAmount === null || isNaN(minAmount) || minAmount <= 0) {
          issues.push({
            field: 'minAmount',
            message: 'Para tarifa base (FROM), el monto mínimo debe ser mayor a 0.',
            isBlocking: true,
          });
        }
      }
      break;
    }

    case 'UPDATE_CLINIC':
    case 'CLINIC_UPDATE': {
      if (!hasAssociatedClinic) {
        issues.push({
          message: 'Este aporte no tiene una clínica asociada a la cual aplicar las modificaciones.',
          isBlocking: true,
        });
      }
      if (Object.keys(payload).length === 0) {
        issues.push({
          message: 'El payload está vacío, no hay campos que actualizar.',
          isBlocking: true,
        });
      }
      break;
    }

    case 'REPORT_CLOSURE': {
      if (!hasAssociatedClinic) {
        issues.push({
          message: 'No hay clínica asociada para marcar como cerrada.',
          isBlocking: true,
        });
      }
      break;
    }

    default:
      break;
  }

  return issues;
}
