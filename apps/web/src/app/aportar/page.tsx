'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function AportarContent() {
  const searchParams = useSearchParams();
  const defaultClinic = searchParams?.get('clinica') ?? '';

  const [formData, setFormData] = useState({
    type: defaultClinic ? 'UPDATE_CLINIC' : 'NEW_CLINIC',
    clinicName: defaultClinic,
    message: '',
    evidenceUrl: '',
    submitterName: '',
    submitterEmail: '',
    hasConsent: false,
    payloadText: '',
  });

  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [trackingCode, setTrackingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    setErrorMessage('');

    try {
      const payloadObj: Record<string, any> = {
        detalle: formData.payloadText,
      };
      if (formData.clinicName) {
        payloadObj.clinicReference = formData.clinicName;
      }

      const response = await fetch(`${API}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          message: formData.message || undefined,
          evidenceUrl: formData.evidenceUrl || undefined,
          submitterName: formData.submitterName || undefined,
          submitterEmail: formData.submitterEmail || undefined,
          hasConsent: formData.hasConsent,
          payload: payloadObj,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Error al procesar el aporte');
      }

      const data = await response.json();
      setTrackingCode(data.trackingCode);
      setStatus('SUCCESS');
    } catch (error) {
      setErrorMessage((error as Error).message);
      setStatus('ERROR');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
        <span className="text-5xl block">🎉</span>
        <h1 className="text-2xl font-bold text-slate-900">¡Aporte Ciudadano Recibido!</h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Gracias por colaborar con la comunidad de la Región del Biobío. Un administrador revisará la información antes de ser publicada.
        </p>

        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl max-w-sm mx-auto">
          <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Código de Seguimiento</p>
          <p className="text-3xl font-mono font-extrabold text-emerald-600 mt-1 select-all">{trackingCode}</p>
          <p className="text-[11px] text-slate-400 mt-2">
            Guarda este código para consultar el estado de tu aporte.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => {
              setStatus('IDLE');
              setFormData({
                type: 'OTHER',
                clinicName: '',
                message: '',
                evidenceUrl: '',
                submitterName: '',
                submitterEmail: '',
                hasConsent: false,
                payloadText: '',
              });
            }}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Enviar otro aporte
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 p-6 sm:p-10 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-8 font-sans">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
          <span>🤝</span> Colaboración Abierta
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Aportar Información de Veterinarias</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          ¿Conoces una nueva clínica, precios actualizados, cambios de horario o un cierre definitivo?
          Envíanos los datos para mantener el mapa del Biobío fidedigno y al día. Todo aporte pasa por revisión administrativa.
        </p>
      </div>

      {status === 'ERROR' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {errorMessage || 'Ocurrió un error al enviar el aporte. Por favor intenta nuevamente.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Tipo de Aporte o Solicitud *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="NEW_CLINIC">🏥 Registrar Nueva Veterinaria</option>
            <option value="UPDATE_CLINIC">📝 Actualizar Datos de Clínica Existente</option>
            <option value="UPDATE_PRICE">💰 Informar Precios o Tarifas de Servicios</option>
            <option value="NEW_SERVICE">🩺 Informar Nuevo Servicio o Especialidad</option>
            <option value="REPORT_CLOSURE">⛔ Reportar Cierre Definitivo</option>
            <option value="NEW_PROMOTION">🎁 Promoción o Campaña de Vacunación</option>
            <option value="CORRECT_DATA">🔍 Corregir Ubicación o Contacto</option>
            <option value="OTHER">💬 Otro Tipo de Información</option>
          </select>
        </div>

        {/* Clinic Reference if updating */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Nombre de la Clínica o Sucursal
          </label>
          <input
            type="text"
            name="clinicName"
            value={formData.clinicName}
            onChange={handleChange}
            placeholder="Ej: Clínica Veterinaria Concepción, o Dr. Pérez"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Information Payload */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Información que deseas registrar o modificar *
          </label>
          <textarea
            name="payloadText"
            required
            value={formData.payloadText}
            onChange={handleChange}
            rows={4}
            placeholder="Escribe los datos: dirección exacta, teléfono, WhatsApp, nuevos precios de consulta, si atienden 24 horas, etc..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Evidence Link */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Enlace o Fuente de Verificación (Opcional)
          </label>
          <input
            type="url"
            name="evidenceUrl"
            value={formData.evidenceUrl}
            onChange={handleChange}
            placeholder="https://instagram.com/clinica... o enlace a publicación"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Un enlace a redes sociales oficiales o sitio web agiliza enormemente la verificación del administrador.
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Nota o Mensaje para el Administrador (Opcional)
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={2}
            placeholder="¿Algo adicional que debamos saber al revisar?"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Contact info (Ley 19.628) */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Tus Datos de Contacto (Opcionales)</span>
            <span className="text-[11px] text-slate-500">Ley 19.628 Protección de Datos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tu Nombre o Alias</label>
              <input
                type="text"
                name="submitterName"
                value={formData.submitterName}
                onChange={handleChange}
                placeholder="Ej: Macarena"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tu Correo Electrónico</label>
              <input
                type="email"
                name="submitterEmail"
                value={formData.submitterEmail}
                onChange={handleChange}
                placeholder="contacto@ejemplo.cl"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {formData.submitterEmail && (
            <label className="flex items-start gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasConsent"
                checked={formData.hasConsent}
                onChange={handleChange}
                required
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <span className="text-xs text-slate-600">
                Autorizo a los administradores de VetBiobío a usar este correo exclusivamente para resolver dudas sobre mi aporte.
              </span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={status === 'LOADING' || (!!formData.submitterEmail && !formData.hasConsent)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'LOADING' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando información...</span>
              </>
            ) : (
              <span>🚀 Enviar Aporte para Revisión</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AportarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <AportarContent />
    </Suspense>
  );
}
