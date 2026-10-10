'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/fields';
import { Alert } from '@/components/ui/display';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (res.status === 429) {
          setError('Demasiados intentos fallidos. Por seguridad, espera unos minutos.');
        } else {
          setError('No fue posible conectar con el servidor. Intenta de nuevo más tarde.');
        }
        setIsLoading(false);
        return;
      }

      router.push('/admin');
    } catch {
      setError('Error de conexión con el servicio de autenticación.');
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-canvas">
      {/* Elementos decorativos de fondo acordes al diseño de la marca */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(#146354_1.5px,transparent_1.5px)] [background-size:16px_16px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-md">
        {/* Cabecera de la Marca y Portal */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-md shadow-brand-900/10 ring-4 ring-brand-100 transition-transform hover:scale-105">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200/80 px-3 py-0.5 text-xs font-semibold text-brand-800">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" aria-hidden="true" />
              Portal Administrativo
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Iniciar Sesión
            </h1>
            <p className="mt-1 text-sm text-ink-mute">
              Gestión y moderación territorial de VetBiobío
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="mt-8 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card sm:p-8 space-y-6">
          {error && (
            <Alert tone="error" title="No se pudo iniciar sesión">
              {error}
            </Alert>
          )}

          <form onSubmit={submit} className="space-y-5" noValidate>
            <Field
              label="Correo electrónico"
              htmlFor="email"
              required
              hint="Usa tu cuenta autorizada de moderador o administrador"
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="operador@vetbiobio.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="password"
              required
              hint="Mínimo 8 caracteres"
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-mute hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 focus-visible:rounded"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold shadow-sm"
            >
              Entrar al Panel
            </Button>
          </form>

          {/* Información de Seguridad y Auditoría */}
          <div className="rounded-xl border border-border-subtle bg-surface-alt p-3.5 text-xs text-ink-mute space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-ink-soft">
              <span aria-hidden="true">🛡️</span>
              <span>Seguridad y Auditoría Activa</span>
            </div>
            <p>
              Toda sesión y acción administrativa es registrada con sello de tiempo e identidad para cumplir con la Ley 19.628 de Protección de Datos.
            </p>
          </div>
        </div>

        {/* Enlace de regreso al sitio público */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 focus-visible:rounded"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Volver al buscador público de VetBiobío</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
