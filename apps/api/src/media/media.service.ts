import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
  const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
  return { cloudName, apiKey, apiSecret, configured: !!(cloudName && apiKey && apiSecret) };
}

// Fotos: el secreto NUNCA sale del backend. Flujo:
// 1) admin pide firma (POST admin/media/sign) → 2) navegador sube directo a Cloudinary
// 3) admin adjunta {url, publicId} a la clínica (POST admin/media/photos).
@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  signUpload(folder = 'vetbiobio/clinics') {
    const { cloudName, apiKey, apiSecret, configured } = config();
    if (!configured) {
      throw new ServiceUnavailableException('Fotos no configuradas (CLOUDINARY_* ausente)');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
    return { cloudName, apiKey, timestamp, signature, folder };
  }

  async attachPhoto(input: {
    clinicSlug: string; url: string; publicId?: string | null; altText?: string | null;
    makePrimary?: boolean | null; userId?: number | null;
  }) {
    if (!/^https:\/\//.test(input.url)) throw new BadRequestException('URL https requerida');
    const clinic = await this.prisma.clinic.findUnique({ where: { slug: input.clinicSlug }, select: { id: true } });
    if (!clinic) throw new BadRequestException('Clínica no existe');
    const created = await this.prisma.clinicPhoto.create({
      data: {
        clinicId: clinic.id, url: input.url,
        publicId: input.publicId ?? null, altText: input.altText ?? null,
        isPrimary: input.makePrimary ?? false,
      },
    });
    await this.audit.record({
      userId: input.userId ?? null, action: 'CREATE', entityType: 'clinic_photo',
      entityId: Number(created.id), newValues: { ...created, id: created.id.toString() },
    });
    return { ...created, id: created.id.toString() };
  }
}
