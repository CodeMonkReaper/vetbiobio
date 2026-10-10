import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchBar } from '@/features/search/SearchBar';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { fetchClinics } from '@/lib/api';
import { BIOBIO_COMMUNES } from '@/data/communes';
import {
  EmergencyIcon,
  ClockIcon,
  MicroscopeIcon,
  TagIcon,
  StethoscopeIcon,
  SyringeIcon,
  HospitalIcon,
  CameraIcon,
  BrainIcon,
  BirdIcon,
  ShieldIcon,
  PriceBadgeIcon,
  ScalesIcon,
} from '@/components/icons/PublicIcons';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vetbiobio.cl';

export const metadata: Metadata = {
  title: 'Directorio de Clínicas Veterinarias en la Región del Biobío',
  description:
    'Encuentra veterinarias verificadas, urgencias 24 horas y aranceles referenciales en Concepción, Talcahuano, Los Ángeles y las 33 comunas del Biobío.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VetBiobío — Directorio de Clínicas Veterinarias',
    description:
      'Directorio territorial con aranceles referenciales, urgencias 24h y verificación activa.',
    url: SITE,
    siteName: 'VetBiobío',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VetBiobío — Directorio de Clínicas Veterinarias',
    description:
      'Directorio territorial con aranceles referenciales, urgencias 24h y verificación activa.',
  },
};

// Accesos prioritarios compactos sin insignias redundantes
const EMERGENCY_ACTIONS = [
  {
    title: 'Urgencias 24 Horas',
    description: 'Guardia veterinaria continua para emergencias críticas.',
    href: '/veterinarias?emergency=true',
    icon: EmergencyIcon,
    accent: 'border-status-outdated-border bg-amber-50/50 hover:bg-amber-50',
    iconBg: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Abierto Ahora',
    description: 'Clínicas con atención médica presencial en este momento.',
    href: '/veterinarias?open_now=true',
    icon: ClockIcon,
    accent: 'border-status-verified-border bg-brand-50/40 hover:bg-brand-50/70',
    iconBg: 'bg-brand-100 text-brand-800',
  },
  {
    title: 'Exámenes y Diagnóstico',
    description: 'Rayos X, ecografía abdominal y laboratorio clínico regional.',
    href: '/examenes/radiografia',
    icon: MicroscopeIcon,
    accent: 'border-status-unverified-border bg-sky-50/40 hover:bg-sky-50/70',
    iconBg: 'bg-sky-100 text-sky-800',
  },
  {
    title: 'Aranceles Públicos',
    description: 'Valores informados de consulta y vacunas ordenados por precio.',
    href: '/veterinarias?sort=PRICE_ASC',
    icon: TagIcon,
    accent: 'border-border-subtle bg-surface hover:bg-surface-alt',
    iconBg: 'bg-surface-alt text-ink',
  },
];

const POPULAR_SERVICES = [
  {
    title: 'Consulta General',
    desc: 'Chequeo clínico primario, triaje y medicina preventiva.',
    href: '/servicios/consulta-general',
    icon: StethoscopeIcon,
  },
  {
    title: 'Vacunación y Chip',
    desc: 'Antirrábica, séxtuple, triple felina e implantación de microchip.',
    href: '/servicios/vacunacion',
    icon: SyringeIcon,
  },
  {
    title: 'Cirugía y Pabellón',
    desc: 'Esterilizaciones, tejidos blandos y cirugía de urgencia.',
    href: '/servicios/cirugia-general',
    icon: HospitalIcon,
  },
  {
    title: 'Ecografía y Rayos X',
    desc: 'Imagenología diagnóstica, radiografía digital y Doppler.',
    href: '/examenes/ecografia',
    icon: CameraIcon,
  },
  {
    title: 'Especialidades Médicas',
    desc: 'Dermatología, traumatología, neurología y oftalmología.',
    href: '/especialidades/dermatologia',
    icon: BrainIcon,
  },
  {
    title: 'Mascotas No Convencionales',
    desc: 'Atención especializada para conejos, aves, roedores y reptiles.',
    href: '/veterinarias?species=EXOTIC',
    icon: BirdIcon,
  },
];

