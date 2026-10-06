export async function generateMetadata() {
  return {
    title: 'Política de privacidad | VetBiobío',
    alternates: { canonical: '/privacidad' },
  };
}

// BORRADOR sin revisión jurídica (Ley 19.628). No usar en producción sin abogado.
export default function Privacidad() {
  return (
    <main>
      <h1>Política de privacidad y cookies (borrador)</h1>
      <p><small>Última actualización: octubre 2026. Responsable: [RAZÓN SOCIAL, RUT, domicilio, EMAIL].</small></p>

      <h2>1. Principio: mínima recolección</h2>
      <p>VetBiobío no crea cuentas de dueños de mascotas y no solicita datos personales para buscar,
      comparar o contactar establecimientos (el contacto ocurre por teléfono/WhatsApp/sitio del
      establecimiento, fuera de esta plataforma).</p>

      <h2>2. Datos que sí tratamos</h2>
      <ul>
        <li><strong>Reportes de errores:</strong> motivo y mensaje libre. Pedimos no incluir datos
        personales; si los incluyen, los trataremos solo para gestionar el reporte.</li>
        <li><strong>Eventos de uso agregados:</strong> vistas y clics contabilizados sin identidad
        (sin IP almacenada, sin cookies de terceros).</li>
        <li><strong>Sesión administrativa:</strong> cookie técnica de inicio de sesión para el panel
        interno, solo para administradores.</li>
        <li><strong>Datos de contacto de clínicas:</strong> información pública o entregada por los
        establecimientos para su ficha (teléfonos, direcciones, sitios web).</li>
      </ul>

      <h2>3. Finalidades y base</h2>
      <p>Mantener el directorio actualizado, medir qué información es útil y operar el servicio.
      No vendemos datos ni hacemos publicidad comportamental.</p>

      <h2>4. Cookies</h2>
      <p>Usamos solo cookies técnicas: sesión del panel admin y preferencias mínimas de la
      interfaz. <strong>No usamos cookies de analítica ni publicidad de terceros.</strong> Si eso
      cambia (p. ej. Google Analytics), actualizaremos esta política y pediremos consentimiento
      cuando corresponda.</p>

      <h2>5. Derechos (Ley 19.628)</h2>
      <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo
      a [EMAIL], indicando tu identidad y el dato en cuestión. Responderemos en los plazos legales.</p>

      <h2>6. Conservación y seguridad</h2>
      <p>Conservamos los datos el tiempo necesario para su finalidad, con medidas razonables de
      seguridad (cifrado en tránsito, accesos restringidos, respaldos). Ningún sistema es
      infalible; ante incidentes relevantes avisaremos según la normativa.</p>

      <h2>7. Cambios</h2>
      <p>Publicaremos aquí cualquier cambio con su fecha de vigencia.</p>
    </main>
  );
}
