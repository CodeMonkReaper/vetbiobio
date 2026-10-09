import Link from 'next/link';
import { SearchBar } from '@/features/search/SearchBar';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Accesos prioritarios para situaciones de urgencia y búsqueda rápida
const EMERGENCY_ACTIONS = [
  {
    title: 'Urgencias 24 Horas',
    description: 'Guardia veterinaria nocturna y atención médica continua.',
    href: '/veterinarias?emergency=true',
    icon: '🚨',
    accent: 'border-status-outdated-border bg-amber-50/50 hover:bg-amber-50',
    badge: 'Urgencia',
    badgeTone: 'warning' as const,
  },
  {
    title: 'Abierto Ahora',
    description: 'Clínicas con atención presencial confirmada en este momento.',
    href: '/veterinarias?open_now=true',
    icon: '🕒',
    accent: 'border-status-verified-border bg-brand-50/40 hover:bg-brand-50/70',
    badge: 'En servicio',
    badgeTone: 'success' as const,
  },
  {
    title: 'Exámenes y Diagnóstico',
    description: 'Rayos X, ecografía abdominal y laboratorio clínico regional.',
    href: '/veterinarias?exam=radiografia',
    icon: '🔬',
    accent: 'border-status-unverified-border bg-sky-50/40 hover:bg-sky-50/70',
    badge: 'Imagenología',
    badgeTone: 'info' as const,
  },
  {
    title: 'Aranceles Públicos',
    description: 'Valores informados de consulta y vacunas para evitar sorpresas.',
    href: '/veterinarias?sort=aranceles',
    icon: '🏷️',
    accent: 'border-border-subtle bg-surface hover:bg-surface-alt',
    badge: 'Precios',
    badgeTone: 'neutral' as const,
  },
];

const POPULAR_SERVICES = [
  {
    title: 'Consulta General',
    desc: 'Chequeo clínico primario, triaje y medicina preventiva.',
    href: '/veterinarias?service=consulta-general',
    icon: '🩺',
  },
  {
    title: 'Vacunación y Chip',
    desc: 'Antirrábica, séxtuple, triple felina e implantación de microchip.',
    href: '/veterinarias?service=vacunacion',
    icon: '💉',
  },
  {
    title: 'Cirugía y Pabellón',
    desc: 'Esterilizaciones, tejidos blandos y cirugía de urgencia.',
    href: '/veterinarias?service=cirugia-general',
    icon: '🏥',
  },
  {
    title: 'Ecografía y Rayos X',
    desc: 'Imagenología diagnóstica, radiografía digital y Doppler.',
    href: '/veterinarias?exam=ecografia',
    icon: '📷',
  },
  {
    title: 'Especialidades Médicas',
    desc: 'Dermatología, traumatología, neurología y oftalmología.',
    href: '/veterinarias?specialty=dermatologia',
    icon: '🧠',
  },
  {
    title: 'Mascotas No Convencionales',
    desc: 'Atención especializada para conejos, aves, roedores y reptiles.',
    href: '/veterinarias?service=exoticos',
    icon: '🦜',
  },
];

