import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsService (DB-003 & DB-004 regression tests)', () => {
  let service: SubmissionsService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrisma);
      }),
      $queryRaw: jest.fn(),
      submission: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 1n }),
      },
      service: {
        findUnique: jest.fn(),
      },
      clinicService: {
        upsert: jest.fn(),
      },
      clinicServicePrice: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    };
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 1n }),
    };
    service = new SubmissionsService(mockPrisma, mockAudit);
  });

  describe('DB-003: Concurrencia y bloqueo FOR UPDATE en moderación', () => {
    it('ejecuta SELECT ... FOR UPDATE dentro de una transacción para serializar aprobaciones', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          id: 100n,
          tracking_code: 'VBB-TEST1',
          type: 'OTHER',
          clinic_id: null,
          payload: { asunto: 'Consulta general' },
          message: 'Nota',
          status: 'PENDING',
        },
      ]);
      mockPrisma.submission.update.mockResolvedValueOnce({
        id: 100n,
        status: 'APPROVED',
        clinicId: null,
        reviewedBy: 1n,
        appliedEntityId: 100n,
      });

      const res = await service.adminApprove(100, { reviewNotes: 'Aprobado OK' }, 1);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(res.status).toBe('APPROVED');
    });

    it('rechaza con BadRequestException si el aporte ya fue procesado concurrentemente', async () => {
      // Simula que la fila fue leída tras haber sido aprobada por otra transacción
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          id: 100n,
          tracking_code: 'VBB-TEST1',
          type: 'OTHER',
          clinic_id: null,
          payload: {},
          status: 'APPROVED',
        },
      ]);

      await expect(
        service.adminApprove(100, { reviewNotes: 'Doble clic' }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si la submission no existe', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.adminApprove(999, {}, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DB-004: Transaccionalidad y validación de reglas de precios en UPDATE_PRICE', () => {
    it('valida reglas de montos y rechaza montos incoherentes antes de mutar la base de datos', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          id: 200n,
          tracking_code: 'VBB-PRICE1',
          type: 'UPDATE_PRICE',
          clinic_id: 10n,
          payload: {
            serviceSlug: 'consulta-general',
            pricingType: 'RANGE',
            minAmount: 25000,
            maxAmount: 15000, // Inválido: min > max en tipo RANGE
          },
          status: 'PENDING',
        },
      ]);
      mockPrisma.service.findUnique.mockResolvedValueOnce({ id: 1n, slug: 'consulta-general' });

      await expect(
        service.adminApprove(200, { reviewNotes: 'Precio malo' }, 1),
      ).rejects.toThrow('Regla de precio inválida: RANGE requiere min<max');

      // Verifica que no se cerró el precio anterior
      expect(mockPrisma.clinicServicePrice.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.clinicServicePrice.create).not.toHaveBeenCalled();
    });

    it('aplica precio atómicamente cerrando vigencia anterior y creando nueva fila', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          id: 201n,
          tracking_code: 'VBB-PRICE2',
          type: 'UPDATE_PRICE',
          clinic_id: 10n,
          payload: {
            serviceSlug: 'consulta-general',
            pricingType: 'FIXED',
            minAmount: 20000,
          },
          status: 'PENDING',
        },
      ]);
      mockPrisma.service.findUnique.mockResolvedValueOnce({ id: 1n, slug: 'consulta-general' });
      mockPrisma.clinicService.upsert.mockResolvedValueOnce({ id: 50n });
      mockPrisma.clinicServicePrice.create.mockResolvedValueOnce({ id: 80n });
      mockPrisma.submission.update.mockResolvedValueOnce({
        id: 201n,
        status: 'APPROVED',
        clinicId: 10n,
        reviewedBy: 1n,
        appliedEntityId: 80n,
      });

      const res = await service.adminApprove(201, {}, 1);

      expect(mockPrisma.clinicServicePrice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clinicServiceId: 50n, validUntil: null },
        }),
      );
      expect(mockPrisma.clinicServicePrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicServiceId: 50n,
            pricingType: 'FIXED',
            minAmount: 20000,
            maxAmount: 20000, // Normalizado a max=min para FIXED
            source: 'COMMUNITY',
          }),
        }),
      );
      expect(res.status).toBe('APPROVED');
    });
  });

  describe('SEC-001: Protección anti-abuso, honeypot y hashing seguro', () => {
    it('bloquea envíos automatizados si el campo honeypot _hp viene relleno', async () => {
      await expect(
        service.create({
          type: 'NEW_CLINIC',
          payload: { name: 'Clinica Spam' },
          _hp: 'soy_un_bot_de_spam',
        }),
      ).rejects.toThrow('Spam detectado');

      expect(mockPrisma.submission.create).not.toHaveBeenCalled();
    });

    it('rechaza envíos con payload que no sea un objeto o supere 64KB', async () => {
      const hugeObject: Record<string, string> = {};
      for (let i = 0; i < 3000; i++) {
        hugeObject[`clave_${i}`] = 'x'.repeat(30);
      }

      await expect(
        service.create({
          type: 'NEW_CLINIC',
          payload: hugeObject,
        }),
      ).rejects.toThrow('El payload excede el límite máximo permitido de 64KB');
    });

    it('genera submitterHash con sal para solicitudes anónimas utilizando la IP del cliente', async () => {
      mockPrisma.submission.create.mockImplementationOnce(({ data }: any) => {
        return Promise.resolve({
          ...data,
          id: 301n,
          trackingCode: data.trackingCode,
        });
      });

      const res = await service.create(
        {
          type: 'OTHER',
          payload: { mensaje: 'Dato anónimo' },
        },
        '192.168.1.100',
      );

      expect(res.trackingCode).toBeDefined();
      const createCall = mockPrisma.submission.create.mock.calls[0][0];
      expect(createCall.data.submitterHash).toBeDefined();
      expect(createCall.data.submitterHash.length).toBe(64); // SHA-256 hex
    });
  });
});
