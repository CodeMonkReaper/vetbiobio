import { DataQualityStatus } from '@prisma/client';
import {
  AdminDataQualityController,
  ClinicReliabilityController,
} from './data-quality.controller';

describe('DataQualityControllers', () => {
  let adminController: AdminDataQualityController;
  let publicController: ClinicReliabilityController;
  let mockDataQualityService: any;
  let mockIncidentService: any;

  beforeEach(() => {
    mockDataQualityService = {
      runQualityEvaluation: jest.fn().mockResolvedValue({
        runId: '1',
        evaluatedClinics: 16,
        openIssues: 5,
        resolvedIssues: 2,
        durationMs: 120,
      }),
      getOverview: jest.fn().mockResolvedValue({
        totalClinics: 16,
        averageScore: 72,
        healthyClinicsPercent: 65,
        totalOpenIssues: 5,
      }),
      getRuns: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      getIssues: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      getClinicReliability: jest.fn().mockResolvedValue({
        clinic: { id: '1', name: 'Clínica Biobío', slug: 'clinica-biobio' },
        score: 85,
        tier: 'ALTA',
        breakdown: {},
        disclaimer: 'Aviso legal',
      }),
    };

    mockIncidentService = {
      resolveIssue: jest.fn().mockResolvedValue({
        id: 10n,
        clinicId: 1n,
        runId: 2n,
        status: DataQualityStatus.RESOLVED,
      }),
      dismissIssue: jest.fn().mockResolvedValue({
        id: 11n,
        clinicId: 1n,
        runId: 2n,
        status: DataQualityStatus.DISMISSED,
      }),
    };

    adminController = new AdminDataQualityController(
      mockDataQualityService,
      mockIncidentService,
    );
    publicController = new ClinicReliabilityController(mockDataQualityService);
  });

  describe('AdminDataQualityController', () => {
    it('ejecuta auditoría manual completa', async () => {
      const res = await adminController.runAudit({}, 1);
      expect(mockDataQualityService.runQualityEvaluation).toHaveBeenCalled();
      expect(res.evaluatedClinics).toBe(16);
    });

    it('obtiene resumen KPIs de salud de datos', async () => {
      const res = await adminController.getOverview();
      expect(mockDataQualityService.getOverview).toHaveBeenCalled();
      expect(res.averageScore).toBe(72);
    });

    it('actualiza incidencia a RESOLVED', async () => {
      const res = await adminController.updateIssue(
        '10',
        { status: DataQualityStatus.RESOLVED, resolutionNotes: 'Corregido' },
        1,
      );
      expect(mockIncidentService.resolveIssue).toHaveBeenCalledWith(10n, 1n, 'Corregido');
      expect(res.id).toBe('10');
    });

    it('actualiza incidencia a DISMISSED', async () => {
      const res = await adminController.updateIssue(
        '11',
        { status: DataQualityStatus.DISMISSED, resolutionNotes: 'Falso positivo' },
        1,
      );
      expect(mockIncidentService.dismissIssue).toHaveBeenCalledWith(11n, 1n, 'Falso positivo');
      expect(res.id).toBe('11');
    });
  });

  describe('ClinicReliabilityController', () => {
    it('retorna confiabilidad pública con desglose y disclaimer', async () => {
      const res = await publicController.getReliability('clinica-biobio');
      expect(mockDataQualityService.getClinicReliability).toHaveBeenCalledWith('clinica-biobio');
      expect(res.score).toBe(85);
      expect(res.tier).toBe('ALTA');
    });
  });
});
