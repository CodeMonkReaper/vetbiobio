'use client';

import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function beacon(slug: string | undefined, type: string) {
  const body = JSON.stringify({ clinicSlug: slug, type });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(`${API}/events`, new Blob([body], { type: 'application/json' }));
  } else {
    void fetch(`${API}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  }
}

// Vista de perfil: un evento por montaje. Sin PII (sin IP/cookies propias).
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    beacon(slug, 'clinic_profile_view');
  }, [slug]);
  return null;
}

// Enlace de contacto con tracking (tel/wa/web). No bloquea la navegación.
export function ContactLink({ href, slug, type, children, external }: {
  href: string; slug: string; type: 'phone_click' | 'whatsapp_click' | 'website_click';
  children: React.ReactNode; external?: boolean;
}) {
  return (
    <a href={href} onClick={() => beacon(slug, type)} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {children}
    </a>
  );
}
