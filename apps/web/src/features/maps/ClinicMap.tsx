'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapEmbed } from './MapEmbed';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Diseño seguro: contenedor con aspect-ratio fijo (nunca colapsa), estados
// loading/error con fallback, atribución de Mapbox siempre visible (ToS).
export function ClinicMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!TOKEN || !ref.current) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;
    void import('mapbox-gl')
      .then((module) => {
        if (cancelled || !ref.current) return;
        const mapboxgl = module.default;
        mapboxgl.accessToken = TOKEN;
        const created = new mapboxgl.Map({
          container: ref.current as HTMLElement,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: 15,
        });
        created.on('error', () => {
          if (!cancelled) setFailed(true);
        });
        new mapboxgl.Marker({ color: '#177c67' }).setLngLat([lng, lat]).addTo(created);
        map = created;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  if (!TOKEN || failed) return <MapEmbed lat={lat} lng={lng} label={label} />;

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="relative aspect-video w-full bg-paper">
        <div
          ref={ref}
          role="img"
          aria-label={`Mapa: ${label}`}
          className="!absolute !inset-0 [&_canvas]:h-full [&_canvas]:w-full"
        />
      </div>
      <figcaption className="flex items-center justify-between px-4 py-2 text-sm text-ink-soft">
        <span>{label}</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-brand-700"
        >
          Ver mapa ampliado
        </a>
      </figcaption>
    </figure>
  );
}
