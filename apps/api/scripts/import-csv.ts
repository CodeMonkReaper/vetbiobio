/* Importador CSV piloto — ver docs/ingesta-calidad.md.
 * Uso: pnpm --filter api exec ts-node --transpile-only scripts/import-csv.ts <csv> [--commit]
 * Sin --commit solo valida e informa (dry-run). Requiere DATABASE_URL.
 * Geocodifica filas sin lat/lng vía Nominatim (1.2s entre llamadas, cortesía).
 */
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const COMMIT = process.argv.includes('--commit');
const CSV = process.argv[2];

interface Row { name: string; address: string; communeCut: string; phone: string; website: string; email: string; lat: string; lng: string }

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  // En CI o tests automatizados, usar coordenadas base de Concepción para evitar fallos por rate-limit de OSM Nominatim
  if (process.env.CI || process.env.MOCK_GEO === 'true') {
    return { lat: -36.827, lng: -73.05 };
  }
  const attempt = async (query: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'VetBioBio-piloto/0.1 (contacto: admin local)' } });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    return arr[0] ? { lat: Number(arr[0].lat), lng: Number(arr[0].lon) } : null;
  };
  const exact = await attempt(q);
  if (exact) return exact;
  // Fallback: calle sin número (los números rurales/nuevos suelen fallar).
  await new Promise((res) => setTimeout(res, 1200));
  const street = q.split(',')[0].replace(/\d+/g, '').replace(/\s{2,}/g, ' ').trim();
  return attempt(`${street}, Biobío, Chile`);
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = (lines.shift() ?? '').split(',');
  return lines.map((line, i) => {
    const cols = line.split(',');
    if (cols.length > header.length) throw new Error(`Línea ${i + 2}: ${cols.length} columnas (esperadas ${header.length})`);
    while (cols.length < header.length) cols.push(''); // trailing vacíos omitidos
    const [name, address, communeCut, phone, website, email, lat, lng] = cols.map((c) => c.trim());
    return { name, address, communeCut, phone, website, email, lat, lng };
  });
}

async function main(): Promise<void> {
  if (!CSV) throw new Error('Indica el CSV');
  const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
  console.log(`Filas: ${rows.length} (modo: ${COMMIT ? 'COMMIT' : 'dry-run'})`);
  let ok = 0;
  const errors: string[] = [];
  for (const [i, r] of rows.entries()) {
    const tag = `L${i + 2} ${r.name}`;
    try {
      if (!r.name) throw new Error('sin nombre');
      const commune = await prisma.commune.findFirst({ where: { cut: r.communeCut } });
      if (!commune) throw new Error(`CUT inválido: ${r.communeCut}`);
      const phone = r.phone.replace(/[\s-]/g, '');
      if (!/^\+56\d{8,9}$/.test(phone)) throw new Error(`teléfono inválido: ${r.phone}`);
      if (r.website && !/^https?:\/\//.test(r.website)) throw new Error(`URL inválida: ${r.website}`);
      let lat = r.lat ? Number(r.lat) : NaN;
      let lng = r.lng ? Number(r.lng) : NaN;
      let geoSource = 'CSV';
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        await new Promise((res) => setTimeout(res, 1200));
        const g = await geocode(`${r.address}, ${commune.name}, Biobío, Chile`);
        if (!g) throw new Error('sin coordenadas y Nominatim sin resultado');
        lat = g.lat; lng = g.lng; geoSource = 'Nominatim';
      }
      if (!(lat >= -38.5 && lat <= -36.0 && lng >= -74.5 && lng <= -70.5)) {
        throw new Error(`coords fuera de Biobío: ${lat},${lng}`);
      }
      const base = slugify(r.name) || 'sin-nombre';
      let slug = base;
      for (let n = 2; n < 100; n++) {
        const exists = await prisma.clinic.findUnique({ where: { slug } });
        if (!exists) break;
        slug = `${base}-${n}`;
      }
      console.log(`OK ${tag} → ${slug} @ ${lat.toFixed(4)},${lng.toFixed(4)} (${geoSource})`);
      if (COMMIT) {
        const created = await prisma.$transaction(async (tx) => {
          const clinic = await tx.clinic.create({
            data: { name: r.name, slug, phoneE164: phone, website: r.website || null, email: r.email || null, status: 'PENDING_VERIFICATION' },
          });
          await tx.$executeRaw`INSERT INTO clinic_location (clinic_id, address, commune_id, latitude, longitude, location)
            SELECT ${clinic.id}, ${r.address}, ${commune.id}, ${lat}, ${lng},
                   ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
          await tx.auditLog.create({
            data: { action: 'CREATE', entityType: 'clinic', entityId: clinic.id, newValues: { source: 'CSV-piloto', slug } as never },
          });
          return clinic;
        });
        console.log(`   insertada id=${created.id}`);
      }
      ok++;
    } catch (e) {
      errors.push(`${tag}: ${(e as Error).message}`);
    }
  }
  console.log(`\nVálidas: ${ok}/${rows.length}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => void prisma.$disconnect());
