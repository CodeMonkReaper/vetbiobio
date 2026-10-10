import { describe, expect, it } from 'vitest';
import {
  validatePriceForm,
  validateScheduleForm,
} from './admin-form-validation';

describe('validatePriceForm (Client Pre-validation)', () => {
  it('falla si no hay ítem seleccionado', () => {
    const error = validatePriceForm({ id: '', min: '25000', max: '', type: 'FIXED' });
    expect(error).toContain('Debes seleccionar una prestación o examen');
  });

  it('valida tarifa FIXED válida', () => {
    const error = validatePriceForm({ id: '1', min: '25000', max: '', type: 'FIXED' });
    expect(error).toBeNull();
  });

  it('falla en tarifa FIXED si monto es 0 o negativo', () => {
    expect(validatePriceForm({ id: '1', min: '0', max: '', type: 'FIXED' })).toContain('número positivo mayor a 0');
    expect(validatePriceForm({ id: '1', min: '-500', max: '', type: 'FIXED' })).toContain('número positivo mayor a 0');
    expect(validatePriceForm({ id: '1', min: '', max: '', type: 'FIXED' })).toContain('número positivo mayor a 0');
  });

  it('valida rango RANGE válido', () => {
    const error = validatePriceForm({ id: '1', min: '20000', max: '35000', type: 'RANGE' });
    expect(error).toBeNull();
  });

  it('falla en rango RANGE si max < min (discrepancia de rango)', () => {
    const error = validatePriceForm({ id: '1', min: '50000', max: '30000', type: 'RANGE' });
    expect(error).toContain('El arancel máximo no puede ser menor al arancel mínimo');
  });

  it('valida tarifa FROM válida', () => {
    const error = validatePriceForm({ id: '1', min: '15000', max: '', type: 'FROM' });
    expect(error).toBeNull();
  });

  it('falla en tarifa FROM si falta min', () => {
    const error = validatePriceForm({ id: '1', min: '', max: '', type: 'FROM' });
    expect(error).toContain('Para modalidad base (FROM), el monto mínimo debe ser mayor a 0');
  });

  it('permite tarifa CONTACT sin montos requeridos', () => {
    const error = validatePriceForm({ id: '1', min: '', max: '', type: 'CONTACT' });
    expect(error).toBeNull();
  });
});

describe('validateScheduleForm (Client Interval Pre-validation)', () => {
  it('permite turnos cerrados sin validar horas', () => {
    const error = validateScheduleForm({
      open: '19:00',
      close: '09:00',
      closed: true,
      is24h: false,
    });
    expect(error).toBeNull();
  });

  it('permite turnos 24 horas continuas sin validar horas', () => {
    const error = validateScheduleForm({
      open: '00:00',
      close: '23:59',
      closed: false,
      is24h: true,
    });
    expect(error).toBeNull();
  });

  it('valida turno diurno normal', () => {
    const error = validateScheduleForm({
      open: '08:30',
      close: '18:00',
      closed: false,
      is24h: false,
    });
    expect(error).toBeNull();
  });

  it('falla si hora de cierre es anterior a apertura (discrepancia de intervalo)', () => {
    const error = validateScheduleForm({
      open: '19:00',
      close: '09:00',
      closed: false,
      is24h: false,
    });
    expect(error).toContain('La hora de cierre (09:00) debe ser posterior a la hora de apertura (19:00)');
    expect(error).toContain('Urgencia 24 Horas');
  });

  it('falla si hora de cierre es igual a apertura', () => {
    const error = validateScheduleForm({
      open: '10:00',
      close: '10:00',
      closed: false,
      is24h: false,
    });
    expect(error).toContain('La hora de cierre (10:00) debe ser posterior a la hora de apertura (10:00)');
  });

  it('falla con horas en formato inválido', () => {
    const error = validateScheduleForm({
      open: '25:99',
      close: '18:00',
      closed: false,
      is24h: false,
    });
    expect(error).toContain('El formato de hora debe ser válido (HH:mm)');
  });
});
