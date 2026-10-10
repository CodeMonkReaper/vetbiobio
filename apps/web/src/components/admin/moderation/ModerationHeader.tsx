'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '../icons/AdminIcons';

interface ModerationHeaderProps {
  trackingCode: string;
  status: string;
  type: string;
  typeLabel: string;
  createdAt: string;
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onSave?: () => void;
  savingData?: boolean;
}

export function ModerationHeader({
  trackingCode,
  status,
  typeLabel,
  createdAt,
  isDirty,
  saveStatus,
  onSave,
  savingData = false,
}: ModerationHeaderProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-verified-border bg-status-verified-bg px-3 py-1 text-xs font-semibold text-status-verified-text">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Aprobado y publicado</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-3 py-1 text-xs font-semibold text-status-danger-text">
            <XCircleIcon className="w-4 h-4" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-outdated-border bg-status-outdated-bg px-3 py-1 text-xs font-semibold text-status-outdated-text">
            <ClockIcon className="w-4 h-4" />
            <span>Pendiente de moderación</span>
          </span>
        );
    }
  };

  const formattedDate = new Date(createdAt).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <header className="space-y-4">
      {/* Breadcrumb & Navigation */}
      <nav aria-label="Navegación contextual" className="flex items-center justify-between text-xs text-ink-mute">
        <Link
          href="/admin/aportes"
          className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 rounded-sm py-1"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Volver a la bandeja de aportes</span>
        </Link>
        <span className="hidden sm:inline font-mono text-[11px] bg-surface-alt px-2 py-0.5 rounded border border-border-subtle">
          ID: {trackingCode}
        </span>
      </nav>

      {/* Main Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
              Aporte <span className="font-mono text-brand-700">#{trackingCode}</span>
            </h1>
            {getStatusBadge()}
            <span className="inline-flex items-center rounded-md bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-soft border border-border-subtle">
              {typeLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-mute flex items-center gap-2">
            <span>Recibido el {formattedDate}</span>
          </p>
        </div>

        {/* Save State Indicator */}
        {status === 'PENDING' && (
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                Guardando en el servidor...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                Guardado correctamente
              </span>
            )}
            {isDirty && saveStatus !== 'saving' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Cambios locales sin guardar
              </span>
            )}
            {onSave && isDirty && (
              <button
                type="button"
                onClick={onSave}
                disabled={savingData}
                className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 transition disabled:opacity-50 shadow-sm"
              >
                {savingData ? 'Guardando...' : 'Guardar borrador'}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
