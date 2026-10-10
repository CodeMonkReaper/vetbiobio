'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { fetchClinic } from '@/lib/api';
import { AdminClinicHeader } from '@/components/admin/AdminClinicHeader';
import { Card } from '@/components/ui/display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/fields';

type Photo = {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
};

export default function AdminFotos() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Cargando módulo fotográfico...
        </div>
      }
    >
      <FotosInner />
    </Suspense>
  );
}

function FotosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('clinica') ?? '';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Formulario para adjuntar
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [altText, setAltText] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchClinic(slug);
      const list = (res?.data?.photos as Photo[]) || [];
      setPhotos(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) void load();
  }, [load, slug]);

  // Marcar una foto existente como portada principal
  async function setAsPrimary(photo: Photo) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await adminApi('/admin/media/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicSlug: slug,
          url: photo.url,
          altText: photo.alt_text,
          makePrimary: true,
        }),
      });
      setSuccess('Foto de portada actualizada con éxito.');
      await load();
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Subir archivo local vía Cloudinary
  async function handleUploadFile() {
    if (!selectedFile) return;
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      // 1) Firma server-side
      const sign = (await adminApi('/admin/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })) as {
        cloudName: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
      };

      // 2) Subida directa a Cloudinary
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', String(sign.timestamp));
      fd.append('signature', sign.signature);
      fd.append('folder', sign.folder);

      const up = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: 'POST', body: fd }
      );
      if (!up.ok) throw new Error('La subida de imagen a Cloudinary falló');
      const done = (await up.json()) as { secure_url: string; public_id: string };

      // 3) Adjuntar a la clínica
      await adminApi('/admin/media/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicSlug: slug,
          url: done.secure_url,
          publicId: done.public_id,
          altText: altText || null,
          makePrimary,
        }),
      });

      setSelectedFile(null);
      setPreviewFile(null);
      setAltText('');
      setMakePrimary(false);
      setSuccess('Fotografía subida y vinculada exitosamente.');
      await load();
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Vincular por URL directa
  async function handleAttachUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await adminApi('/admin/media/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicSlug: slug,
          url: urlInput.trim(),
          altText: altText.trim() || null,
          makePrimary,
        }),
      });

      setUrlInput('');
      setAltText('');
      setMakePrimary(false);
      setSuccess('Fotografía vinculada exitosamente a la clínica.');
      await load();
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') router.push('/admin/login');
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <AdminClinicHeader
        title="Galería Fotográfica y Fachadas"
        subtitle="Administra las imágenes de portada, instalaciones y salas de atención de la veterinaria."
      >
        {/* Notificaciones */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-500 hover:text-rose-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="text-emerald-500 hover:text-emerald-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Galería de imágenes existentes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Galería Registrada ({photos.length} fotos)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Las imágenes se muestran en la ficha pública y en los resultados de búsqueda.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Cargando galería fotográfica...
                </div>
              ) : photos.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No hay fotografías registradas aún para esta clínica.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {photos.map((p, idx) => (
                    <Card
                      key={`${p.url}-${idx}`}
                      className="overflow-hidden border border-slate-200 bg-white group flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                        <Image
                          src={p.url}
                          alt={p.alt_text || 'Fotografía de clínica'}
                          fill
                          sizes="(max-width: 640px) 100vw, 350px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {p.is_primary && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge tone="success" size="sm">
                              ★ Portada Principal
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {p.alt_text || 'Sin texto alternativo'}
                          </div>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-700 hover:underline break-all line-clamp-1 mt-0.5"
                          >
                            {p.url}
                          </a>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {!p.is_primary ? (
                            <button
                              type="button"
                              onClick={() => void setAsPrimary(p)}
                              disabled={busy}
                              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition"
                            >
                              ★ Marcar como Portada
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Foto de Cabecera
                            </span>
                          )}

                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                          >
                            Ver HD ↗
                          </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel para agregar fotografía */}
          <div className="space-y-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📸</span>
                  <span>Agregar Fotografía</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sube un archivo desde tu dispositivo o ingresa una URL web certificada (HTTPS).
                </p>
              </div>

              {/* Selector de modo */}
              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode('url')}
                  className={`flex-1 py-1.5 rounded-md transition ${
                    mode === 'url' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  🔗 Por URL Directa
                </button>
                <button
                  type="button"
                  onClick={() => setMode('file')}
                  className={`flex-1 py-1.5 rounded-md transition ${
                    mode === 'file' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  📁 Subir Archivo
                </button>
              </div>

              {mode === 'url' ? (
                <form onSubmit={(e) => void handleAttachUrl(e)} className="space-y-4">
                  <Field label="URL de la Imagen (HTTPS)" htmlFor="photo-url" required>
                    <Input
                      id="photo-url"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      required
                    />
                  </Field>

                  <Field label="Texto Alternativo (Accesibilidad)" htmlFor="photo-alt">
                    <Input
                      id="photo-alt"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Ej: Fachada principal de la clínica en Concepción"
                    />
                  </Field>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={makePrimary}
                      onChange={(e) => setMakePrimary(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Establecer como foto de portada principal</span>
                  </label>

                  {/* Previsualización si hay URL válida */}
                  {urlInput.startsWith('https://') && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-600">Vista previa:</div>
                      <div className="relative aspect-4/3 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={urlInput}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    disabled={busy || !urlInput.trim()}
                  >
                    {busy ? 'Guardando imagen...' : 'Vincular Fotografía'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <Field label="Seleccionar archivo de imagen" htmlFor="photo-file" required>
                    <input
                      id="photo-file"
                      type="file"
                      accept="image/*"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewFile(URL.createObjectURL(file));
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </Field>

                  <Field label="Texto Alternativo (Accesibilidad)" htmlFor="file-alt">
                    <Input
                      id="file-alt"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Ej: Quirófano veterinario de alta resolución"
                    />
                  </Field>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={makePrimary}
                      onChange={(e) => setMakePrimary(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Establecer como foto de portada principal</span>
                  </label>

                  {previewFile && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-600">Vista previa local:</div>
                      <div className="relative aspect-4/3 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={previewFile}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full justify-center"
                    disabled={busy || !selectedFile}
                    onClick={() => void handleUploadFile()}
                  >
                    {busy ? 'Subiendo a Cloudinary...' : 'Subir y Publicar Fotografía'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </AdminClinicHeader>
    </main>
  );
}
