import type { ClinicProfile } from '@/types/domain';
import { ContactLink } from '@/features/tracking/Track';

// Contacto directo (tel/WhatsApp/sitio). El contacto ocurre fuera de la plataforma.
export function ClinicContact({ clinic }: { clinic: ClinicProfile }) {
  if (!clinic.phone && !clinic.whatsapp && !clinic.website && !clinic.email) {
    return (
      <section aria-labelledby="contacto">
        <h2 id="contacto" className="text-xl font-semibold">Contacto</h2>
        <p className="text-ink-soft">Información no disponible</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="contacto" className="space-y-2">
      <h2 id="contacto" className="text-xl font-semibold">Contacto</h2>
      <ul className="flex flex-wrap gap-2">
        {clinic.phone && (
          <li>
            <ContactLink
              href={`tel:${clinic.phone}`}
              slug={clinic.slug}
              type="phone_click"
            >
              <span className="inline-block rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
                Llamar
              </span>
            </ContactLink>
          </li>
        )}
        {clinic.whatsapp && (
          <li>
            <ContactLink
              href={`https://wa.me/${clinic.whatsapp.replace('+', '')}`}
              slug={clinic.slug}
              type="whatsapp_click"
              external
            >
              <span className="inline-block rounded border border-slate-300 bg-white px-4 py-2 font-medium hover:border-brand-500">
                WhatsApp
              </span>
            </ContactLink>
          </li>
        )}
        {clinic.website && (
          <li>
            <ContactLink href={clinic.website} slug={clinic.slug} type="website_click" external>
              <span className="inline-block rounded border border-slate-300 bg-white px-4 py-2 font-medium hover:border-brand-500">
                Sitio web
              </span>
            </ContactLink>
          </li>
        )}
      </ul>
      {clinic.email && <p className="text-sm text-ink-soft">{clinic.email}</p>}
    </section>
  );
}
