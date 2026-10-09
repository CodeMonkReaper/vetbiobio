import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';

describe('VerificationService (DB-001 & DB-002 regression tests)', () => {
  let service: VerificationService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: jest.fn(),
      $executeRawUnsafe: jest.fn(),
      verificationLog: {
        create: jest.fn().mockResolvedValue({ id: 1n }),
      },
    };
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 1n }),
    };
    service = new VerificationService(mockPrisma, mockAudit);
  });

  describe('DB-001: clinic_location primary key resolution', () => {
    it('utiliza clinic_id como clave primaria en SELECT y UPDATE para clinic_location', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ verification_status: 'UNVERIFIED' }]);
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      await service.changeStatus({
        entityType: 'clinic_location',
        entityId: 42,
        newStatus: 'PENDING_REVIEW',
      });

      // Verifica que SELECT consulta por clinic_id
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT verification_status FROM "clinic_location" WHERE clinic_id = $1',
        42,
      );

      // Verifica que UPDATE utiliza WHERE clinic_id = $1
      const updateCall = mockPrisma.$executeRawUnsafe.mock.calls[0];
      const sql: string = updateCall[0];
      expect(sql).toContain('WHERE clinic_id = $1');
      expect(sql).not.toContain('WHERE id = $1');
    });

    it('utiliza id como clave primaria para entidades estándar como clinic', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ verification_status: 'UNVERIFIED' }]);
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      await service.changeStatus({
        entityType: 'clinic',
        entityId: 10,
        newStatus: 'PENDING_REVIEW',
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT verification_status FROM "clinic" WHERE id = $1',
        10,
      );
      const updateCall = mockPrisma.$executeRawUnsafe.mock.calls[0];
      expect(updateCall[0]).toContain('WHERE id = $1');
    });
  });

  describe('DB-002: Esquema dinámico para columnas de verificación', () => {
    it('clinic_photo no actualiza verified_at, verification_source ni next_review_at', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ verification_status: 'UNVERIFIED' }]);
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      await service.changeStatus({
        entityType: 'clinic_photo',
        entityId: 5,
        newStatus: 'PENDING_REVIEW',
        source: 'PHONE',
        nextReviewAt: '2026-12-31',
      });

      const updateSql: string = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      expect(updateSql).toBe('UPDATE "clinic_photo" SET verification_status = $2::verification_status WHERE id = $1');
      expect(updateSql).not.toContain('verified_at');
      expect(updateSql).not.toContain('verification_source');
      expect(updateSql).not.toContain('next_review_at');
    });

    it('schedule no actualiza verification_source ni next_review_at pero sí verified_at', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ verification_status: 'PENDING_REVIEW' }]);
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      await service.changeStatus({
        entityType: 'schedule',
        entityId: 8,
        newStatus: 'VERIFIED',
        source: 'PHONE',
        method: 'Llamada telefónica',
      });

      const updateSql: string = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      expect(updateSql).toContain("verified_at = CASE WHEN $2::verification_status = 'VERIFIED'");
      expect(updateSql).not.toContain('verification_source');
      expect(updateSql).not.toContain('next_review_at');
    });

    it('clinic_service_price utiliza columna "source" y no incluye next_review_at', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ verification_status: 'PENDING_REVIEW' }]);
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      await service.changeStatus({
        entityType: 'clinic_service_price',
        entityId: 15,
        newStatus: 'VERIFIED',
        source: 'PHONE',
        method: 'Llamada telefónica',
      });

      const updateSql: string = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      expect(updateSql).toContain('source = COALESCE($3::verification_source, source)');
      expect(updateSql).not.toContain('verification_source =');
      expect(updateSql).not.toContain('next_review_at');
    });
  });

  describe('Control de errores y validaciones', () => {
    it('lanza BadRequestException ante entidad no verificable', async () => {
      await expect(
        service.changeStatus({
          entityType: 'tabla_fantasma',
          entityId: 1,
          newStatus: 'VERIFIED',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException cuando el registro no existe en la BD', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]);

      await expect(
        service.changeStatus({
          entityType: 'clinic',
          entityId: 99999,
          newStatus: 'PENDING_REVIEW',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
