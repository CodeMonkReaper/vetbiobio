import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

// Comercial separado de verificación: crear premium/publicidad jamás toca verification_status.
@Injectable()
export class PremiumService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createSubscription(input: { clinicSlug: string; planId: string; expiresAt?: string | null; userId?: number | null }) {
    if (!['FREE', 'PREMIUM', 'PREMIUM_PLUS'].includes(input.planId)) throw new BadRequestException('Plan inválido');
    const clinic = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
    if (!clinic) throw new BadRequestException('Clínica no existe');
    const created = await this.prisma.premiumSubscription.create({
      data: {
        clinicId: clinic.id, planId: input.planId, status: 'ACTIVE',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    await this.audit.record({
      userId: input.userId ?? null, action: 'CREATE', entityType: 'premium_subscription',
      entityId: Number(created.id), newValues: { ...created, id: created.id.toString() },
    });
    return { ...created, id: created.id.toString() };
  }

  async createAdvertisement(input: {
    clinicSlug?: string | null; campaignName: string; placement: string;
    startAt: string; endAt: string; userId?: number | null;
  }) {
    if (!['SPONSORED_CLINIC', 'BANNER', 'FEATURED_SERVICE'].includes(input.placement)) {
      throw new BadRequestException('Placement inválido');
    }
    if (new Date(input.endAt) <= new Date(input.startAt)) throw new BadRequestException('Rango de fechas inválido');
    let clinicId: bigint | null = null;
    if (input.clinicSlug) {
      const clinic = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
      if (!clinic) throw new BadRequestException('Clínica no existe');
      clinicId = clinic.id;
    }
    const created = await this.prisma.advertisement.create({
      data: {
        clinicId, campaignName: input.campaignName, placement: input.placement,
        startAt: new Date(input.startAt), endAt: new Date(input.endAt), status: 'ACTIVE',
      },
    });
    await this.audit.record({
      userId: input.userId ?? null, action: 'CREATE', entityType: 'advertisement',
      entityId: Number(created.id), newValues: { ...created, id: created.id.toString() },
    });
    return { ...created, id: created.id.toString() };
  }
}
