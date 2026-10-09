import {
  RuleInvalidPhone,
  RuleDuplicatePhone,
  RuleSuspiciousGeo,
  RuleScheduleConflict,
  RuleExpiredPrices,
  RuleOutdatedVerification,
  RuleIncompleteFields,
  isValidChileanPhone,
  normalizeChileanPhone,
  RuleEvaluationContext,
} from './index';

function createMockContext(overrides?: Partial<RuleEvaluationContext>): RuleEvaluationContext {
  return {
    clinic: {
      id: 1n,
      name: 'Clínica Veterinaria Central',
      slug: 'clinica-veterinaria-central',
      phoneE164: '+56912345678',
      whatsappE164: '+56987654321',
      email: 'contacto@vet.cl',
      website: 'https://vet.cl',
      description: 'Clínica de atención general',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      nextReviewAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    location: {
      clinicId: 1n,
      address: 'Barros Arana 500, Concepción',
      communeId: 10n,
      latitude: -36.827,
      longitude: -73.05,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      nextReviewAt: null,
    },
    schedules: [
      {
        id: 101n,
        clinicId: 1n,
        dayOfWeek: 1, // Lunes
        openingTime: '09:00:00',
        closingTime: '19:00:00',
        isClosed: false,
        isOvernight: false,
        validFrom: null,
        validUntil: null,
      },
    ],
    services: [
      { id: 1n, clinicId: 1n, serviceId: 10n, isAvailable: true },
      { id: 2n, clinicId: 1n, serviceId: 11n, isAvailable: true },
    ],
    prices: [
      {
        id: 201n,
        clinicServiceId: 1n,
        minAmount: 15000,
        maxAmount: 15000,
        pricingType: 'FIXED',
        validFrom: new Date(),
        validUntil: null,
        verifiedAt: new Date(),
      },
    ],
    allClinicsPhones: [],
    ...overrides,
  };
}

describe('Motor de Calidad de Datos — Reglas Unitarias', () => {
  describe('Helper de Telefonía Chilena', () => {
    it('valida móviles (+569XXXXXXXX) y fijos de Biobío (+5641XXXXXXX)', () => {
      expect(isValidChileanPhone('+56912345678')).toBe(true);
      expect(isValidChileanPhone('+56412123456')).toBe(true);
      expect(isValidChileanPhone('+56432123456')).toBe(true); // Los Ángeles
      expect(isValidChileanPhone('123456')).toBe(false);
      expect(isValidChileanPhone('+15551234567')).toBe(false);
      expect(isValidChileanPhone('+5691234')).toBe(false); // muy corto
    });

    it('normaliza números locales a E.164 canónico', () => {
      expect(normalizeChileanPhone('912345678')).toBe('+56912345678');
      expect(normalizeChileanPhone('412123456')).toBe('+56412123456');
      expect(normalizeChileanPhone('+56 9 1234 5678')).toBe('+56912345678');
    });
  });

  describe('RULE_INVALID_PHONE', () => {
    const rule = new RuleInvalidPhone();

    it('no detecta infracción con teléfono chileno válido', () => {
      const ctx = createMockContext();
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(0);
    });

    it('detecta infracción crítica si el teléfono es malformado o no chileno', () => {
      const ctx = createMockContext({
        clinic: {
          ...createMockContext().clinic,
          phoneE164: '123456',
        },
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.ruleCode).toBe('RULE_INVALID_PHONE');
      expect(violations[0]!.severity).toBe('CRITICAL');
    });
  });

  describe('RULE_DUPLICATE_PHONE', () => {
    const rule = new RuleDuplicatePhone();

    it('detecta colisión si otra clínica comparte el mismo teléfono', () => {
      const ctx = createMockContext({
        allClinicsPhones: [
          { clinicId: 2n, phoneE164: '+56912345678', clinicName: 'Clínica San Pedro' },
        ],
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.ruleCode).toBe('RULE_DUPLICATE_PHONE');
      expect(violations[0]!.causeDescription).toContain('Clínica San Pedro');
    });

    it('no reporta colisión con su propio registro', () => {
      const ctx = createMockContext({
        allClinicsPhones: [
          { clinicId: 1n, phoneE164: '+56912345678', clinicName: 'Clínica Veterinaria Central' },
        ],
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(0);
    });
  });

  describe('RULE_SUSPICIOUS_GEO', () => {
    const rule = new RuleSuspiciousGeo();

    it('valida coordenadas correctas de Concepción', () => {
      const ctx = createMockContext();
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(0);
    });

    it('detecta punto nulo (0,0)', () => {
      const ctx = createMockContext({
        location: { ...createMockContext().location!, latitude: 0, longitude: 0 },
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.causeDescription).toContain('(0, 0)');
    });

    it('detecta coordenadas fuera de la Región del Biobío (ej. Santiago)', () => {
      const ctx = createMockContext({
        location: { ...createMockContext().location!, latitude: -33.45, longitude: -70.66 },
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.causeDescription).toContain('fuera de los límites');
    });

    it('detecta coordenadas en mar abierto', () => {
      const ctx = createMockContext({
        location: { ...createMockContext().location!, latitude: -36.8, longitude: -73.6 },
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.causeDescription).toContain('zona marítima');
    });
  });

  describe('RULE_SCHEDULE_CONFLICT', () => {
    const rule = new RuleScheduleConflict();

    it('detecta apertura posterior al cierre sin flag isOvernight', () => {
      const ctx = createMockContext({
        schedules: [
          {
            id: 101n,
            clinicId: 1n,
            dayOfWeek: 1,
            openingTime: '19:00:00',
            closingTime: '08:00:00',
            isClosed: false,
            isOvernight: false, // Inconsistente
            validFrom: null,
            validUntil: null,
          },
        ],
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.causeDescription).toContain('posterior o igual al cierre');
    });

    it('no alerta si el turno es overnight legítimo', () => {
      const ctx = createMockContext({
        schedules: [
          {
            id: 101n,
            clinicId: 1n,
            dayOfWeek: 1,
            openingTime: '19:00:00',
            closingTime: '08:00:00',
            isClosed: false,
            isOvernight: true,
            validFrom: null,
            validUntil: null,
          },
        ],
      });
      expect(rule.evaluate(ctx).length).toBe(0);
    });
  });

  describe('RULE_EXPIRED_PRICES', () => {
    const rule = new RuleExpiredPrices();

    it('detecta precio activo con más de 365 días sin confirmación', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400);

      const ctx = createMockContext({
        prices: [
          {
            id: 201n,
            clinicServiceId: 1n,
            minAmount: 12000,
            maxAmount: 12000,
            pricingType: 'FIXED',
            validFrom: oldDate,
            validUntil: null,
            verifiedAt: oldDate,
          },
        ],
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.causeDescription).toContain('días de antigüedad');
    });
  });

  describe('RULE_OUTDATED_VERIFICATION', () => {
    const rule = new RuleOutdatedVerification();

    it('detecta cuando nextReviewAt está en el pasado para clínica VERIFIED', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const ctx = createMockContext({
        clinic: {
          ...createMockContext().clinic,
          verificationStatus: 'VERIFIED',
          nextReviewAt: pastDate,
        },
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.ruleCode).toBe('RULE_OUTDATED_VERIFICATION');
    });
  });

  describe('RULE_INCOMPLETE_FIELDS', () => {
    const rule = new RuleIncompleteFields();

    it('detecta ficha sin horarios ni servicios', () => {
      const ctx = createMockContext({
        schedules: [],
        services: [],
      });
      const violations = rule.evaluate(ctx);
      expect(violations.length).toBe(1);
      expect(violations[0]!.ruleCode).toBe('RULE_INCOMPLETE_FIELDS');
      expect(violations[0]!.metadata?.missingFields).toContain('horarios de atención');
      expect(violations[0]!.metadata?.missingFields).toContain('catálogo de servicios/exámenes');
    });
  });
});
