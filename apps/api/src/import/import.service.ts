import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ImportParserService } from './import-parser.service';
import { ImportWorkerService } from './import-worker.service';
import { DataQualityService } from '../data-quality/data-quality.service';
import {
  ImportBatchStatus,
  ImportRowStatus,
  ImportActionType,
  DataQualityTrigger,
  Prisma,
} from '@prisma/client';
import { uniqueSlug } from '../common/slug';
import { QueryBatchRowsDto } from './dto/query-batch-rows.dto';
import { ApplyBatchDto } from './dto/apply-batch.dto';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly parser: ImportParserService,
    private readonly worker: ImportWorkerService,
    private readonly dataQuality: DataQualityService,
  ) {}

  async createBatch(filename: string, content: string, userId?: bigint | null) {
    const rawRows = this.parser.parseContent(content, filename);

    if (rawRows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas o registros para procesar.');
    }

    const batch = await this.prisma.importBatch.create({
      data: {
        filename,
        uploadedBy: userId ?? null,
        status: ImportBatchStatus.PENDING_ANALYSIS,
        totalRows: rawRows.length,
      },
    });

    // Insertar filas en bruto para staging
    for (let i = 0; i < rawRows.length; i++) {
      await this.prisma.importBatchRow.create({
        data: {
          batchId: batch.id,
          rowNumber: i + 1,
          rawData: (rawRows[i] ?? {}) as Prisma.InputJsonValue,
          status: ImportRowStatus.PENDING,
          actionType: ImportActionType.INSERT,
        },
      });
    }

    // Iniciar el worker de análisis en segundo plano sin bloquear HTTP
    setImmediate(() => {
      this.worker.processBatch(batch.id).catch((err) => {
        this.logger.error(`Error no controlado en worker para lote #${batch.id}:`, err);
      });
    });

    return {
      batchId: batch.id.toString(),
      filename: batch.filename,
      totalRows: batch.totalRows,
      status: batch.status,
      createdAt: batch.createdAt.toISOString(),
    };
  }

  async getBatches(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [batches, total] = await Promise.all([
      this.prisma.importBatch.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.importBatch.count(),
    ]);

    return {
      data: batches.map((b) => ({
        id: b.id.toString(),
        filename: b.filename,
        uploadedBy: b.uploadedBy?.toString() ?? null,
        status: b.status,
        totalRows: b.totalRows,
        validRows: b.validRows,
        duplicateRows: b.duplicateRows,
        errorRows: b.errorRows,
        appliedRows: b.appliedRows,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        completedAt: b.completedAt?.toISOString() ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBatchById(id: bigint) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Lote de importación #${id} no encontrado.`);
    }

    return {
      id: batch.id.toString(),
      filename: batch.filename,
      uploadedBy: batch.uploadedBy?.toString() ?? null,
      status: batch.status,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      duplicateRows: batch.duplicateRows,
      errorRows: batch.errorRows,
      appliedRows: batch.appliedRows,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      completedAt: batch.completedAt?.toISOString() ?? null,
    };
  }

  async getBatchRows(batchId: bigint, filter: QueryBatchRowsDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ImportBatchRowWhereInput = {
      batchId,
    };

    if (filter.status) where.status = filter.status;
    if (filter.actionType) where.actionType = filter.actionType;

    const [rows, total] = await Promise.all([
      this.prisma.importBatchRow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rowNumber: 'asc' },
        include: {
          matchedClinic: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.importBatchRow.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id.toString(),
        batchId: r.batchId.toString(),
        rowNumber: r.rowNumber,
        rawData: r.rawData,
        parsedData: r.parsedData,
        status: r.status,
        actionType: r.actionType,
        matchedClinicId: r.matchedClinicId?.toString() ?? null,
        matchedClinic: r.matchedClinic
          ? {
              id: r.matchedClinic.id.toString(),
              name: r.matchedClinic.name,
              slug: r.matchedClinic.slug,
            }
          : null,
        matchReason: r.matchReason,
        matchScore: r.matchScore,
        differences: r.differences,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRowAction(batchId: bigint, rowId: bigint, actionType: ImportActionType) {
    const row = await this.prisma.importBatchRow.findFirst({
      where: { id: rowId, batchId },
    });

    if (!row) {
      throw new NotFoundException(`Fila #${rowId} en lote #${batchId} no encontrada.`);
    }

    const updated = await this.prisma.importBatchRow.update({
      where: { id: rowId },
      data: { actionType },
    });

    return {
      id: updated.id.toString(),
      rowNumber: updated.rowNumber,
      actionType: updated.actionType,
      status: updated.status,
    };
  }

  async applyBatch(batchId: bigint, options: ApplyBatchDto, userId?: bigint | null) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Lote de importación #${batchId} no encontrado.`);
    }

    if (batch.status !== ImportBatchStatus.ANALYZED) {
      throw new BadRequestException(
        `El lote no puede aplicarse porque su estado actual es ${batch.status} (debe estar en ANALYZED).`,
      );
    }

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: ImportBatchStatus.APPLYING },
    });

    // Obtener filas elegibles para inserción o actualización
    const rows = await this.prisma.importBatchRow.findMany({
      where: {
        batchId,
        status: { in: [ImportRowStatus.VALID, ImportRowStatus.POSSIBLE_DUPLICATE] },
        actionType: { in: [ImportActionType.INSERT, ImportActionType.UPDATE] },
      },
      orderBy: { rowNumber: 'asc' },
    });

    let appliedCount = 0;

    for (const r of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: any = r.parsedData || r.rawData;

      try {
        await this.prisma.$transaction(async (tx) => {
          if (r.actionType === ImportActionType.INSERT) {
            // 1. Resolver comuna
            let communeId: bigint = 1n; // Default Biobío
            if (parsed.communeCut) {
              const commune = await tx.commune.findFirst({
                where: {
                  OR: [
                    { cut: String(parsed.communeCut) },
                    { slug: String(parsed.communeCut).toLowerCase() },
                  ],
                },
              });
              if (commune) communeId = commune.id;
            }

            // 2. Generar slug único inmutable
            const slug = await uniqueSlug(parsed.name, async (s) => {
              const count = await tx.clinic.count({ where: { slug: s } });
              return count > 0;
            });

            // 3. Crear clínica
            const created = await tx.clinic.create({
              data: {
                name: parsed.name,
                slug,
                phoneE164: parsed.phoneE164 || null,
                whatsappE164: parsed.whatsappE164 || null,
                email: parsed.email || null,
                website: parsed.website || null,
                description: parsed.description || null,
                isEmergency: parsed.isEmergency ?? false,
                is24h: parsed.is24h ?? false,
                status: 'PENDING_VERIFICATION',
              },
            });

            // 4. Ubicación PostGIS (opcional si hay coordenadas)
            if (parsed.latitude && parsed.longitude) {
              await tx.$executeRaw`
                INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location)
                VALUES (
                  ${created.id},
                  ${parsed.address || null},
                  ${communeId},
                  ${parsed.latitude},
                  ${parsed.longitude},
                  ST_SetSRID(ST_MakePoint(${parsed.longitude}, ${parsed.latitude}), 4326)::geography
                )
              `;
            } else {
              await tx.$executeRaw`
                INSERT INTO clinic_location (clinic_id, address, commune_id)
                VALUES (
                  ${created.id},
                  ${parsed.address || null},
                  ${communeId}
                )
              `;
            }

            // 5. Auditoría
            await tx.auditLog.create({
              data: {
                userId: userId ?? null,
                action: 'CREATE',
                entityType: 'clinic',
                entityId: created.id,
                newValues: {
                  source: `import_batch_#${batchId}`,
                  name: created.name,
                  slug: created.slug,
                },
              },
            });

            // 6. Marcar fila aplicada
            await tx.importBatchRow.update({
              where: { id: r.id },
              data: { status: ImportRowStatus.APPLIED },
            });

            appliedCount++;
          } else if (r.actionType === ImportActionType.UPDATE && r.matchedClinicId) {
            // Actualización de clínica existente
            const clinicId = r.matchedClinicId;

            const updateData: Prisma.ClinicUpdateInput = {};
            if (parsed.phoneE164) updateData.phoneE164 = parsed.phoneE164;
            if (parsed.whatsappE164) updateData.whatsappE164 = parsed.whatsappE164;
            if (parsed.email) updateData.email = parsed.email;
            if (parsed.website) updateData.website = parsed.website;
            if (parsed.description) updateData.description = parsed.description;

            const updated = await tx.clinic.update({
              where: { id: clinicId },
              data: updateData,
            });

            if (parsed.address || (parsed.latitude && parsed.longitude)) {
              if (parsed.latitude && parsed.longitude) {
                await tx.$executeRaw`
                  UPDATE clinic_location
                  SET address = COALESCE(${parsed.address}, address),
                      latitude = ${parsed.latitude},
                      longitude = ${parsed.longitude},
                      location = ST_SetSRID(ST_MakePoint(${parsed.longitude}, ${parsed.latitude}), 4326)::geography
                  WHERE clinic_id = ${clinicId}
                `;
              } else if (parsed.address) {
                await tx.$executeRaw`
                  UPDATE clinic_location
                  SET address = ${parsed.address}
                  WHERE clinic_id = ${clinicId}
                `;
              }
            }

            await tx.auditLog.create({
              data: {
                userId: userId ?? null,
                action: 'UPDATE',
                entityType: 'clinic',
                entityId: clinicId,
                newValues: {
                  source: `import_batch_#${batchId}`,
                  differences: r.differences,
                },
              },
            });

            await tx.importBatchRow.update({
              where: { id: r.id },
              data: { status: ImportRowStatus.APPLIED },
            });

            appliedCount++;
          }
        });
      } catch (rowErr: any) {
        this.logger.error(`Error aplicando fila #${r.rowNumber} a producción:`, rowErr);
        await this.prisma.importBatchRow.update({
          where: { id: r.id },
          data: {
            status: ImportRowStatus.ERROR,
            errorMessage: `Error al aplicar a producción: ${rowErr.message}`,
          },
        });
      }
    }

    // Finalizar lote
    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: ImportBatchStatus.COMPLETED,
        appliedRows: appliedCount,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Re-evaluar motor de calidad de datos en segundo plano
    setImmediate(() => {
      this.dataQuality.runQualityEvaluation(DataQualityTrigger.MANUAL, userId).catch((err) => {
        this.logger.error('Error reevaluando calidad de datos tras aplicar lote:', err);
      });
    });

    return {
      batchId: batchId.toString(),
      appliedRows: appliedCount,
      status: ImportBatchStatus.COMPLETED,
    };
  }

  async cancelBatch(batchId: bigint) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Lote de importación #${batchId} no encontrado.`);
    }

    const updated = await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: ImportBatchStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id.toString(),
      status: updated.status,
    };
  }
}
