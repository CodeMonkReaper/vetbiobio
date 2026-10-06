import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { validatePriceAmounts, previousValidUntil } from './price-rules';

export interface PriceInput {
  minAmount?: number | null;
  maxAmount?: number | null;
  pricingType: 'FIXED' | 'RANGE' | 'FROM' | 'CONTACT';
  validFrom?: string;
  source?: string | null;
  userId?: number | null;
}

// Precios append-only (ADR-005): cierra vigencia anterior + inserta nuevo, en tx.
// Los CHECKs de BD (FIXED/RANGE/FROM/CONTACT, montos>=0) son la última defensa.
@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private assertValid(input: PriceInput): { from: string; closeAt: string } {
    try {
      validatePriceAmounts(input.pricingType, input.minAmount ?? null, input.maxAmount ?? null);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const from = input.validFrom ?? new Date().toISOString().slice(0, 10);
    return { from, closeAt: previousValidUntil(from) };
  }

  async addServicePrice(input: PriceInput & { clinicServiceId: number }) {
    const { from, closeAt } = this.assertValid(input);
    if (!this.prisma) return { queued: true };
    return this.prisma.$transaction(async (tx: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clinicServicePrice: any;
    }) => {
      await tx.clinicServicePrice.updateMany({
        where: { clinicServiceId: input.clinicServiceId, validUntil: null },
        data: { validUntil: new Date(`${closeAt}T00:00:00Z`) },
      });
      const created = await tx.clinicServicePrice.create({
        data: {
          clinicServiceId: input.clinicServiceId,
          minAmount: input.minAmount ?? null, maxAmount: input.maxAmount ?? null,
          pricingType: input.pricingType, validFrom: new Date(from),
          source: input.source ?? null,
        },
      });
      await this.audit.record({
        userId: input.userId ?? null, action: 'CREATE',
        entityType: 'clinic_service_price', entityId: Number(created.id),
        newValues: { ...created, id: created.id.toString() },
      });
      return { ...created, id: created.id.toString() };
    });
  }

  async addExamPrice(input: PriceInput & { clinicExamId: number }) {
    const { from, closeAt } = this.assertValid(input);
    if (!this.prisma) return { queued: true };
    return this.prisma.$transaction(async (tx: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clinicExamPrice: any;
    }) => {
      await tx.clinicExamPrice.updateMany({
        where: { clinicExamId: input.clinicExamId, validUntil: null },
        data: { validUntil: new Date(`${closeAt}T00:00:00Z`) },
      });
      const created = await tx.clinicExamPrice.create({
        data: {
          clinicExamId: input.clinicExamId,
          minAmount: input.minAmount ?? null, maxAmount: input.maxAmount ?? null,
          pricingType: input.pricingType, validFrom: new Date(from),
          source: input.source ?? null,
        },
      });
      await this.audit.record({
        userId: input.userId ?? null, action: 'CREATE',
        entityType: 'clinic_exam_price', entityId: Number(created.id),
        newValues: { ...created, id: created.id.toString() },
      });
      return { ...created, id: created.id.toString() };
    });
  }
}
