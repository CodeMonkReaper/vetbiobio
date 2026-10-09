import { Injectable } from '@nestjs/common';
import { normalizeChileanPhone, isValidChileanPhone } from '../data-quality/rules/chilean-phone';

export interface RawImportRow {
  [key: string]: any;
}

export interface ParsedImportRow {
  rowNumber: number;
  name: string;
  address: string;
  communeCut: string;
  phoneE164: string | null;
  whatsappE164: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  isEmergency: boolean;
  is24h: boolean;
  description: string | null;
  isValid: boolean;
  validationErrors: string[];
}

@Injectable()
export class ImportParserService {
  private readonly BIOBIO_BBOX = {
    minLat: -38.5,
    maxLat: -36.0,
    minLng: -74.5,
    maxLng: -70.5,
  };

  parseContent(content: string, filename: string): RawImportRow[] {
    const trimmed = content.trim();
    if (!trimmed) return [];

    if (filename.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        throw new Error('El archivo JSON contiene sintaxis inválida.');
      }
    }

    return this.parseCsv(trimmed);
  }

  parseCsv(text: string): RawImportRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Detectar delimitador (coma o punto y coma)
    const firstLine = lines[0] ?? '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    const header = this.splitCsvLine(lines.shift() ?? '', delimiter).map((h) =>
      h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]/g, ''),
    );

    return lines.map((line) => {
      const values = this.splitCsvLine(line, delimiter);
      const row: RawImportRow = {};
      header.forEach((col, idx) => {
        row[col] = (values[idx] ?? '').trim();
      });
      return row;
    });
  }

  private splitCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  parseAndValidateRow(raw: RawImportRow, rowNumber: number): ParsedImportRow {
    const errors: string[] = [];

    // 1. Nombre
    const name = (raw.name || raw.nombre || raw.clinica || raw.razonsocial || '').trim();
    if (!name) {
      errors.push('El nombre de la clínica es obligatorio');
    }

    // 2. Dirección
    const address = (raw.address || raw.direccion || raw.calle || '').trim();
    if (!address) {
      errors.push('La dirección física es obligatoria');
    }

    // 3. Comuna (CUT o nombre)
    const communeCut = (raw.communecut || raw.cut || raw.comuna || '').trim();
    if (!communeCut) {
      errors.push('El código CUT o nombre de la comuna es obligatorio');
    }

    // 4. Teléfono
    const rawPhone = (raw.phone || raw.telefono || raw.fono || raw.celular || '').trim();
    let phoneE164: string | null = null;
    if (rawPhone) {
      const normalized = normalizeChileanPhone(rawPhone);
      if (normalized && isValidChileanPhone(normalized)) {
        phoneE164 = normalized;
      } else {
        errors.push(`Teléfono no cumple formato E.164 chileno válido (+56...): ${rawPhone}`);
      }
    }

    // 5. WhatsApp
    const rawWhatsapp = (raw.whatsapp || raw.wsp || '').trim();
    let whatsappE164: string | null = null;
    if (rawWhatsapp) {
      const normalizedWsp = normalizeChileanPhone(rawWhatsapp);
      if (normalizedWsp && isValidChileanPhone(normalizedWsp)) {
        whatsappE164 = normalizedWsp;
      } else {
        errors.push(`WhatsApp no cumple formato E.164 chileno válido (+56...): ${rawWhatsapp}`);
      }
    }

    // 6. Email
    const email = (raw.email || raw.correo || '').trim().toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Formato de correo electrónico inválido: ${email}`);
    }

    // 7. Sitio Web
    let website = (raw.website || raw.web || raw.url || '').trim() || null;
    if (website && !/^https?:\/\//i.test(website)) {
      website = `https://${website}`;
    }

    // 8. Coordenadas
    const rawLat = raw.latitude || raw.lat || raw.latitud;
    const rawLng = raw.longitude || raw.lng || raw.longitud || raw.lon;
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (rawLat !== undefined && rawLat !== '' && rawLng !== undefined && rawLng !== '') {
      const latNum = Number(String(rawLat).replace(',', '.'));
      const lngNum = Number(String(rawLng).replace(',', '.'));

      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        errors.push(`Coordenadas geográficas no numéricas: lat='${rawLat}', lng='${rawLng}'`);
      } else if (
        latNum < this.BIOBIO_BBOX.minLat ||
        latNum > this.BIOBIO_BBOX.maxLat ||
        lngNum < this.BIOBIO_BBOX.minLng ||
        lngNum > this.BIOBIO_BBOX.maxLng
      ) {
        errors.push(
          `Coordenadas (${latNum}, ${lngNum}) fuera del límite geográfico de la Región del Biobío`,
        );
      } else {
        latitude = latNum;
        longitude = lngNum;
      }
    }

    // 9. Flags
    const isEmergency =
      String(raw.isemergency || raw.urgencia || raw.urgencias || '').toLowerCase() === 'true' ||
      String(raw.isemergency || raw.urgencia || raw.urgencias || '') === '1';
    const is24h =
      String(raw.is24h || raw.continuo || raw.atencion24h || '').toLowerCase() === 'true' ||
      String(raw.is24h || raw.continuo || raw.atencion24h || '') === '1';

    const description = (raw.description || raw.descripcion || '').trim() || null;

    return {
      rowNumber,
      name,
      address,
      communeCut,
      phoneE164,
      whatsappE164,
      email,
      website,
      latitude,
      longitude,
      isEmergency,
      is24h,
      description,
      isValid: errors.length === 0,
      validationErrors: errors,
    };
  }
}