const COMMUNES = [
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

export default function Home() {
  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO CON PROPUESTA DE VALOR TERRITORIAL */}
      <section className="relative space-y-6 pt-4 text-center sm:pt-8">
        <div className="mx-auto flex max-w-fit items-center gap-2">
          <Badge tone="brand">Directorio Territorial Independiente</Badge>
          <span className="text-xs font-medium text-ink-mute">Región del Biobío</span>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-tight">
            Encuentra atención veterinaria confiable en el Biobío
          </h1>
          <p className="mx-auto max-w-2xl text-base text-ink-soft sm:text-lg">
            Directorio verificado con aranceles referenciales, servicios de urgencia y disponibilidad horaria
            para actuar con rapidez y sin sorpresas.
          </p>
        </div>

        {/* Buscador Destacado */}
        <div className="mx-auto max-w-3xl text-left">
          <SearchBar />
        </div>

        {/* Sugerencias Rápidas de Búsqueda */}
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 text-xs text-ink-mute">
          <span className="font-semibold text-ink">Búsquedas habituales:</span>
          <Link
            href="/veterinarias?q=vacuna"
            className="rounded-full border border-border-subtle bg-surface px-3 py-1 font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800"
          >
            Vacunación
          </Link>
          <Link
            href="/veterinarias?q=ecografia"
            className="rounded-full border border-border-subtle bg-surface px-3 py-1 font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800"
          >
            Ecografía
          </Link>
          <Link
            href="/veterinarias?q=esterilizacion"
            className="rounded-full border border-border-subtle bg-surface px-3 py-1 font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800"
          >
            Esterilización
          </Link>
          <Link
            href="/veterinarias?q=traumatologia"
            className="rounded-full border border-border-subtle bg-surface px-3 py-1 font-medium text-ink-soft transition hover:border-brand-600 hover:text-brand-800"
          >
            Traumatología
          </Link>
        </div>
      </section>

      {/* 2. ACCIONES RÁPIDAS EN URGENCIAS */}
      <section aria-labelledby="acciones-rapidas" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <h2 id="acciones-rapidas" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Atención inmediata y necesidades urgentes
            </h2>
            <p className="text-sm text-ink-mute">
              Accesos directos prioritarios para situaciones críticas desde tu celular.
            </p>
          </div>
          <Link
            href="/veterinarias"
            className="text-xs font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Ver todas las clínicas &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EMERGENCY_ACTIONS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md ${item.accent}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl select-none" aria-hidden="true">
                    {item.icon}
                  </span>
                  <Badge tone={item.badgeTone}>{item.badge}</Badge>
                </div>
                <h3 className="text-lg font-bold text-ink group-hover:text-brand-800">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-ink-soft">
                  {item.description}
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-brand-700">
                <span>Explorar disponibles</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. EXPLORA POR COMUNA (TOUCH TARGET 44PX) */}
      <section aria-labelledby="comunas-titulo" className="space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 id="comunas-titulo" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Explora clínicas por comuna
          </h2>
          <p className="text-sm text-ink-mute">
            Encuentra veterinarias cercanas en las principales localidades de la Región del Biobío.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {COMMUNES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/veterinarias?commune=${c.slug}`}
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
          {POPULAR_SERVICES.map((serv) => (
            <Link key={serv.title} href={serv.href} className="group">
              <Card hoverable className="h-full p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-xl" aria-hidden="true">
                    {serv.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-bold text-ink group-hover:text-brand-700">
                      {serv.title}
                    </h3>
                    <p className="text-xs text-ink-mute leading-relaxed">
                      {serv.desc}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. PILARES DE CONFIANZA & VALOR DIFERENCIAL */}
      <section aria-labelledby="confianza-titulo" className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
        <div className="mx-auto max-w-2xl text-center space-y-2">
          <h2 id="confianza-titulo" className="text-2xl font-bold text-ink">
            Por qué confiar en la información de VetBiobío
          </h2>
          <p className="text-sm text-ink-soft">
            Construimos un directorio independiente pensado para dueños de mascotas, con estándares de verificación territorial.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <h3 className="font-bold text-ink text-base">Verificación en Terreno</h3>
            <p className="text-xs text-ink-mute leading-relaxed">
              No indexamos datos a ciegas. Cada ficha atraviesa un proceso de cotejo telefónico, presencial o con fuentes sanitarias del establecimiento.
            </p>
          </div>

          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="text-2xl" aria-hidden="true">💰</span>
            <h3 className="font-bold text-ink text-base">Aranceles Transparentes</h3>
            <p className="text-xs text-ink-mute leading-relaxed">
              Publicamos precios referenciales con fecha de confirmación. Ayudamos a planificar los costos veterinarios sin cobros imprevistos.
            </p>
          </div>

          <div className="rounded-xl bg-surface-alt p-5 space-y-2">
            <span className="text-2xl" aria-hidden="true">⚖️</span>
            <h3 className="font-bold text-ink text-base">Neutralidad Absoluta</h3>
            <p className="text-xs text-ink-mute leading-relaxed">
              Ninguna clínica puede pagar para subir su puntaje de confiabilidad o esconder valoraciones. El orden responde a criterios de frescura y servicio.
            </p>
          </div>
        </div>
      </section>

      {/* 6. LLAMADO A LA COMUNIDAD */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-bold text-brand-900">
            ¿Detectaste un dato desactualizado o una clínica no registrada?
          </h2>
          <p className="text-xs sm:text-sm text-brand-800 leading-relaxed">
            VetBiobío crece con el aporte de la comunidad. Envía una actualización de horarios o precios para beneficio de todos los dueños de mascotas.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/aportar">
            <Button variant="primary" size="md">
              Aportar información
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
