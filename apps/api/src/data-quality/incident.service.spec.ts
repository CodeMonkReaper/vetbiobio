import { DataQualityStatus } from '@prisma/client';
import { IncidentService } from './incident.service';
import { RuleViolation } from './rules';
import { ScoreBreakdown, QUALITY_DISCLAIMER } from './scoring.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockScoreBreakdown: ScoreBreakdown = {
    score: 80,
    completenessScore: 25,
    verificationScore: 30,
    freshnessScore: 25,
    penalties: 0,
    activeIssuesCount: 1,
    tier: 'ALTA',
    factors: {
      completeness: { points: 25, max: 30, detail: 'OK' },
      verification: { points: 30, max: 40, detail: 'OK' },
      freshness: { points: 25, max: 30, detail: 'OK' },
      penalties: { points: 0, detail: 'Ninguna' },
    },
    disclaimer: QUALITY_DISCLAIMER,
  };

  beforeEach(() => {
    mockPrisma = {
      dataQualityIssue: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      clinicQualityScore: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 1n }),
    };

    service = new IncidentService(mockPrisma, mockAudit);
  });

  describe('computeFingerprint', () => {
    it('genera un hash sha256 determinista para la misma clínica, regla y entidad', () => {
      const fp1 = service.computeFingerprint(10n, 'RULE_INVALID_PHONE', 'root');
      const fp2 = service.computeFingerprint(10n, 'RULE_INVALID_PHONE', 'root');
      const fp3 = service.computeFingerprint(10n, 'RULE_INVALID_PHONE', 'other');

      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(64);
      expect(fp1).not.toBe(fp3);
    });
  });

  describe('syncClinicQuality (Idempotencia y Auto-Healing)', () => {
    it('crea una nueva incidencia OPEN si no existía previamente', async () => {
      mockPrisma.dataQualityIssue.findFirst.mockResolvedValue(null);
      mockPrisma.dataQualityIssue.findMany.mockResolvedValue([]);
      mockPrisma.dataQualityIssue.create.mockResolvedValue({ id: 100n });
      mockPrisma.clinicQualityScore.upsert.mockResolvedValue({});

      const violations: RuleViolation[] = [
        {
          ruleCode: 'RULE_INVALID_PHONE',
          severity: 'CRITICAL',
          causeDescription: 'Teléfono erróneo',
          recommendedAction: 'Normalizar E.164',
        },
      ];

      const res = await service.syncClinicQuality(1n, 5n, violations, mockScoreBreakdown);

      expect(res.opened).toBe(1);
      expect(res.updated).toBe(0);
      expect(mockPrisma.dataQualityIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicId: 1n,
            runId: 5n,
            ruleCode: 'RULE_INVALID_PHONE',
            status: DataQualityStatus.OPEN,
          }),
        }),
      );
      expect(mockPrisma.clinicQualityScore.upsert).toHaveBeenCalled();
    });

    it('actualiza la incidencia existente sin duplicar en corrida posterior (Idempotencia)', async () => {
      const existingIssue = { id: 100n, status: DataQualityStatus.OPEN, runId: 1n };
      mockPrisma.dataQualityIssue.findFirst.mockResolvedValue(existingIssue);
      mockPrisma.dataQualityIssue.findMany.mockResolvedValue([existingIssue]);
      mockPrisma.dataQualityIssue.update.mockResolvedValue(existingIssue);
      mockPrisma.clinicQualityScore.upsert.mockResolvedValue({});

      const violations: RuleViolation[] = [
        {
          ruleCode: 'RULE_INVALID_PHONE',
          severity: 'CRITICAL',
          causeDescription: 'Teléfono erróneo persistente',
          recommendedAction: 'Normalizar E.164',
        },
      ];

      const res = await service.syncClinicQuality(1n, 6n, violations, mockScoreBreakdown);

      expect(res.opened).toBe(0);
      expect(res.updated).toBe(1);
      expect(mockPrisma.dataQualityIssue.create).not.toHaveBeenCalled();
      expect(mockPrisma.dataQualityIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 100n },
          data: expect.objectContaining({
            runId: 6n,
          }),
        }),
      );
    });

    it('marca automáticamente como RESOLVED una incidencia si el dato fue arreglado (Auto-Healing)', async () => {
      const healedFingerprint = 'some_fingerprint_no_longer_present';
      const oldIssue = {
        id: 200n,
        fingerprint: healedFingerprint,
        status: DataQualityStatus.OPEN,
      };

      mockPrisma.dataQualityIssue.findMany.mockResolvedValue([oldIssue]);
      mockPrisma.dataQualityIssue.update.mockResolvedValue({ ...oldIssue, status: DataQualityStatus.RESOLVED });
      mockPrisma.clinicQualityScore.upsert.mockResolvedValue({});

      // Corrida sin ninguna violación (el problema fue corregido)
      const res = await service.syncClinicQuality(1n, 7n, [], { ...mockScoreBreakdown, score: 100 });

      expect(res.opened).toBe(0);
      expect(res.autoResolved).toBe(1);
      expect(mockPrisma.dataQualityIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 200n },
          data: expect.objectContaining({
            status: DataQualityStatus.RESOLVED,
            resolutionReason: 'AUTO_RESOLVED',
          }),
        }),
      );
    });
  });

  describe('resolveIssue y dismissIssue manuales con auditoría', () => {
    it('resuelve manualmente una incidencia OPEN y registra traza en audit_log', async () => {
      mockPrisma.dataQualityIssue.findUnique.mockResolvedValue({
        id: 50n,
        clinicId: 1n,
        status: DataQualityStatus.OPEN,
      });
      mockPrisma.dataQualityIssue.update.mockResolvedValue({
        id: 50n,
        status: DataQualityStatus.RESOLVED,
      });

      await service.resolveIssue(50n, 99n, 'Corregido telefónicamente por secretaria');

      expect(mockPrisma.dataQualityIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 50n },
          data: expect.objectContaining({
            status: DataQualityStatus.RESOLVED,
            resolvedBy: 99n,
            resolutionReason: 'MANUAL_RESOLVED',
            resolutionNotes: 'Corregido telefónicamente por secretaria',
          }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'data_quality_issue',
          entityId: 50n,
        }),
      );
    });

    it('descarta manualmente una incidencia OPEN como excepción y registra traza', async () => {
      mockPrisma.dataQualityIssue.findUnique.mockResolvedValue({
        id: 60n,
        clinicId: 1n,
        status: DataQualityStatus.OPEN,
      });
      mockPrisma.dataQualityIssue.update.mockResolvedValue({
        id: 60n,
        status: DataQualityStatus.DISMISSED,
      });

      await service.dismissIssue(60n, 99n, 'Falso positivo tolerado por ser clínica móvil');

      expect(mockPrisma.dataQualityIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 60n },
          data: expect.objectContaining({
            status: DataQualityStatus.DISMISSED,
            resolvedBy: 99n,
            resolutionReason: 'MANUAL_DISMISSED',
            resolutionNotes: 'Falso positivo tolerado por ser clínica móvil',
          }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });
});
