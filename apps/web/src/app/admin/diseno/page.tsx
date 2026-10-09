'use client';

import { useState, useRef } from 'react';
import {
  Button,
  Badge,
  VerificationBadge,
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  Card,
  PriceDisplay,
  FromPrice,
  Skeleton,
  Alert,
  Empty,
  Pagination,
  Modal,
} from '@/components/ui';

export default function DisenoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const modalTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="space-y-12 pb-16">
      {/* Encabezado */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Sistema de Diseño VetBiobío
            </h1>
            <p className="mt-1 text-base text-ink-mute">
              Catálogo de componentes base accesibles y tokens semánticos (WCAG 2.2 AA, Dirección B &quot;Cálido y Confiable&quot;).
            </p>
          </div>
          <Badge tone="brand">Fase 2 / Tokens &amp; Componentes</Badge>
        </div>
        <hr className="mt-6 border-border-subtle" />
      </div>

      {/* 1. Muestra de Colores & Contraste WCAG */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">1. Tokens de Color &amp; Contraste Calculado</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded bg-brand-600 shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">brand-600 (#177c67)</p>
            <p className="text-[11px] text-ink-mute">Acción Primaria (4.91:1)</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded bg-brand-700 shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">brand-700 (#146354)</p>
            <p className="text-[11px] text-ink-mute">Foco Visible (6.31:1)</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded bg-ink shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">ink (#122335)</p>
            <p className="text-[11px] text-ink-mute">Texto Principal (14.83:1)</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded bg-ink-soft shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">ink-soft (#33475b)</p>
            <p className="text-[11px] text-ink-mute">Texto Secundario (8.24:1)</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded bg-ink-mute shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">ink-mute (#4a6177)</p>
            <p className="text-[11px] text-ink-mute">Texto Metadato (5.61:1)</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <div className="h-12 w-full rounded border border-border bg-paper shadow-sm" />
            <p className="mt-2 text-xs font-semibold text-ink">paper (#f8faf9)</p>
            <p className="text-[11px] text-ink-mute">Fondo General</p>
          </div>
        </div>
      </section>

      {/* 2. Botones */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">2. Botones (Área Táctil &ge; 44px)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="primary" disabled>Deshabilitado</Button>
          <Button
            variant="primary"
            isLoading={btnLoading}
            onClick={() => {
              setBtnLoading(true);
              setTimeout(() => setBtnLoading(false), 2000);
            }}
          >
            {btnLoading ? 'Guardando...' : 'Probar Loading'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="sm" variant="secondary">Pequeño (sm)</Button>
          <Button size="md" variant="secondary">Mediano (md)</Button>
          <Button size="lg" variant="primary">Grande (lg)</Button>
        </div>
      </section>

      {/* 3. Badges & Estados de Verificación (§15) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">3. Insignias de Verificación (§15 Doble Codificación)</h2>
        <p className="text-sm text-ink-soft">
          Nunca transmiten información únicamente mediante color. Incluyen símbolos reconocibles y texto explícito.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <VerificationBadge status="VERIFIED" verifiedAt="2026-10-06T12:00:00Z" />
          <VerificationBadge status="PENDING_REVIEW" />
          <VerificationBadge status="OUTDATED" verifiedAt="2024-05-10T00:00:00Z" />
          <VerificationBadge status="UNVERIFIED" />
          <VerificationBadge status="REJECTED" />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge tone="neutral">Etiqueta Neutral</Badge>
          <Badge tone="brand">Biobío</Badge>
          <Badge tone="success">Abierto Ahora</Badge>
          <Badge tone="warning">Urgencias</Badge>
          <Badge tone="info">Exóticos</Badge>
          <Badge tone="error">Crítico</Badge>
        </div>
      </section>

      {/* 4. Formulario y Campos */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">4. Entradas Accesibles (Labels, Hints y Errores ARIA)</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold text-ink mb-4">Campos de Texto y Selección</h3>
            <div className="space-y-4">
              <Field
                label="Nombre de la clínica"
                htmlFor="demo-clinic-name"
                required
                hint="Nombre oficial o de fantasía del establecimiento"
              >
                <Input id="demo-clinic-name" placeholder="Ej: Clínica Los Boldos" />
              </Field>

              <Field
                label="Comuna territorial"
                htmlFor="demo-clinic-comuna"
                required
              >
                <Select id="demo-clinic-comuna" defaultValue="concepcion">
                  <option value="concepcion">Concepción</option>
                  <option value="talcahuano">Talcahuano</option>
                  <option value="san-pedro">San Pedro de la Paz</option>
                  <option value="los-angeles">Los Ángeles</option>
                </Select>
              </Field>

              <Field
                label="Correo de contacto con error"
                htmlFor="demo-clinic-email"
                required
                error="El formato del correo ingresado no es válido"
              >
                <Input
                  id="demo-clinic-email"
                  defaultValue="contacto@invalido"
                  hasError
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-ink mb-4">Áreas de Texto y Checkboxes Táctiles (44px)</h3>
            <div className="space-y-4">
              <Field
                label="Observaciones sobre aranceles"
                htmlFor="demo-notes"
                hint="Indica si los valores corresponden a horario hábil o urgencia"
              >
                <Textarea
                  id="demo-notes"
                  placeholder="Detalles sobre recargo nocturno o formas de pago..."
                />
              </Field>

              <div className="pt-2 border-t border-border-subtle">
                <Checkbox
                  id="demo-urgencias"
                  label="Atención de urgencia 24 horas"
                  description="Cuenta con médico veterinario presencial de guardia permanente."
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />
                <Checkbox
                  id="demo-hospital"
                  label="Servicio de hospitalización diurna y nocturna"
                  description="Instalaciones para monitoreo continuo de pacientes."
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 5. Precios & Números Tabulares */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">5. Precios y Números Tabulares (§16)</h2>
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-alt p-4">
              <span className="block text-xs text-ink-mute uppercase font-semibold">Consulta General (Exacto)</span>
              <div className="mt-1 text-xl font-bold">
                <PriceDisplay min={18000} max={null} type="FIXED" />
              </div>
            </div>
            <div className="rounded-lg bg-surface-alt p-4">
              <span className="block text-xs text-ink-mute uppercase font-semibold">Ecografía Abdominal (Rango)</span>
              <div className="mt-1 text-xl font-bold">
                <PriceDisplay min={32000} max={48000} type="RANGE" />
              </div>
            </div>
            <div className="rounded-lg bg-surface-alt p-4">
              <span className="block text-xs text-ink-mute uppercase font-semibold">Vacunación Séxtuple (Desde)</span>
              <div className="mt-1 text-xl font-bold">
                <FromPrice min={15000} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. Alertas y Estados */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">6. Alertas con Íconos Vectoriales &amp; Skeleton</h2>
        <div className="space-y-3">
          <Alert tone="info" title="Información territorial">
            Los datos de esta veterinaria fueron actualizados según ficha de registro regional.
          </Alert>
          <Alert tone="warning" title="Horario especial por festivo">
            Recomendamos llamar previamente al establecimiento antes de concurrir de emergencia.
          </Alert>
          <Alert tone="success" title="Verificación confirmada">
            El personal veterinario confirmó aranceles presencialmente en terreno.
          </Alert>
          <Alert tone="error" title="Establecimiento cerrado">
            Esta clínica notificó cese de operaciones de urgencia hasta nuevo aviso.
          </Alert>
        </div>
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-ink-soft mb-2">Esqueletos de Carga (Reduced-motion safe):</h3>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </section>

      {/* 7. Modal Accesible Interactivo */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">7. Diálogo Modal Accesible (Focus Trap &amp; Escape)</h2>
        <Card className="p-5">
          <p className="text-sm text-ink-soft mb-4">
            Diálogo con trampa de foco, cierre con teclado (Escape), anuncio de rol dialog para lectores de pantalla y restauración de foco.
          </p>
          <Button
            ref={modalTriggerRef}
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            Abrir Modal de Confiabilidad
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="¿Cómo calculamos la confiabilidad?"
            description="Explicación metodológica del índice territorial de VetBiobío."
            triggerRef={modalTriggerRef}
          >
            <div className="space-y-4 text-sm text-ink-soft">
              <p>
                El puntaje de confiabilidad <strong>no es una certificación médica</strong> de calidad clínica. Refleja la frescura de los datos, la presencia de aranceles referenciales y la confirmación directa del horario.
              </p>
              <div className="rounded-lg bg-surface-alt p-3 border border-border-subtle">
                <p className="font-semibold text-ink">Criterios ponderados:</p>
                <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                  <li>Verificación presencial o directa (&le; 90 días)</li>
                  <li>Teléfono de urgencia validado activamente</li>
                  <li>Lista de precios publicada y fechada</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </Modal>
        </Card>
      </section>

      {/* 8. Paginación Accesible */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">8. Paginación Semántica y Accesible</h2>
        <Card className="p-4">
          <Pagination page={2} totalPages={6} base="comuna=concepcion&sort=confiabilidad" />
        </Card>
      </section>

      {/* 9. Estado Vacío */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">9. Estado Vacío Ilustrado</h2>
        <Empty
          title="No encontramos clínicas con estos filtros"
          description="Intenta ampliar la comuna o quitar el filtro de urgencias 24 horas."
          hints={[
            'Verifica la ortografía del nombre o sector',
            'Prueba seleccionando una comuna vecina del Gran Concepción',
          ]}
          action={<Button variant="secondary">Limpiar filtros de búsqueda</Button>}
        />
      </section>
    </div>
  );
}
