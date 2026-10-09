import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedImportRow } from './import-parser.service';
import { ImportRowStatus, ImportActionType } from '@prisma/client';

export interface DeduplicationResult {
  matchedClinicId: bigint | null;
  matchReason: string | null;
  matchScore: number | null;
  differences: Record<string, { current: any; proposed: any }>;
  suggestedAction: ImportActionType;
  status: ImportRowStatus;
}

@Injectable()
export class DeduplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateRow(row: ParsedImportRow): Promise<DeduplicationResult> {
    if (!row.isValid) {
      return {
        matchedClinicId: null,
        matchReason: null,
        matchScore: null,
        differences: {},
        suggestedAction: ImportActionType.SKIP,
        status: ImportRowStatus.INVALID,
      };
    }

    let phoneScore = 0;
    let trigramScore = 0;
    let geoScore = 0;

    let candidateByPhone: any = null;
    let candidateByTrigram: any = null;
    let candidateByGeo: any = null;

    // 1. Coincidencia telefónica E.164 (50%)
    if (row.phoneE164 || row.whatsappE164) {
      const phoneToCheck = row.phoneE164 || row.whatsappE164;
      const phoneRows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT c.id, c.name, c.slug, c.phone_e164, c.whatsapp_e164, c.email, c.website,
               cl.address, cl.latitude, cl.longitude
        FROM clinic c
        LEFT JOIN clinic_location cl ON cl.clinic_id = c.id
        WHERE (c.phone_e164 = '${phoneToCheck}' OR c.whatsapp_e164 = '${phoneToCheck}')
          AND c.deleted_at IS NULL
        LIMIT 1
      `);
      if (phoneRows.length > 0) {
        candidateByPhone = phoneRows[0];
        phoneScore = 1.0;
      }
    }

    // 2. Similitud fonética / trigramas (30%)
    const sanitizedName = row.name.replace(/'/g, "''");
    const trigramRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.name, c.slug, c.phone_e164, c.whatsapp_e164, c.email, c.website,
             cl.address, cl.latitude, cl.longitude,
             similarity(c.name, '${sanitizedName}') AS sim
      FROM clinic c
      LEFT JOIN clinic_location cl ON cl.clinic_id = c.id
      WHERE similarity(c.name, '${sanitizedName}') >= 0.55
        AND c.deleted_at IS NULL
      ORDER BY sim DESC
      LIMIT 1
    `);
    if (trigramRows.length > 0) {
      candidateByTrigram = trigramRows[0];
      trigramScore = Number(candidateByTrigram.sim) || 0;
    }

    // 3. Proximidad geográfica PostGIS (20%)
    if (row.latitude !== null && row.longitude !== null) {
      const geoRows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT c.id, c.name, c.slug, c.phone_e164, c.whatsapp_e164, c.email, c.website,
               cl.address, cl.latitude, cl.longitude,
               ST_Distance(cl.location, ST_SetSRID(ST_MakePoint(${row.longitude}, ${row.latitude}), 4326)::geography) AS dist_meters
        FROM clinic c
        JOIN clinic_location cl ON cl.clinic_id = c.id
        WHERE ST_DWithin(cl.location, ST_SetSRID(ST_MakePoint(${row.longitude}, ${row.latitude}), 4326)::geography, 150)
          AND c.deleted_at IS NULL
        ORDER BY dist_meters ASC
        LIMIT 1
      `);
      if (geoRows.length > 0) {
        candidateByGeo = geoRows[0];
        const dist = Number(candidateByGeo.dist_meters) || 0;
        geoScore = Math.max(0, (150 - dist) / 150);
      }
    }

    // Identificar mejor candidato
    let chosenCandidate: any = null;
    let matchReason: string | null = null;

    if (candidateByPhone) {
      chosenCandidate = candidateByPhone;
      matchReason = 'PHONE_EXACT';
    } else if (candidateByTrigram && trigramScore >= 0.65) {
      chosenCandidate = candidateByTrigram;
      matchReason = 'NAME_SIMILARITY';
    } else if (candidateByGeo && geoScore >= 0.70) {
      chosenCandidate = candidateByGeo;
      matchReason = 'GEO_PROXIMITY';
    } else if (candidateByTrigram || candidateByGeo) {
      chosenCandidate = candidateByTrigram || candidateByGeo;
      matchReason = 'HYBRID_MATCH';
    }

    const compositeScore = Number(
      (0.5 * phoneScore + 0.3 * trigramScore + 0.2 * geoScore).toFixed(2),
    );

    if (!chosenCandidate || compositeScore < 0.3) {
      return {
        matchedClinicId: null,
        matchReason: null,
        matchScore: compositeScore > 0 ? compositeScore : null,
        differences: {},
        suggestedAction: ImportActionType.INSERT,
        status: ImportRowStatus.VALID,
      };
    }

    // Calcular diferencias campo por campo
    const differences: Record<string, { current: any; proposed: any }> = {};

    if (chosenCandidate.name && chosenCandidate.name !== row.name) {
      differences.name = { current: chosenCandidate.name, proposed: row.name };
    }
    if (row.phoneE164 && chosenCandidate.phone_e164 !== row.phoneE164) {
      differences.phoneE164 = { current: chosenCandidate.phone_e164, proposed: row.phoneE164 };
    }
    if (row.whatsappE164 && chosenCandidate.whatsapp_e164 !== row.whatsappE164) {
      differences.whatsappE164 = {
        current: chosenCandidate.whatsapp_e164,
        proposed: row.whatsappE164,
      };
    }
    if (row.address && chosenCandidate.address !== row.address) {
      differences.address = { current: chosenCandidate.address, proposed: row.address };
    }
    if (row.email && chosenCandidate.email !== row.email) {
      differences.email = { current: chosenCandidate.email, proposed: row.email };
    }
    if (row.website && chosenCandidate.website !== row.website) {
      differences.website = { current: chosenCandidate.website, proposed: row.website };
    }

    const hasDifferences = Object.keys(differences).length > 0;
    const suggestedAction = hasDifferences ? ImportActionType.UPDATE : ImportActionType.SKIP;

    return {
      matchedClinicId: BigInt(chosenCandidate.id),
      matchReason,
      matchScore: compositeScore,
      differences,
      suggestedAction,
      status: ImportRowStatus.POSSIBLE_DUPLICATE,
    };
  }
}
