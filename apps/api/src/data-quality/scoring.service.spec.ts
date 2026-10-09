import { ScoringService, QUALITY_DISCLAIMER } from './scoring.service';
import { RuleEvaluationContext, RuleViolation } from './rules';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  const createBaseContext = (overrides: Partial<RuleEvaluationContext> = {}): RuleEvaluationContext => {
    return {
      clinic: {
        id: 1n,
        name: 'Clínica Veterinaria Los Ángeles',
        slug: 'clinica-veterinaria-los-angeles',
        phoneE164: '+56912345678',
        whatsappE164: '+56912345678',
        email: 'contacto@losangelesvet.cl',
        website: 'https://losangelesvet.cl',
        description: 'Atención 24h para mascotas',
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        nextReviewAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      location: {
        clinicId: 1n,
        address: 'Av. Alemania 450',
        communeId: 1n,
        latitude: -37.47,
        longitude: -72.35,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        nextReviewAt: null,
      },
      schedules: [
        {
          id: 1n,
          clinicId: 1n,
          dayOfWeek: 1,
          openingTime: '09:00:00',
          closingTime: '19:00:00',
          isClosed: false,
          isOvernight: false,
          validFrom: null,
          validUntil: null,
        },
      ],
      services: [
        { id: 1n, clinicId: 1n, serviceId: 1n, isAvailable: true, serviceName: 'Consulta' },
        { id: 2n, clinicId: 1n, serviceId: 2n, isAvailable: true, serviceName: 'Vacunación' },
      ],
      prices: [],
      allClinicsPhones: [],
      ...overrides,
    };
  };

  it('calcula puntaje máximo (100) para una clínica completa, verificada y actualizada sin anomalías', () => {
    const ctx = createBaseContext();
    const result = service.calculateScore(ctx, []);

    expect(result.score).toBe(100);
    expect(result.completenessScore).toBe(30);
    expect(result.verificationScore).toBe(40);
    expect(result.freshnessScore).toBe(30);
    expect(result.penalties).toBe(0);
    expect(result.tier).toBe('ALTA');
    expect(result.disclaimer).toBe(QUALITY_DISCLAIMER);
  });

  it('aplica penalizaciones por incidencias críticas (-25) y altas (-10)', () => {
    const ctx = createBaseContext();
    const violations: RuleViolation[] = [
      {
        ruleCode: 'RULE_INVALID_PHONE',
        severity: 'CRITICAL',
        causeDescription: 'Teléfono malformado',
        recommendedAction: 'Corregir',
      },
      {
        ruleCode: 'RULE_EXPIRED_PRICES',
        severity: 'HIGH',
        causeDescription: 'Precios vencidos',
        recommendedAction: 'Actualizar',
      },
    ];

    const result = service.calculateScore(ctx, violations);

    // 100 base - 25 - 10 = 65
    expect(result.penalties).toBe(35);
    expect(result.score).toBe(65);
    expect(result.tier).toBe('MEDIA');
    expect(result.activeIssuesCount).toBe(2);
  });

  it('nunca retorna un puntaje menor a 0 a pesar de múltiples penalizaciones severas', () => {
    const ctx = createBaseContext({
      clinic: {
        id: 2n,
        name: '',
        slug: '',
        phoneE164: null,
        whatsappE164: null,
        email: null,
        website: null,
        description: null,
        status: 'DRAFT',
        verificationStatus: 'UNVERIFIED',
        verifiedAt: null,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      },
      location: null,
      schedules: [],
      services: [],
    });

    const violations: RuleViolation[] = [
      { ruleCode: 'R1', severity: 'CRITICAL', causeDescription: '', recommendedAction: '' },
      { ruleCode: 'R2', severity: 'CRITICAL', causeDescription: '', recommendedAction: '' },
      { ruleCode: 'R3', severity: 'CRITICAL', causeDescription: '', recommendedAction: '' },
      { ruleCode: 'R4', severity: 'CRITICAL', causeDescription: '', recommendedAction: '' },
    ];

    const result = service.calculateScore(ctx, violations);
    expect(result.score).toBe(0);
    expect(result.tier).toBe('CRITICA');
  });

  it('incluye el disclaimer explícito de no certificación médica en el resultado', () => {
    const ctx = createBaseContext();
    const result = service.calculateScore(ctx, []);
    expect(result.disclaimer).toContain('No constituye una certificación sanitaria ni avala la calidad médica');
  });
});
