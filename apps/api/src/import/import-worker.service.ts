import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportParserService } from './import-parser.service';
import { DeduplicationService } from './deduplication.service';
import { ImportBatchStatus, ImportRowStatus, Prisma } from '@prisma/client';

@Injectable()
export class ImportWorkerService {
  private readonly logger = new Logger(ImportWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ImportParserService,
    private readonly deduplication: DeduplicationService,
  ) {}

  async processBatch(batchId: bigint, chunkSize = 25): Promise<void> {
    this.logger.log(`Iniciando procesamiento asíncrono para lote de importación #${batchId}...`);

    try {
      await this.prisma.importBatch.update({
        where: { id: batchId },
        data: { status: ImportBatchStatus.ANALYZING },
      });

      let hasMore = true;

      while (hasMore) {
        // Bloqueo sin contención con SKIP LOCKED
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowsToProcess: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT id, batch_id, row_number, raw_data
          FROM import_batch_row
          WHERE batch_id = ${batchId} AND status = 'PENDING'
          ORDER BY row_number ASC
          LIMIT ${chunkSize}
          FOR UPDATE SKIP LOCKED;
        `);

        if (rowsToProcess.length === 0) {
          hasMore = false;
          break;
        }

        for (const rawRow of rowsToProcess) {
          const rowId = BigInt(rawRow.id);
          const rowNumber = Number(rawRow.row_number);
          const rawData = rawRow.raw_data;

          try {
            // 1. Normalización y validación sintáctica
            const parsed = this.parser.parseAndValidateRow(rawData, rowNumber);

            // 2. Deduplicación multicriterio
            const dedupResult = await this.deduplication.evaluateRow(parsed);

            // 3. Persistir resultado analizado
            await this.prisma.importBatchRow.update({
              where: { id: rowId },
              data: {
                parsedData: parsed as unknown as Prisma.InputJsonValue,
                status: dedupResult.status,
                actionType: dedupResult.suggestedAction,
                matchedClinicId: dedupResult.matchedClinicId,
                matchReason: dedupResult.matchReason,
                matchScore: dedupResult.matchScore,
                differences: dedupResult.differences as unknown as Prisma.InputJsonValue,
                errorMessage: parsed.validationErrors.length > 0 ? parsed.validationErrors.join(', ') : null,
              },
            });
          } catch (err: any) {
            this.logger.error(`Error procesando fila #${rowNumber} del lote #${batchId}:`, err);
            await this.prisma.importBatchRow.update({
              where: { id: rowId },
              data: {
                status: ImportRowStatus.ERROR,
                errorMessage: `Fallo interno durante el análisis: ${err.message}`,
              },
            });
          }
        }
      }

      // Consolidar métricas del lote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const counts: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status = 'VALID' THEN 1 END)::int AS valid,
          COUNT(CASE WHEN status = 'POSSIBLE_DUPLICATE' THEN 1 END)::int AS duplicate,
          COUNT(CASE WHEN status IN ('INVALID', 'ERROR') THEN 1 END)::int AS error
        FROM import_batch_row
        WHERE batch_id = ${batchId};
      `);

      const total = counts[0]?.total ?? 0;
      const valid = counts[0]?.valid ?? 0;
      const duplicate = counts[0]?.duplicate ?? 0;
      const error = counts[0]?.error ?? 0;

      await this.prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: ImportBatchStatus.ANALYZED,
          totalRows: total,
          validRows: valid,
          duplicateRows: duplicate,
          errorRows: error,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Lote #${batchId} procesado exitosamente (Dry-Run listo): ${total} filas analizadas (${valid} válidas, ${duplicate} duplicadas, ${error} errores).`,
      );
    } catch (globalErr: any) {
      this.logger.error(`Fallo catastrófico en lote #${batchId}:`, globalErr);
      await this.prisma.importBatch.update({
        where: { id: batchId },
        data: { status: ImportBatchStatus.FAILED },
      });
    }
  }
}
