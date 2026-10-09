import type { ClinicProfile } from '@/types/domain';
import { ContactLink } from '@/features/tracking/Track';
import { Card } from '@/components/ui/display';

/**
 * Canales de contacto directo con el establecimiento (§17).
 * Botones con touch target de 44px y estados hover/focus accesibles.
 */
export function ClinicContact({ clinic }: { clinic: ClinicProfile }) {
  if (!clinic.phone && !clinic.whatsapp && !clinic.website && !clinic.email) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Canales de contacto</h2>
        <p className="mt-1 text-sm text-ink-mute">
          Este establecimiento no cuenta con canales de contacto directo informados.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-bold text-ink">Canales de contacto</h2>
        <p className="text-xs text-ink-mute">
          Comunícate directamente con la clínica para confirmar disponibilidad y citas.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {clinic.phone && (
          <ContactLink
            href={`tel:${clinic.phone}`}
            slug={clinic.slug}
            type="phone_click"
            className="flex-1 sm:flex-initial"
          >
            <span className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700">
              <span aria-hidden="true">📞</span>
              <span>Llamar: {clinic.phone}</span>
            </span>
          </ContactLink>
        )}

        {clinic.whatsapp && (
          <ContactLink
            href={`https://wa.me/${clinic.whatsapp.replace('+', '')}`}
            slug={clinic.slug}
            type="whatsapp_click"
            external
            className="flex-1 sm:flex-initial"
          >
            <span className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-emerald-700">
              <span aria-hidden="true">💬</span>
              <span>WhatsApp</span>
            </span>
          </ContactLink>
        )}

        {clinic.website && (
          <ContactLink
            href={clinic.website}
            slug={clinic.slug}
            type="website_click"
            external
            className="flex-1 sm:flex-initial"
          >
            <span className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-border-hover hover:bg-surface-alt focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand-700">
              <span aria-hidden="true">🌐</span>
              <span>Sitio oficial</span>
              <span aria-hidden="true" className="text-xs text-ink-mute">↗</span>
            </span>
          </ContactLink>
        )}
      </div>

      {clinic.email && (
        <div className="pt-2 border-t border-border-subtle text-xs text-ink-soft">
          <span className="font-semibold text-ink">Correo electrónico: </span>
          <a
            href={`mailto:${clinic.email}`}
            className="text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            {clinic.email}
          </a>
        </div>
      )}
    </Card>
  );
}