const TOP_COMMUNES = [
  { name: 'Concepción', slug: 'concepcion' },
  { name: 'Talcahuano', slug: 'talcahuano' },
  { name: 'San Pedro de la Paz', slug: 'san-pedro-de-la-paz' },
  { name: 'Chiguayante', slug: 'chiguayante' },
  { name: 'Los Ángeles', slug: 'los-angeles' },
  { name: 'Coronel', slug: 'coronel' },
  { name: 'Hualpén', slug: 'hualpen' },
  { name: 'Penco', slug: 'penco' },
  { name: 'Tomé', slug: 'tome' },
];

export default async function Home() {
  let totalCount: number | null;
  try {
    const stats = await fetchClinics({ limit: '1' });
    totalCount = stats?.meta?.total ?? null;
  } catch {
    totalCount = null;
  }

  // Schema.org estructurado sanitizado
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: SITE,
        name: 'VetBiobío',
        description: 'Directorio territorial de clínicas veterinarias en la Región del Biobío',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE}/veterinarias?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'VetBiobío',
        url: SITE,
        description: 'Plataforma comunitaria de información veterinaria para el Biobío',
      },
    ],
  };

  const serializedJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="space-y-10 sm:space-y-16 py-4">
      {/* Marcado JSON-LD Sanitizado */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedJsonLd }}
      />

      {/* 1. HERO CON PROPUESTA DE VALOR TERRITORIAL */}
      <section className="relative space-y-6 pt-2 text-center sm:pt-6">
        <div className="mx-auto flex max-w-fit items-center gap-2">
          <Badge tone="brand">Directorio Territorial Independiente</Badge>
          <span className="text-xs font-semibold text-ink-mute">
            {totalCount !== null
              ? `${totalCount} establecimientos registrados`
              : 'Región del Biobío'}
          </span>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-tight">
            Encuentra atención veterinaria confiable en el Biobío
          </h1>
          <p className="mx-auto max-w-2xl text-base text-ink-soft sm:text-lg leading-relaxed">
            Directorio con información en proceso de verificación territorial, aranceles referenciales y
            servicios de urgencia para actuar con rapidez y sin sorpresas.
          </p>
        </div>

        {/* Buscador Destacado con Acceso de Urgencia 24h Prioritario */}
        <div className="mx-auto max-w-3xl space-y-3 text-left">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <SearchBar />
            </div>
            <Link
              href="/veterinarias?emergency=true"
              className="inline-flex min-h-[44px] sm:min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-status-danger-border bg-status-danger-bg px-5 py-3 text-sm font-bold text-status-danger-text shadow-sm transition hover:bg-rose-100 active:scale-[0.99] focus-visible:outline focus-visible:outline-3 focus-visible:outline-rose-700 motion-reduce:transform-none shrink-0"
            >
              <EmergencyIcon className="h-5 w-5 text-rose-700" />
              <span>Urgencia 24 h</span>
            </Link>
          </div>
        </div>

        {/* Sugerencias Rápidas de Búsqueda */}
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 text-xs text-ink-mute">
          <span className="font-semibold text-ink">Búsquedas habituales:</span>
          <Link
            href="/veterinarias?q=vacuna"
            className="inline-flex min-h-[44px] items-center rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Vacunación
          </Link>
          <Link
            href="/veterinarias?q=ecografia"
            className="inline-flex min-h-[44px] items-center rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Ecografía
          </Link>
          <Link
            href="/veterinarias?q=esterilizacion"
            className="inline-flex min-h-[44px] items-center rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Esterilización
          </Link>
          <Link
            href="/veterinarias?q=traumatologia"
            className="inline-flex min-h-[44px] items-center rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Traumatología
          </Link>
        </div>
      </section>

      {/* 2. ACCIONES RÁPIDAS EN URGENCIAS (GRID COMPACTA DE 2 COLUMNAS EN MÓVIL) */}
      <section aria-labelledby="acciones-rapidas" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <h2 id="acciones-rapidas" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Atención inmediata y necesidades prioritarias
            </h2>
            <p className="text-sm text-ink-mute">
              Accesos directos para resolver consultas médicas urgentes desde tu dispositivo.
            </p>
          </div>
          <Link
            href="/veterinarias"
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Ver todas las clínicas &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {EMERGENCY_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex flex-col justify-between rounded-xl sm:rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${item.accent}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg}`}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-brand-800">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-700">
                  <span>Explorar</span>
                  <span
                    className="ml-1 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. EXPLORA POR COMUNA (ENLACES CANÓNICOS Y ACCESO A LAS 33 COMUNAS) */}
      <section aria-labelledby="comunas-titulo" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <h2 id="comunas-titulo" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Explora clínicas por comuna
            </h2>
            <p className="text-sm text-ink-mute">
              Encuentra veterinarias cercanas en las principales localidades de la Región del Biobío.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {TOP_COMMUNES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/veterinarias/${c.slug}`}
                className="flex min-h-[44px] items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-brand-600 hover:bg-brand-50/50 hover:text-brand-900 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700"
              >
                <span>{c.name}</span>
                <span aria-hidden="true" className="text-xs text-ink-mute">
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Desplegable accesible para las 33 comunas completas */}
        <details className="group rounded-xl border border-border-subtle bg-surface p-4">
          <summary className="cursor-pointer font-semibold text-sm text-brand-700 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 flex items-center justify-between min-h-[44px]">
            <span>Ver las 33 comunas de la Región del Biobío</span>
            <span className="text-xs text-ink-mute transition-transform group-open:rotate-180" aria-hidden="true">
              ▼
            </span>
          </summary>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 pt-3 border-t border-border-subtle">
            {BIOBIO_COMMUNES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/veterinarias/${c.slug}`}
                  className="flex min-h-[44px] items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-ink hover:text-brand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* 4. SERVICIOS Y ESPECIALIDADES POPULARES */}
      <section aria-labelledby="servicios-titulo" className="space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 id="servicios-titulo" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Servicios clínicos frecuentes
          </h2>
          <p className="text-sm text-ink-mute">
            Procedimientos habituales con información de disponibilidad y valores referenciales.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_SERVICES.map((serv) => {
            const Icon = serv.icon;
            return (
              <Link
                key={serv.title}
                href={serv.href}
                className="group focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700 rounded-xl"
              >
                <Card hoverable className="h-full p-5 motion-reduce:transform-none motion-reduce:transition-none">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-brand-700"
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-bold text-ink group-hover:text-brand-700 text-base">
                        {serv.title}
                      </h3>
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {serv.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. PILARES DE CONFIANZA & VALOR DIFERENCIAL (§23) */}
      <section aria-labelledby="confianza-titulo" className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
        <div className="mx-auto max-w-2xl text-center space-y-2">
          <h2 id="confianza-titulo" className="text-2xl font-bold text-ink">
            Por qué confiar en la información de VetBiobío
          </h2>
          <p className="text-sm text-ink-soft sm:text-base leading-relaxed">
            Construimos un directorio independiente pensado para familias y tutores, con procesos estructurados
            de corroboración territorial.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-700" aria-hidden="true">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <h3 className="font-bold text-ink text-base">Verificación en Terreno</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Cotejo telefónico activo, revisión presencial y cruce de datos con registros sanitarios oficiales para acreditar la existencia de cada centro.
            </p>
          </div>

          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-700" aria-hidden="true">
              <PriceBadgeIcon className="h-6 w-6" />
            </span>
            <h3 className="font-bold text-ink text-base">Aranceles Transparentes</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Publicamos aranceles referenciales informados directamente por los centros para evitar cobros sorpresa antes de la consulta.
            </p>
          </div>

          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-700" aria-hidden="true">
              <ScalesIcon className="h-6 w-6" />
            </span>
            <h3 className="font-bold text-ink text-base">Independencia Editorial</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Ninguna clínica puede pagar por subir su confiabilidad o esconder valoraciones. El orden responde a criterios objetivos y cercanía.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/acerca#metodologia"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            Conoce en detalle nuestra metodología de verificación &rarr;
          </Link>
        </div>
      </section>

      {/* 6. LLAMADO A LA COMUNIDAD */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-bold text-brand-900">
            ¿Detectaste un dato desactualizado o una clínica no registrada?
          </h2>
          <p className="text-sm text-brand-800 leading-relaxed">
            VetBiobío crece con el aporte de la comunidad. Envía una actualización de horarios o precios para beneficio de todos los dueños de mascotas.
          </p>
        </div>
        <div className="shrink-0">
          <ButtonLink href="/aportar" variant="primary" size="md">
            Aportar información
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
