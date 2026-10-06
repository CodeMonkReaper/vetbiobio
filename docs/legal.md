# Situación legal — VetBiobío (borradores, NO revisión profesional)

> ⚠️ **Advertencia:** todo lo de esta carpeta es un **borrador de trabajo** redactado sin asesoría
> jurídica. **No lanzar públicamente sin revisión de un abogado en Chile.**
> Ver project_context §96–99.

## Documentos

* `apps/web/src/app/terminos/page.tsx` — Términos de uso (borrador).
* `apps/web/src/app/privacidad/page.tsx` — Política de privacidad + cookies (borrador).
* Disclaimers en UI (precios referenciales, verificación) ya visibles en listado/perfil/comparar.

## Decisiones tomadas en los borradores

1. La plataforma es un **directorio informativo**: no presta servicios veterinarios ni
   recomienda establecimientos; el orden responde a filtros/ubicación/precio, no a criterio médico.
2. **Precios referenciales** y verificación por sección con fecha explícita; el usuario debe
   confirmar con el establecimiento.
3. Publicidad y perfiles Premium **identificados** y sin efecto sobre la verificación.
4. Minimización de datos (Ley 19.628): sin cuentas de dueños; reportes y eventos sin PII;
   solo cookie técnica de sesión admin + almacenamiento local mínimo.
5. Propiedad de fichas: los establecimientos pueden solicitar corrección/eliminación por el
   canal de contacto (definir email oficial antes de lanzar).

## Checklist pre-lanzamiento (abogado + negocio)

- [ ] Revisión profesional de términos y privacidad (derecho chileno del consumo incluido).
- [ ] Definir razón social, RUT, domicilio y email de contacto real (hoy hay placeholders).
- [ ] Política de eliminación/corrección de fichas y SLA de respuesta a reportes.
- [ ] Condiciones del producto Premium/publicidad (contrato, facturación, impuestos).
- [ ] Uso de marcas de terceros (nombres/logos de clínicas) y fotografías (autorización).
- [ ] Cookies: confirmar si se agrega analítica de terceros (hoy no hay) y actualizar texto.
- [ ] Fecha de última actualización y versionado de los textos.
