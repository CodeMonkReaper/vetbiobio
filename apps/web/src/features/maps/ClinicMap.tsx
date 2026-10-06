'use client';

import { useEffect, useRef } from 'react';
import { MapEmbed } from './MapEmbed';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapa interactivo Mapbox GL (solo cliente). Sin token → fallback OSM (MapEmbed).
export function ClinicMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TOKEN || !ref.current) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;
    void import('mapbox-gl').then((module) => {
      if (cancelled || !ref.current) return;
      const mapboxgl = module.default;
      mapboxgl.accessToken = TOKEN;
      const created = new mapboxgl.Map({
        container: ref.current as HTMLElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
      });
      new mapboxgl.Marker().setLngLat([lng, lat]).addTo(created);
      map = created;
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  if (!TOKEN) return <MapEmbed lat={lat} lng={lng} label={label} />;
  return (
    <div>
      <div ref={ref} style={{ width: '100%', height: 300 }} role="img" aria-label={`Mapa: ${label}`} />
      <link href="https://api.mapbox.com/mapbox-gl-js/v3/mapbox-gl.css" rel="stylesheet" />
    </div>
  );
}
