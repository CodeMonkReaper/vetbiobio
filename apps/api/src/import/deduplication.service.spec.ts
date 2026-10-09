import { DeduplicationService } from './deduplication.service';
import { ParsedImportRow } from './import-parser.service';
import { ImportRowStatus, ImportActionType } from '@prisma/client';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: jest.fn(),
    };
    service = new DeduplicationService(mockPrisma);
  });

  const createParsedRow = (overrides: Partial<ParsedImportRow> = {}): ParsedImportRow => ({
    rowNumber: 1,
    name: 'Clínica Veterinaria Central',
    address: 'Av. Los Carrera 500',
    communeCut: '08101',
    phoneE164: '+56912345678',
    whatsappE164: '+56912345678',
    email: 'contacto@vetcentral.cl',
    website: 'https://vetcentral.cl',
    latitude: -36.82,
    longitude: -73.05,
    isEmergency: false,
    is24h: false,
    description: null,
    isValid: true,
    validationErrors: [],
    ...overrides,
  });

  it('clasifica como POSSIBLE_DUPLICATE si coincide el teléfono E.164 exactamente', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([
        {
          id: 10n,
          name: 'Veterinaria Central',
          phone_e164: '+56912345678',
          address: 'Los Carrera 500',
          email: 'contacto@vetcentral.cl',
          website: 'https://vetcentral.cl',
        },
      ]) // Phone query
      .mockResolvedValueOnce([]) // Trigram query
      .mockResolvedValueOnce([]); // Geo query

    const row = createParsedRow();
    const result = await service.evaluateRow(row);

    expect(result.status).toBe(ImportRowStatus.POSSIBLE_DUPLICATE);
    expect(result.matchedClinicId).toBe(10n);
    expect(result.matchReason).toBe('PHONE_EXACT');
    expect(result.matchScore).toBeGreaterThanOrEqual(0.5);
    expect(result.suggestedAction).toBe(ImportActionType.UPDATE);
    expect(result.differences.name).toBeDefined();
  });

  it('clasifica como VALID (INSERT) si no hay colisiones en ninguna dimensión', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // Phone query
      .mockResolvedValueOnce([]) // Trigram query
      .mockResolvedValueOnce([]); // Geo query

    const row = createParsedRow({ name: 'Clínica Nueva Santa Juana' });
    const result = await service.evaluateRow(row);

    expect(result.status).toBe(ImportRowStatus.VALID);
    expect(result.matchedClinicId).toBeNull();
    expect(result.suggestedAction).toBe(ImportActionType.INSERT);
    expect(Object.keys(result.differences).length).toBe(0);
  });

  it('clasifica como INVALID y SKIP si la fila no es válida sintácticamente', async () => {
    const row = createParsedRow({ isValid: false, validationErrors: ['Error sintáctico'] });
    const result = await service.evaluateRow(row);

    expect(result.status).toBe(ImportRowStatus.INVALID);
    expect(result.suggestedAction).toBe(ImportActionType.SKIP);
    expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
