import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/chrome';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Acerca de VetBiobío y Metodología Territorial',
    description:
      'Conoce cómo verificamos la información de clínicas veterinarias en el Biobío: metodología de terreno, independencia editorial y transparencia de aranceles.',
    alternates: { canonical: '/acerca' },
  };
}

export default function AcercaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-4">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Inicio' },
          { label: 'Acerca de VetBiobío' },
        ]}
      />

      {/* Cabecera */}
      <header className="space-y-3 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-2">
          <Badge tone="brand">Transparencia e Independencia</Badge>
          <span className="text-xs text-ink-mute">Región del Biobío, Chile</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Acerca de VetBiobío
        </h1>
        <p className="text-base text-ink-soft sm:text-lg leading-relaxed">
          Iniciativa comunitaria e independiente diseñada para acercar información clara,
          verificada y territorial de servicios veterinarios a las familias y tutores de mascotas de la región.
        </p>
      </header>

      {/* Propósito y Contexto */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">Nuestra Misión</h2>
        <p className="text-sm text-ink-soft leading-relaxed sm:text-base">
          En momentos de urgencia médica o al planificar el cuidado de un animal de compañía,
          la falta de datos claros sobre horarios reales, guardias de 24 horas y aranceles referenciales
          genera incertidumbre. VetBiobío nació para ordenar ese ecosistema de manera pública y sin sesgo comercial.
        </p>
      </section>

      {/* SECCIÓN METODOLOGÍA (§23) */}
      <section id="metodologia" className="scroll-mt-20 space-y-6">
        <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-brand-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
              M
            </span>
            <h2 className="text-2xl font-bold">Metodología de Verificación Territorial</h2>
          </div>
          <p className="mt-2 text-sm text-brand-950 leading-relaxed sm:text-base">
            Para garantizar que los tutores no se encuentren con puertas cerradas o cobros sorpresa,
            cada registro publicado en este directorio se somete a un protocolo de confirmación estructurado.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {/* 1. Verificado */}
            <Card className="p-5 space-y-2 bg-surface">
              <span className="inline-block rounded-md bg-status-verified-bg px-2.5 py-1 text-xs font-bold text-status-verified-text border border-status-verified-border">
                ✓ Estado Verificado
              </span>
              <h3 className="text-base font-bold text-ink">¿Qué significa?</h3>
              <p className="text-xs text-ink-soft leading-relaxed sm:text-sm">
                La clínica cuenta con confirmación directa mediante llamado telefónico, visita presencial
                en terreno o documentación sanitaria contrastada con registros del SAG y municipalidades.
              </p>
            </Card>

            {/* 2. Puntaje de confiabilidad */}
            <Card className="p-5 space-y-2 bg-surface">
              <span className="inline-block rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 border border-brand-200">
                ★ Puntaje Confiabilidad
              </span>
              <h3 className="text-base font-bold text-ink">Índice 0 a 100</h3>
              <p className="text-xs text-ink-soft leading-relaxed sm:text-sm">
                Calculado algorítmicamente según tres factores: completitud de datos (teléfono, dirección, coordenadas),
                frescura de la última confirmación de precios y número de fuentes directas acreditadas.
              </p>
            </Card>

            {/* 3. Ciclo de actualización */}
            <Card className="p-5 space-y-2 bg-surface">
              <span className="inline-block rounded-md bg-status-outdated-bg px-2.5 py-1 text-xs font-bold text-status-outdated-text border border-status-outdated-border">
                ◷ Ciclo de 180 Días
              </span>
              <h3 className="text-base font-bold text-ink">Caducidad Activa</h3>
              <p className="text-xs text-ink-soft leading-relaxed sm:text-sm">
                Si un dato no recibe re-verificación tras 6 meses, pasa automáticamente a estado
                «En revisión» o «Posiblemente desactualizado» para alertar al usuario antes de acudir.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* AVISO LEGAL Y EXENCIÓN DE RESPONSABILIDAD MÉDICA */}
      <section
        aria-labelledby="disclaimer-titulo"
        className="rounded-2xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8 space-y-3"
      >
        <div className="flex items-center gap-2 text-amber-900">
          <svg
            className="h-6 w-6 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 id="disclaimer-titulo" className="text-lg font-bold">
            Aviso Importante: No Constituye Certificación Médica
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
          VetBiobío es un directorio informativo y orientativo. La inclusión de un establecimiento o la etiqueta de
          «Verificado» acredita exclusivamente la existencia operativa y la consistencia de los datos reportados
          al momento del cotejo; <strong>en ningún caso constituye una certificación de calidad médica veterinaria</strong>,
          aval profesional ni recomendación clínica.
        </p>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          Toda decisión sobre tratamientos, intervenciones quirúrgicas o consultas debe ser evaluada directamente por el tutor
          con el médico veterinario tratante habilitado. Los aranceles son siempre referenciales y pueden variar según la complejidad
          del paciente, insumos utilizados o recargos de horario nocturno y días feriados.
        </p>
      </section>

      {/* CTA Colaborativo */}
      <section className="rounded-xl border border-border-subtle bg-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-ink">¿Quieres aportar o corregir un dato?</h2>
          <p className="text-xs sm:text-sm text-ink-mute">
            El directorio se enriquece permanentemente con la colaboración activa de la comunidad y de los propios equipos veterinarios.
          </p>
        </div>
        <div className="shrink-0">
          <ButtonLink href="/aportar" variant="primary">
            Aportar información
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
