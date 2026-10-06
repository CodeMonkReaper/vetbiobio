export async function generateMetadata() {
  return {
    title: 'Términos de uso | VetBiobío',
    alternates: { canonical: '/terminos' },
  };
}

// BORRADOR sin revisión jurídica. No usar en producción sin abogado (ver docs/legal.md).
export default function Terminos() {
  return (
    <main>
      <h1>Términos de uso (borrador)</h1>
      <p><small>Última actualización: octubre 2026. [Reemplazar razón social, RUT, domicilio y contacto antes de lanzar.]</small></p>

      <h2>1. Qué es VetBiobío</h2>
      <p>VetBiobío es un directorio informativo de establecimientos veterinarios de la Región del
      Biobío, Chile. La plataforma <strong>no presta servicios veterinarios</strong>, no realiza
      diagnósticos ni recomienda establecimientos por criterios médicos. El orden de los resultados
      responde a los filtros aplicados (ubicación, precio, servicios) y, cuando corresponde, a
      contenido patrocinado debidamente identificado.</p>

      <h2>2. Información referencial</h2>
      <p>Los precios publicados son <strong>referenciales</strong> y pueden variar según la clínica,
      el profesional, el procedimiento, la condición del paciente y la fecha de actualización.
      Cada sección indica su estado y fecha de verificación. El usuario debe <strong>confirmar
      directamente con el establecimiento</strong> antes de contratar cualquier servicio.</p>

      <h2>3. Verificación</h2>
      <p>El sello de verificación indica que un dato fue contrastado con su fuente en la fecha
      señalada, no una garantía permanente. Los datos antiguos se marcan como posiblemente
      desactualizados sin eliminarse de inmediato.</p>

      <h2>4. Publicidad y Premium</h2>
      <p>Los resultados patrocinados y los perfiles Premium se identifican como tales. El pago por
      Premium o publicidad <strong>no altera ni compra</strong> el estado de verificación.</p>

      <h2>5. Reportes</h2>
      <p>Cualquier persona puede reportar información incorrecta sin entregar datos personales.
      Nos reservamos moderar y resolver los reportes según disponibilidad, priorizando cierres y
      datos de contacto.</p>

      <h2>6. Uso aceptable</h2>
      <p>Se prohíbe el uso automatizado abusivo (scraping masivo), la suplantación y el envío de
      información falsa a sabiendas. Podemos limitar el acceso ante abusos.</p>

      <h2>7. Propiedad intelectual</h2>
      <p>El diseño y textos propios de la plataforma pertenecen a [RAZÓN SOCIAL]. Los nombres,
      marcas y fotografías de terceros pertenecen a sus titulares y se muestran con fines
      informativos. Los establecimientos pueden solicitar correcciones a [EMAIL].</p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>En la máxima medida permitida por la ley chilena, VetBiobío no responde por decisiones
      tomadas con base en la información del directorio ni por los servicios prestados por
      terceros. Nada de lo aquí dispuesto limita derechos irrenunciables de los consumidores.</p>

      <h2>9. Cambios y contacto</h2>
      <p>Podemos actualizar estos términos publicando la nueva versión con su fecha. Contacto: [EMAIL].</p>
    </main>
  );
}
