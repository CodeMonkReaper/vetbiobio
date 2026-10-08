import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import {
  AdminListSubmissionsDto,
  ApproveSubmissionDto,
  RejectSubmissionDto,
  UpdateSubmissionDto,
} from './dto/admin-submissions.dto';
import { slugify, uniqueSlug } from '../common/slug';
import * as crypto from 'crypto';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    const { type, clinicId, payload, message, evidenceUrl, submitterName, submitterEmail, hasConsent } = createSubmissionDto;

    // Generate tracking code like VBB-XXXX
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const trackingCode = `VBB-${randomHex}`;

    let submitterHash: string | null = null;
    if (submitterEmail) {
      submitterHash = crypto.createHash('sha256').update(submitterEmail.trim().toLowerCase()).digest('hex');
    }

    const consentAt = hasConsent ? new Date() : null;

    const submission = await this.prisma.submission.create({
      data: {
        trackingCode,
        type,
        clinicId: clinicId ? BigInt(clinicId) : null,
        payload: payload ?? {},
        message: message ?? null,
        evidenceUrl: evidenceUrl ?? null,
        submitterName: hasConsent && submitterName ? submitterName.trim() : null,
        submitterEmail: hasConsent && submitterEmail ? submitterEmail.trim().toLowerCase() : null,
        submitterHash,
        consentAt,
        status: 'PENDING',
      },
    });

    return {
      trackingCode: submission.trackingCode,
      message: 'Submission received successfully',
    };
  }

  async getByTrackingCode(trackingCode: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { trackingCode },
      include: {
        clinic: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!submission) {
      return null;
    }

    // Never expose PII in public tracking response
    const { submitterName, submitterEmail, submitterHash, ...safeSubmission } = submission;

    return {
      ...safeSubmission,
      id: safeSubmission.id.toString(),
      clinicId: safeSubmission.clinicId?.toString() ?? null,
      reviewedBy: safeSubmission.reviewedBy?.toString() ?? null,
      appliedEntityId: safeSubmission.appliedEntityId?.toString() ?? null,
    };
  }

  // --- ADMIN METHODS ---

  async adminList(q: AdminListSubmissionsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q.status) {
      where.status = q.status;
    }
    if (q.type) {
      where.type = q.type;
    }
    if (q.clinicId) {
      where.clinicId = BigInt(q.clinicId);
    }

    const [items, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.submission.count({ where }),
    ]);

    const safeItems = items.map((s) => ({
      ...s,
      id: s.id.toString(),
      clinicId: s.clinicId?.toString() ?? null,
      reviewedBy: s.reviewedBy?.toString() ?? null,
      appliedEntityId: s.appliedEntityId?.toString() ?? null,
      clinic: s.clinic
        ? {
            ...s.clinic,
            id: s.clinic.id.toString(),
          }
        : null,
    }));

    return {
      data: safeItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetById(id: bigint | number) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: BigInt(id) },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            phoneE164: true,
            email: true,
            website: true,
            whatsappE164: true,
            description: true,
            isEmergency: true,
            is24h: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission no encontrada');
    }

    let reviewer = null;
    if (submission.reviewedBy) {
      reviewer = await this.prisma.user.findUnique({
        where: { id: submission.reviewedBy },
        select: { id: true, email: true, role: true },
      });
    }

    return {
      ...submission,
      id: submission.id.toString(),
      clinicId: submission.clinicId?.toString() ?? null,
      reviewedBy: submission.reviewedBy?.toString() ?? null,
      appliedEntityId: submission.appliedEntityId?.toString() ?? null,
      clinic: submission.clinic
        ? {
            ...submission.clinic,
            id: submission.clinic.id.toString(),
          }
        : null,
      reviewer: reviewer
        ? {
            ...reviewer,
            id: reviewer.id.toString(),
          }
        : null,
    };
  }

  async adminUpdate(id: bigint | number, dto: UpdateSubmissionDto, userId?: number | null) {
    const sub = await this.prisma.submission.findUnique({ where: { id: BigInt(id) } });
    if (!sub) throw new NotFoundException('Submission no encontrada');
    if (sub.status !== 'PENDING') throw new BadRequestException('Solo se pueden editar aportes pendientes');

    const updateData: any = {};
    if (dto.payload !== undefined) updateData.payload = dto.payload;
    if (dto.message !== undefined) updateData.message = dto.message;
    if (dto.reviewNotes !== undefined) updateData.reviewNotes = dto.reviewNotes;
    if (dto.clinicId !== undefined) updateData.clinicId = dto.clinicId ? BigInt(dto.clinicId) : null;

    const updated = await this.prisma.submission.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    await this.audit.record({
      userId: userId ?? null,
      action: 'UPDATE',
      entityType: 'submission',
      entityId: Number(id),
      oldValues: { payload: sub.payload, message: sub.message },
      newValues: updateData,
    });

    return {
      ...updated,
      id: updated.id.toString(),
      clinicId: updated.clinicId?.toString() ?? null,
      reviewedBy: updated.reviewedBy?.toString() ?? null,
      appliedEntityId: updated.appliedEntityId?.toString() ?? null,
    };
  }

  async adminApprove(id: bigint | number, dto: ApproveSubmissionDto, userId?: number | null) {
    const sub = await this.prisma.submission.findUnique({
      where: { id: BigInt(id) },
      include: { clinic: true },
    });

    if (!sub) throw new NotFoundException('Submission no encontrada');
    if (sub.status !== 'PENDING') throw new BadRequestException('El aporte ya fue procesado');

    const payload = (sub.payload as Record<string, any>) || {};
    let appliedEntityType: string | null = null;
    let appliedEntityId: bigint | null = null;

    // Apply change according to submission type
    if (sub.type === 'NEW_CLINIC') {
      const clinicName = payload.name || payload.nombre || 'Nueva Clínica Veterinaria';
      const slug = await uniqueSlug(clinicName, async (s) => {
        const found = await this.prisma.clinic.findUnique({ where: { slug: s } });
        return !!found;
      });

      const communeCut = payload.communeCut || payload.cut || '08101'; // Default Concepción
      const commune = await this.prisma.commune.findFirst({
        where: { cut: String(communeCut) },
        select: { id: true },
      });

      const clinicStatus = dto.publishDirectly ? 'ACTIVE' : 'DRAFT';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdClinic: any = await this.prisma.$transaction(async (tx: any) => {
        const newClinic = await tx.clinic.create({
          data: {
            name: clinicName,
            slug,
            description: payload.description || payload.descripcion || null,
            phoneE164: payload.phone || payload.telefono || null,
            email: payload.email || null,
            website: payload.website || payload.web || null,
            whatsappE164: payload.whatsapp || null,
            status: clinicStatus,
            verificationStatus: 'UNVERIFIED',
            isEmergency: Boolean(payload.isEmergency || payload.urgencias),
            is24h: Boolean(payload.is24h),
          },
        });

        if (commune && payload.address) {
          const lat = Number(payload.latitude || payload.lat || -36.827);
          const lng = Number(payload.longitude || payload.lng || -73.05);
          await tx.$executeRaw`
            INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location)
            VALUES (
              ${newClinic.id},
              ${String(payload.address)},
              ${commune.id},
              ${lat},
              ${lng},
              ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            )
            ON CONFLICT (clinic_id) DO UPDATE
            SET address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, location = EXCLUDED.location;
          `;
        }

        return newClinic;
      });

      appliedEntityType = 'clinic';
      appliedEntityId = createdClinic.id;
    } else if (sub.type === 'UPDATE_CLINIC' && sub.clinicId) {
      const updateClinicData: any = {};
      if (payload.phone || payload.telefono) updateClinicData.phoneE164 = payload.phone || payload.telefono;
      if (payload.email) updateClinicData.email = payload.email;
      if (payload.whatsapp) updateClinicData.whatsappE164 = payload.whatsapp;
      if (payload.website || payload.web) updateClinicData.website = payload.website || payload.web;
      if (payload.description || payload.descripcion) updateClinicData.description = payload.description || payload.descripcion;
      if (payload.isEmergency !== undefined) updateClinicData.isEmergency = Boolean(payload.isEmergency);
      if (payload.is24h !== undefined) updateClinicData.is24h = Boolean(payload.is24h);

      if (Object.keys(updateClinicData).length > 0) {
        await this.prisma.clinic.update({
          where: { id: sub.clinicId },
          data: updateClinicData,
        });
      }

      appliedEntityType = 'clinic';
      appliedEntityId = sub.clinicId;
    } else if (sub.type === 'REPORT_CLOSURE' && sub.clinicId) {
      await this.prisma.clinic.update({
        where: { id: sub.clinicId },
        data: { status: 'CLOSED' },
      });
      appliedEntityType = 'clinic';
      appliedEntityId = sub.clinicId;
    } else if (sub.type === 'UPDATE_PRICE' && sub.clinicId) {
      // Create price append-only with source: COMMUNITY
      const serviceSlug = payload.serviceSlug || payload.service;
      if (serviceSlug) {
        const service = await this.prisma.service.findUnique({ where: { slug: serviceSlug } });
        if (service) {
          const clinicService = await this.prisma.clinicService.upsert({
            where: {
              clinicId_serviceId: {
                clinicId: sub.clinicId,
                serviceId: service.id,
              },
            },
            create: {
              clinicId: sub.clinicId,
              serviceId: service.id,
            },
            update: {},
          });

          // Close existing active price
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          await this.prisma.clinicServicePrice.updateMany({
            where: {
              clinicServiceId: clinicService.id,
              validUntil: null,
            },
            data: {
              validUntil: yesterday,
            },
          });

          const newPrice = await this.prisma.clinicServicePrice.create({
            data: {
              clinicServiceId: clinicService.id,
              pricingType: payload.pricingType || 'FIXED',
              minAmount: payload.minAmount ? Number(payload.minAmount) : null,
              maxAmount: payload.maxAmount ? Number(payload.maxAmount) : null,
              source: 'COMMUNITY',
              verificationStatus: 'UNVERIFIED',
              notes: payload.notes || 'Aporte ciudadano aprobado',
              validFrom: today,
            },
          });

          appliedEntityType = 'clinic_service_price';
          appliedEntityId = newPrice.id;
        }
      }
    } else {
      // OTHER or unstructured types: Approved with notes
      appliedEntityType = sub.clinicId ? 'clinic' : 'submission';
      appliedEntityId = sub.clinicId ?? sub.id;
    }

    const reviewed = await this.prisma.submission.update({
      where: { id: BigInt(id) },
      data: {
        status: 'APPROVED',
        reviewedBy: userId ? BigInt(userId) : null,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes ?? null,
        appliedEntityType,
        appliedEntityId,
      },
    });

    await this.audit.record({
      userId: userId ?? null,
      action: 'UPDATE',
      entityType: 'submission',
      entityId: Number(id),
      oldValues: { status: 'PENDING' },
      newValues: {
        status: 'APPROVED',
        appliedEntityType,
        appliedEntityId: appliedEntityId ? Number(appliedEntityId) : null,
        reviewNotes: dto.reviewNotes,
      },
    });

    return {
      ...reviewed,
      id: reviewed.id.toString(),
      clinicId: reviewed.clinicId?.toString() ?? null,
      reviewedBy: reviewed.reviewedBy?.toString() ?? null,
      appliedEntityId: reviewed.appliedEntityId?.toString() ?? null,
    };
  }

  async adminReject(id: bigint | number, dto: RejectSubmissionDto, userId?: number | null) {
    const sub = await this.prisma.submission.findUnique({ where: { id: BigInt(id) } });
    if (!sub) throw new NotFoundException('Submission no encontrada');
    if (sub.status !== 'PENDING') throw new BadRequestException('El aporte ya fue procesado');

    const reviewed = await this.prisma.submission.update({
      where: { id: BigInt(id) },
      data: {
        status: 'REJECTED',
        reviewedBy: userId ? BigInt(userId) : null,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes ?? null,
      },
    });

    await this.audit.record({
      userId: userId ?? null,
      action: 'UPDATE',
      entityType: 'submission',
      entityId: Number(id),
      oldValues: { status: 'PENDING' },
      newValues: { status: 'REJECTED', reviewNotes: dto.reviewNotes },
    });

    return {
      ...reviewed,
      id: reviewed.id.toString(),
      clinicId: reviewed.clinicId?.toString() ?? null,
      reviewedBy: reviewed.reviewedBy?.toString() ?? null,
      appliedEntityId: reviewed.appliedEntityId?.toString() ?? null,
    };
  }

  async adminOverview() {
    const [
      pendingSubmissions,
      openReports,
      activeClinics,
      draftClinics,
      inactiveClinics,
      closedClinics,
      verifiedClinics,
      recentSubmissions,
      recentReports,
    ] = await Promise.all([
      this.prisma.submission.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.clinic.count({ where: { status: 'ACTIVE' } }),
      this.prisma.clinic.count({ where: { status: 'DRAFT' } }),
      this.prisma.clinic.count({ where: { status: 'INACTIVE' } }),
      this.prisma.clinic.count({ where: { status: 'CLOSED' } }),
      this.prisma.clinic.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.submission.findMany({
        where: { status: 'PENDING' },
        include: { clinic: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.report.findMany({
        where: { status: 'OPEN' },
        include: { clinic: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      pendingSubmissions,
      openReports,
      clinics: {
        active: activeClinics,
        draft: draftClinics,
        inactive: inactiveClinics,
        closed: closedClinics,
        total: activeClinics + draftClinics + inactiveClinics + closedClinics,
        verified: verifiedClinics,
      },
      recentSubmissions: recentSubmissions.map((s) => ({
        ...s,
        id: s.id.toString(),
        clinicId: s.clinicId?.toString() ?? null,
        reviewedBy: s.reviewedBy?.toString() ?? null,
        appliedEntityId: s.appliedEntityId?.toString() ?? null,
      })),
      recentReports: recentReports.map((r) => ({
        ...r,
        id: r.id.toString(),
        clinicId: r.clinicId?.toString() ?? null,
      })),
    };
  }
}
