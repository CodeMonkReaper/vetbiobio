export async function generateMetadata() {
  return {
    title: 'Política de privacidad | VetBiobío',
    alternates: { canonical: '/privacidad' },
  };
}

// BORRADOR sin revisión jurídica (Ley 19.628). No usar en producción sin abogado.
export default function Privacidad() {
  return (
    <main className="max-w-3xl mx-auto my-12 px-6 py-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-slate-700 font-sans leading-relaxed">
      <h1 className="text-3xl font-bold text-slate-900">Política de Privacidad y Tratamiento de Datos</h1>
      <p className="text-xs text-slate-400">
        Última actualización: octubre 2026. Responsable: Directorio VetBiobío.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">1. Principio: Mínima Recolección</h2>
        <p className="text-sm">
          VetBiobío no crea cuentas públicas para dueños de mascotas ni exige registro obligatorio para buscar,
          comparar o contactar establecimientos veterinarios. Todo contacto se realiza de forma directa entre el usuario y la clínica.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">2. Aportes Ciudadanos y Colaboraciones (Ley 19.628)</h2>
        <p className="text-sm">
          Cualquier persona puede proponer datos sobre veterinarias, precios o servicios mediante nuestro formulario de aportes:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>Datos Opcionales:</strong> El nombre y correo electrónico son completamente voluntarios. Si no se entregan, el aporte se procesa de forma anónima.</li>
          <li><strong>Consentimiento Explicito:</strong> Si el usuario decide suministrar su correo electrónico, se exige una casilla de autorización expresa para que el equipo moderador pueda contactarlo únicamente si se requiere clarificar el aporte.</li>
          <li><strong>Códigos de Seguimiento:</strong> A cada envío se le asigna un identificador público único (ej. <code>VBB-XXXX</code>) que permite consultar el estado de moderación sin exponer en ningún momento la identidad del remitente.</li>
          <li><strong>Seguridad de Datos:</strong> No se almacenan direcciones IP en crudo; se generan resúmenes criptográficos con hash unidireccional.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">3. Datos de Reportes y Navegación</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>Reportes de inconsistencias:</strong> Motivo y detalle técnico, sin solicitud de datos personales.</li>
          <li><strong>Métricas de uso:</strong> Conteo de eventos agregado y anónimo, sin cookies de seguimiento de terceros ni publicidad comportamental.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">4. Cookies Técnicas</h2>
        <p className="text-sm">
          Utilizamos únicamente cookies estrictamente necesarias para la sesión de los administradores y editores autorizados. No utilizamos cookies publicitarias.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">5. Derechos del Titular</h2>
        <p className="text-sm">
          Conforme a la Ley 19.628 sobre protección de la vida privada, puedes solicitar en cualquier momento la modificación o eliminación de datos asociados a tus aportes dirigiéndote a nuestro canal de contacto.
        </p>
      </section>
    </main>
  );
}
