import { ImportController } from './import.controller';
import { ImportActionType } from '@prisma/client';

describe('ImportController', () => {
  let controller: ImportController;
  let mockImportService: any;

  beforeEach(() => {
    mockImportService = {
      createBatch: jest.fn().mockResolvedValue({
        batchId: '1',
        filename: 'clinicas.csv',
        totalRows: 10,
        status: 'PENDING_ANALYSIS',
      }),
      getBatches: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
      getBatchById: jest.fn().mockResolvedValue({
        id: '1',
        filename: 'clinicas.csv',
        status: 'ANALYZED',
      }),
      getBatchRows: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      updateRowAction: jest.fn().mockResolvedValue({
        id: '10',
        rowNumber: 1,
        actionType: 'UPDATE',
      }),
      applyBatch: jest.fn().mockResolvedValue({
        batchId: '1',
        appliedRows: 10,
        status: 'COMPLETED',
      }),
      cancelBatch: jest.fn().mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
      }),
    };

    controller = new ImportController(mockImportService);
  });

  it('sube un nuevo lote CSV para análisis asíncrono', async () => {
    const res = await controller.uploadBatch(
      { content: 'nombre,direccion\nVet,Calle 1', filename: 'clinicas.csv' },
      1,
    );
    expect(mockImportService.createBatch).toHaveBeenCalled();
    expect(res.batchId).toBe('1');
  });

  it('actualiza la acción de una fila', async () => {
    const res = await controller.updateRowAction('1', '10', {
      actionType: ImportActionType.UPDATE,
    });
    expect(mockImportService.updateRowAction).toHaveBeenCalled();
    expect(res.actionType).toBe('UPDATE');
  });

  it('aplica el lote a producción', async () => {
    const res = await controller.applyBatch('1', {}, 1);
    expect(mockImportService.applyBatch).toHaveBeenCalled();
    expect(res.status).toBe('COMPLETED');
  });
});
