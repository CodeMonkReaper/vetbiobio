import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { validatePriceAmounts, previousValidUntil } from './price-rules';

// Precios append-only (ADR-005): cierra vigencia anterior + inserta nuevo, en tx.
// Los CHECKs de BD (FIXED/RANGE/FROM/CONTACT, montos>=0) son la última defensa.
@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async addServicePrice(input: {
    clinicServiceId: number;
    minAmount?: number | null;
    maxAmount?: number | null;
    pricingType: 'FIXED' | 'RANGE' | 'FROM' | 'CONTACT';
    validFrom?: string;
    source?: string | null;
    userId?: number | null;
  }) {
    try {
      validatePriceAmounts(input.pricingType, input.minAmount ?? null, input.maxAmount ?? null);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    if (!this.prisma) return { queued: true };
    const from = input.validFrom ?? new Date().toISOString().slice(0, 10);
    const closeAt = previousValidUntil(from);
    return this.prisma.$transaction(async (tx: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clinicServicePrice: any;
    }) => {
      // Cierre de vigencia anterior en un solo UPDATE (valid_until = from - 1 día).
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
      await this.audit?.record({
        userId: input.userId ?? null, action: 'CREATE',
        entityType: 'clinic_service_price', entityId: Number(created.id),
        newValues: { ...created, id: created.id.toString() },
      });
      return { ...created, id: created.id.toString() };
    });
  }
}
