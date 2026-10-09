import { ImportService } from './import.service';
import { ImportBatchStatus, ImportRowStatus, ImportActionType } from '@prisma/client';

describe('ImportService', () => {
  let service: ImportService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockParser: any;
  let mockWorker: any;
  let mockDataQuality: any;

  beforeEach(() => {
    mockPrisma = {
      importBatch: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      importBatchRow: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      clinic: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 101n, name: 'Vet Nueva', slug: 'vet-nueva' }),
        update: jest.fn().mockResolvedValue({ id: 101n }),
      },
      commune: {
        findFirst: jest.fn().mockResolvedValue({ id: 1n }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 1n }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };

    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 1n }),
    };

    mockParser = {
      parseContent: jest.fn().mockReturnValue([
        { name: 'Vet Nueva', address: 'Calle 1', commune: 'Concepción', phone: '+56912345678' },
      ]),
    };

    mockWorker = {
      processBatch: jest.fn().mockResolvedValue(undefined),
    };

    mockDataQuality = {
      runQualityEvaluation: jest.fn().mockResolvedValue({}),
    };

    service = new ImportService(
      mockPrisma,
      mockAudit,
      mockParser,
      mockWorker,
      mockDataQuality,
    );
  });

  describe('createBatch', () => {
    it('crea el lote y las filas de staging y dispara el worker', async () => {
      mockPrisma.importBatch.create.mockResolvedValue({
        id: 1n,
        filename: 'test.csv',
        totalRows: 1,
        status: ImportBatchStatus.PENDING_ANALYSIS,
        createdAt: new Date(),
      });

      const res = await service.createBatch('test.csv', 'nombre,direccion\nVet,Calle 1', 99n);

      expect(mockPrisma.importBatch.create).toHaveBeenCalled();
      expect(mockPrisma.importBatchRow.create).toHaveBeenCalled();
      expect(res.batchId).toBe('1');
      expect(res.status).toBe(ImportBatchStatus.PENDING_ANALYSIS);
    });
  });

  describe('applyBatch', () => {
    it('aplica transaccionalmente filas en estado VALID como INSERT', async () => {
      mockPrisma.importBatch.findUnique.mockResolvedValue({
        id: 5n,
        status: ImportBatchStatus.ANALYZED,
      });

      mockPrisma.importBatchRow.findMany.mockResolvedValue([
        {
          id: 501n,
          batchId: 5n,
          rowNumber: 1,
          status: ImportRowStatus.VALID,
          actionType: ImportActionType.INSERT,
          parsedData: {
            name: 'Clínica Veterinaria Los Ángeles',
            address: 'Colón 300',
            communeCut: '08301',
            latitude: -37.46,
            longitude: -72.35,
          },
        },
      ]);

      const res = await service.applyBatch(5n, {}, 99n);

      expect(mockPrisma.clinic.create).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockPrisma.importBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5n },
          data: expect.objectContaining({ status: ImportBatchStatus.COMPLETED }),
        }),
      );
      expect(res.appliedRows).toBe(1);
      expect(res.status).toBe(ImportBatchStatus.COMPLETED);
    });
  });

  describe('cancelBatch', () => {
    it('cancela el lote si existe', async () => {
      mockPrisma.importBatch.findUnique.mockResolvedValue({ id: 5n });
      mockPrisma.importBatch.update.mockResolvedValue({ id: 5n, status: ImportBatchStatus.CANCELLED });

      const res = await service.cancelBatch(5n);
      expect(res.status).toBe(ImportBatchStatus.CANCELLED);
    });
  });
});
