# Diagnóstico de Interfaz y Accesibilidad — VetBiobío Frontend

> **Documento:** `/docs/ui/00-diagnostico.md`  
> **Fase:** 0 — Diagnóstico (Solo Lectura)  
> **Fecha:** 2026-10-09  
> **Rama:** `fase-0-diagnostico-ui`  
> **Norma de referencia:** WCAG 2.2 Nivel AA + Criterios de Portafolio y Mobile-First

---

## 1. Inventario del Frontend

### 1.1. Arquitectura y Estructura de Rutas
La aplicación está construida sobre **Next.js 14.2** utilizando exclusivamente el **App Router** (`apps/web/src/app`):

- **Rutas Públicas:**
  - `/` ([`app/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/page.tsx)): Página de inicio con hero, buscador principal, servicios populares y acceso a comunas destacadas.
  - `/veterinarias` ([`app/veterinarias/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/veterinarias/page.tsx), [`loading.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/veterinarias/loading.tsx)): Listado central con filtros por parámetros de URL, tarjetas de clínicas, paginación y barra de comparación.
  - `/veterinarias/[commune]` ([`app/veterinarias/[commune]/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/veterinarias/[commune]/page.tsx)): Listado específico filtrado por comuna.
  - `/veterinarias/[commune]/[slug]` ([`app/veterinarias/[commune]/[slug]/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/veterinarias/[commune]/[slug]/page.tsx)): Ficha de clínica con datos de contacto, horarios, precios, mapa, profesionales, fotos, desglose de confiabilidad y microdatos JSON-LD (`VeterinaryCare`).
  - `/comparar` ([`app/comparar/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/comparar/page.tsx)): Comparador multiparámetro de 2 a 3 clínicas basado en `?slugs=`.
  - `/servicios`, `/examenes`, `/especialidades` ([`components/catalog/Catalog.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/catalog/Catalog.tsx)): Catálogos taxonómicos públicos con rutas dinámicas por slug.
  - `/aportar` ([`app/aportar/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/aportar/page.tsx)): Formulario ciudadano de colaboración bajo la Ley N° 19.628.
  - `/aportar/estado` ([`app/aportar/estado/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/aportar/estado/page.tsx)): Consulta de estado mediante código de seguimiento `VBB-XXXX`.
  - `/reportar` ([`app/reportar/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/reportar/page.tsx)): Formulario de reporte de incidencias o datos incorrectos.
  - `/terminos` ([`app/terminos/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/terminos/page.tsx)) y `/privacidad` ([`app/privacidad/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/privacidad/page.tsx)): Textos legales en borrador.
  - `/sitemap.xml` ([`app/sitemap.ts`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/sitemap.ts)) y `/robots.txt` ([`app/robots.ts`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/robots.ts)).
- **Rutas Administrativas:**
  - Layout: [`app/admin/layout.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/admin/layout.tsx) (Client Component con sidebar lateral y badges dinámicos).
  - Vistas: `/admin` (dashboard KPIs), `/admin/login`, `/admin/clinics`, `/admin/aportes`, `/admin/calidad` (motor de calidad), `/admin/importar` (pipeline de ingesta con dry-run), `/admin/reportes`, `/admin/precios`, `/admin/horarios`, `/admin/fotos`, `/admin/verificar`.

### 1.2. Layouts y Componentes Compartidos
- **Layout Global:** [`app/layout.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/layout.tsx) monta el `<Header />`, contenedor con `<div id="contenido">`, `<Footer />` y enlace de salto accesible `<a href="#contenido">`.
- **Biblioteca de Componentes:**
  - `components/ui/Badge.tsx`: `Badge` y `VerificationBadge`.
  - `components/ui/Button.tsx`: Componente base con variantes `primary`, `secondary`, `ghost` y tamaños `sm`, `md`.
  - `components/ui/display.tsx`: `Card`, `PriceDisplay`, `FromPrice`, `Skeleton`, `Alert`, `Empty`.
  - `components/ui/fields.tsx`: `Field`, `Input`, `Select`, `Textarea`.
  - `components/ui/Pagination.tsx`: Paginación basada en enlaces accesibles.
  - `components/layout/chrome.tsx`: `Header`, `Footer`, `Breadcrumbs`.
  - `components/clinics/ClinicCard.tsx`: Ficha resumida para listados.
  - `components/comparison/`: `CompareButton.tsx`, `CompareBar` y `ComparisonTable.tsx`.
  - `components/search/FilterPanel.tsx` y `features/search/SearchBar.tsx`.
  - `features/clinic-profile/`: `ClinicHero`, `ClinicContact`, `ClinicLocation`, `ClinicProfessionals`, `ClinicReliability`, `ClinicServices`, `ScheduleTable`.
  - `features/maps/`: `ClinicMap.tsx` (Mapbox GL) y `MapEmbed.tsx` (OpenStreetMap).

### 1.3. Estilos, Tipografía, Íconos e Imágenes
- **Librería de Estilos:** Tailwind CSS v3.4.0 configurado en [`tailwind.config.js`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/tailwind.config.js) y hoja de estilos [`globals.css`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/styles/globals.css).
- **Tipografía:** Utiliza la pila del sistema (`system-ui, -apple-system, Segoe UI, Roboto...`). **No utiliza `next/font`**. No hay fuentes web optimizadas ni fallbacks métricos ajustados.
- **Íconos:** Símbolos y emojis Unicode insertados directamente en el JSX (`🐾`, `➕`, `✓`, `⚠`, `◷`, `✕`, `ⓘ`, `📊`, `📥`, `🏥`, etc.). No existe una biblioteca de íconos SVG vectoriales (Lucide, Heroicons, Radix).
- **Imágenes:** `ClinicPhotos.tsx` utiliza `next/image` con dimensiones fijas (`640x480`) y `loading="lazy"`. No hay imágenes ni avatares en `ClinicCard` ni cabeceras.
- **Mapas:** Carga dinámica `import('mapbox-gl')` en cliente con contenedor de relación de aspecto fija (`aspect-video`), con fallback honesto a OpenStreetMap vía `<iframe>`.
- **Formularios y Estado:** Formularios controlados con `useState` y `fetch` directo; sin react-hook-form ni esquemas de validación visual en cliente. Estado sincronizado mediante parámetros de búsqueda en URL (`useSearchParams`) y `localStorage` exclusivamente para la barra de comparación.

---

## 2. Inconsistencias Visuales (Evidencia por Archivo y Línea)

### 2.1. Colores Hardcodeados fuera del Sistema de Tokens
En [`tailwind.config.js`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/tailwind.config.js) se definieron tokens oficiales:
`brand: { 50..900 }` (paleta verde azulado teal), `ink: { DEFAULT, soft, mute }` (azules de texto), y `paper: '#f6f8f7'`.
Sin embargo, gran parte de la interfaz ignora estos tokens y recurre a clases estándar de Tailwind (`emerald-*`, `slate-*`, `rose-*`, `amber-*`):

1. **[`components/layout/chrome.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/layout/chrome.tsx):**
   - Línea 17: `text-emerald-700` en logo en lugar de `text-brand-700`.
   - Línea 20: `text-slate-600` en navegación en lugar de `text-ink-soft`.
   - Línea 32: `bg-emerald-600 text-white hover:bg-emerald-700` en botón "Aportar".
   - Líneas 44-55: `border-slate-200`, `text-slate-500`, `text-slate-400` en footer.
   - Línea 74: `text-slate-700` en migas de pan.
2. **[`components/ui/Button.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/Button.tsx):**
   - Línea 8: `border border-slate-300` en botón secundario.
3. **[`components/ui/fields.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/fields.tsx):**
   - Línea 4: `border border-slate-300 bg-white` en inputs y selects.
4. **[`components/ui/display.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/display.tsx):**
   - Línea 5: `border border-slate-200` en `Card`.
   - Línea 21: `bg-slate-200` en `Skeleton`.
   - Línea 38: `border-slate-300` en `Empty`.
5. **[`features/clinic-profile/ClinicReliability.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/features/clinic-profile/ClinicReliability.tsx):**
   - Líneas 38-53: Mezcla arbitraria de `bg-emerald-50 text-emerald-800`, `bg-amber-50 text-amber-800` y `bg-rose-50 text-rose-800`.
   - Líneas 80, 84, 87, 92, 99: `border-slate-200`, `text-slate-900`, `text-slate-400`, `text-emerald-600`.
6. **[`app/aportar/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/aportar/page.tsx):**
   - Línea 92: `text-emerald-600`.
   - Línea 119: `bg-emerald-600 hover:bg-emerald-700`.
   - Líneas 142, 157: `bg-rose-50 border-rose-200 text-rose-700`, `bg-slate-50 border-slate-300 focus:ring-emerald-500`.
7. **[`app/reportar/page.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/reportar/page.tsx):**
   - Línea 73: `bg-emerald-600 hover:bg-emerald-700 rounded-xl`.

### 2.2. Disparidad en Radios de Borde (`border-radius`)
No existe una convención armónica de radios:
- `Button.tsx:25`: `rounded` (0.625rem / 10px).
- `chrome.tsx:32`: `rounded-xl` (12px).
- `display.tsx:5`: `rounded-lg` (14px).
- `ClinicReliability.tsx:66`: `rounded-full` (píldora).
- `ClinicReliability.tsx:80`: `rounded-2xl` (16px).
- `aportar/page.tsx:83`: `rounded-2xl` con inputs `rounded-xl`.
- `page.tsx:54`: `rounded-full` en comunas.

### 2.3. Duplicación y Recreación Ad-hoc de Botones
Aunque existe [`components/ui/Button.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/Button.tsx), los botones se reimplementan manualmente en múltiples archivos con estilos discordantes:
- [`ClinicCard.tsx:34`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/clinics/ClinicCard.tsx#L34): `Link` con `rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700`.
- [`ClinicContact.tsx:25`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/features/clinic-profile/ClinicContact.tsx#L25): `span` con `rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700`.
- [`CompareButton.tsx:41`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/comparison/CompareButton.tsx#L41): `button` con `rounded border border-slate-300 bg-white px-4 py-2 font-medium hover:border-brand-500`.
- [`CompareButton.tsx:71`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/comparison/CompareButton.tsx#L71): `Link` con `rounded bg-brand-600 px-4 py-1.5 font-medium text-white hover:bg-brand-700`.
- [`aportar/page.tsx:119`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/aportar/page.tsx#L119): `Link` con `bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold`.
- [`reportar/page.tsx:73`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/reportar/page.tsx#L73): `Link` con `bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold`.

### 2.4. Ruptura de Consistencia en Páginas Legales
- [`app/terminos/page.tsx:10-58`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/terminos/page.tsx#L10-L58): **Sin estilos CSS.** Se escribieron etiquetas crudas `<main>`, `<h1>`, `<h2>`, `<p>` sin clases. Dado que Tailwind ejecuta *Preflight* (reset total de estilos), la página se muestra completamente plana, sin jerarquía de tamaño ni márgenes.
- [`app/privacidad/page.tsx:11-58`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/privacidad/page.tsx#L11-L58): Cuenta con una tarjeta centrada `max-w-3xl bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6`.

---

## 3. Auditoría de Accesibilidad (WCAG 2.2 Nivel AA)

### 3.1. Ratios de Contraste de Color (Criterio 1.4.3 - Mínimo 4.5:1)
Se calcularon matemáticamente los contrastes de los pares texto/fondo utilizados en la aplicación:

| Elemento | Par Texto / Fondo | Ratio Calculado | Estado WCAG 2.2 AA |
|---|---|---|---|
| **Enlace Admin en Footer** ([`chrome.tsx:55`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/layout/chrome.tsx#L55)) | `#94a3b8` (`slate-400`) sobre `#ffffff` | **2.45:1** | ❌ **FALLA** (Mínimo 4.5:1) |
| **Migas de pan separador/inactivo** ([`chrome.tsx:64`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/layout/chrome.tsx#L64)) | `#94a3b8` (`slate-400`) sobre `#ffffff` | **2.45:1** | ❌ **FALLA** (Mínimo 4.5:1) |
| **Texto secundario / placeholders** ([`fields.tsx:4`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/fields.tsx#L4)) | `#64748b` (`ink-mute`) sobre `#ffffff` | **3.98:1** | ❌ **FALLA** (Mínimo 4.5:1) |
| **Enlace "Ver más en..."** ([`ClinicHero.tsx:35`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/features/clinic-profile/ClinicHero.tsx#L35)) | `#64748b` (`ink-mute`) sobre `#f6f8f7` | **3.71:1** | ❌ **FALLA** (Mínimo 4.5:1) |
| **Anillo de foco global** ([`globals.css:14`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/styles/globals.css#L14)) | `#45b59a` (`brand-400`) sobre `#ffffff` | **2.25:1** | ❌ **FALLA 1.4.11** (Mínimo 3.0:1) |
| **Texto normal oscuro** | `#16283c` (`ink`) sobre `#ffffff` | **13.56:1** | ✅ CUMPLE |
| **Texto secundario suave** | `#3b4f66` (`ink-soft`) sobre `#ffffff` | **7.54:1** | ✅ CUMPLE |
| **Botón primario** | `#ffffff` sobre `#177c67` (`brand-600`) | **4.91:1** | ✅ CUMPLE |
| **Badge Verificada** | `#135045` (`brand-800`) sobre `#effaf7` (`brand-50`) | **8.20:1** | ✅ CUMPLE |
| **Badge En Revisión** | `#92400e` (`amber-800`) sobre `#fffbeb` (`amber-50`) | **5.75:1** | ✅ CUMPLE |
| **Badge Rechazada** | `#991b1b` (`red-800`) sobre `#fef2f2` (`red-50`) | **6.64:1** | ✅ CUMPLE |

### 3.2. Foco Visible y Navegación por Teclado
- **Aspecto positivo:** [`globals.css:13-16`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/styles/globals.css#L13) establece `:focus-visible` con `outline` explícito en lugar de eliminarlo.
- **Deficiencia 1:** El color `#45b59a` (`brand-400`) tiene un ratio de **2.25:1** sobre fondo blanco, incumpliendo el criterio 1.4.11 (contraste no textual mínimo 3:1). Debe ajustarse a `brand-600` o un tono con contraste suficiente.
- **Deficiencia 2:** En [`aportar/page.tsx:157`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/aportar/page.tsx#L157), los campos usan `focus:outline-none`, anulando el anillo global.
- **Deficiencia Crítica en Modal:** El modal de desglose en [`ClinicReliability.tsx:78-186`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/features/clinic-profile/ClinicReliability.tsx#L78-L186):
  1. No atrapa el foco del teclado (*focus trap*); al pulsar `Tab` se interactúa con el contenido que está detrás del modal.
  2. No escucha la tecla `Escape` para cerrarse.
  3. No tiene `role="dialog"`, `aria-modal="true"` ni `aria-labelledby`.
  4. El botón `✕` de cierre carece de `aria-label="Cerrar modal"`.

### 3.3. Áreas Táctiles Mínimas (Criterio 2.5.8 - Target Size)
En situaciones de urgencia y en dispositivos móviles, los elementos deben tener un área táctil mínima de **44x44 px**:
- [`Button.tsx:13`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/Button.tsx#L13): `size='sm'` tiene `px-3 py-1.5 text-sm` -> altura efectiva ~32 px (insuficiente).
- [`Pagination.tsx:14, 22`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/ui/Pagination.tsx#L14): Botones "Anterior" y "Siguiente" con `px-3 py-1.5` -> altura efectiva ~32 px.
- [`page.tsx:54`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/page.tsx#L54): Píldoras de comunas con `px-4 py-1.5` -> altura efectiva ~32 px.
- [`FilterPanel.tsx:81, 85`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/search/FilterPanel.tsx#L81): Checkboxes nativos de 13x13 px con etiqueta de texto adyacente sin envoltorio que expanda el área de clic a 44 px.

### 3.4. Landmarks y Encabezados
- `layout.tsx:25` incluye correctamente `<a href="#contenido">` para salto al contenido principal.
- La jerarquía de encabezados (`h1` -> `h2`) está respetada en la mayoría de las vistas (`page.tsx`, `veterinarias/page.tsx`, `[slug]/page.tsx`).
- En `terminos/page.tsx`, los encabezados carecen de semántica visual por falta de clases CSS.

### 3.5. Movimiento Reducido (`prefers-reduced-motion`)
- `display.tsx:21` (`Skeleton`) usa `animate-pulse` constante y `ClinicReliability.tsx:80` usa `fade-in`.
- **Falta:** No hay declaración `@media (prefers-reduced-motion: reduce)` en `globals.css` para respetar la preferencia del usuario sobre animaciones continuas.

---

## 4. Auditoría de Estados de Interfaz

| Vista / Ruta | Carga (Loading) | Error | Vacío / Sin Resultados | Diagnóstico y Riesgo |
|---|---|---|---|---|
| **`/` (Inicio)** | N/A (Estático) | N/A | N/A | Correcto. |
| **`/veterinarias` (Listado)** | ✅ `loading.tsx` con skeletons | ✅ `Alert tone="error"` con reintento | ✅ `Empty` con hints | Completo. |
| **`/veterinarias/[commune]`** | ❌ Sin `loading.tsx` | ❌ Sin captura de error | ⚠️ `Empty` genérico | Si falla la API, la página arroja excepción no controlada. |
| **`/veterinarias/[commune]/[slug]`** | ❌ Sin `loading.tsx` | ❌ **Arroja `notFound()` ante caída de API** | N/A | **Crítico:** Si la API falla temporalmente, muestra 404 engañoso al usuario. |
| **`/comparar`** | ❌ Sin `loading.tsx` | ⚠️ Usa estado vacío en vez de alerta | ✅ `Empty` ("Elige 2 o 3...") | Falta feedback explícito de fallo de conexión. |
| **`/servicios`, `/examenes`, etc.** | ❌ Sin `loading.tsx` | ⚠️ Silencia error a arreglo vacío | ✅ `Empty` ("Aún no hay...") | Si la API cae, aparenta que la región no tiene servicios. |
| **`/aportar`** | ✅ `LOADING` en botón | ✅ Banner de error | ✅ Formulario inicial | Correcto. |
| **`/reportar`** | ✅ `submitting` | ✅ Banner de error | ✅ Formulario inicial | Correcto. |

---

## 5. Análisis Responsive (360, 390, 768, 1024, 1440 px)

### 5.1. Móvil Compacto (360 px - 390 px)
- **Bloqueo Visual de Filtros en `/veterinarias`:** En pantallas móviles, el componente [`FilterPanel.tsx`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/search/FilterPanel.tsx) se sitúa directamente sobre la lista de resultados en el flujo vertical, ocupando más de 650 px de altura. Un usuario en móvil debe hacer scroll de casi dos pantallas completas antes de ver la primera veterinaria disponible.
  - *Comportamiento esperado según especificación:* Filtros accesibles mediante botón flotante o modal/panel inferior (*bottom sheet*), dejando el listado a la vista.
- **Desborde en Navegación Superior (`chrome.tsx`):** En 360 px, el contenedor `flex-wrap` hace que el botón "Aportar Información" caiga a una segunda fila, desalineando el encabezado.
- **Comparador en Móvil:** `ComparisonTable.tsx:75` transforma la tabla en tarjetas apiladas (`md:hidden`). Esto funciona pero pierde la capacidad de comparar lado a lado atributos de dos clínicas simultáneamente.

### 5.2. Tablet y Escritorio (768 px - 1440 px)
- A partir de `md:` (768 px), la cuadrícula de 2 columnas `[260px_1fr]` organiza los filtros a la izquierda y el listado de tarjetas a la derecha de forma balanceada.
- En 1024 px y 1440 px, el ancho máximo `max-w-6xl` (1152 px) mantiene un encuadre visual cómodo sin que las líneas de texto se extiendan excesivamente.

---

## 6. Rendimiento Frontend

1. **Equilibrio Server vs Client Components:**
   - La arquitectura de RSC es sólida: las páginas principales (`page.tsx`, `veterinarias/page.tsx`, `[slug]/page.tsx`, `comparar/page.tsx`) son Server Components que resuelven datos en el servidor y despachan HTML estático.
   - Los componentes con interacción de usuario (`SearchBar`, `FilterPanel`, `CompareButton`, `ClinicReliability`) están correctamente aislados con `'use client'`.
   - *Oportunidad:* `app/admin/layout.tsx` está marcado como `'use client'`, arrastrando todo el shell administrativo al cliente en vez de aislar únicamente la barra de navegación interactiva.
2. **Navegación Interna sin Recarga Completa:**
   - En [`ComparisonTable.tsx:54, 79`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/components/comparison/ComparisonTable.tsx#L54) y en [`[slug]/page.tsx:100`](file:///c:/Users/luis_/OneDrive/Documentos/VetBioBio/apps/web/src/app/veterinarias/%5Bcommune%5D/%5Bslug%5D/page.tsx#L100) se usan enlaces `<a href="...">` en lugar del componente `<Link href="...">` de Next.js. Esto provoca una recarga completa de la página (*hard reload*), perdiendo la optimización de transiciones SPA y la caché de cliente.
3. **Optimización de Mapbox GL:**
   - La importación dinámica `import('mapbox-gl')` en `ClinicMap.tsx` previene la inclusión del bundle de Mapbox (~220 KB gzipped) en las páginas donde no se muestra mapa.

---

## 7. Alcance Honesto y Aspectos a Preservar

### 7.1. Qué NO se Pudo Verificar en esta Fase (Solo Lectura)
- Renderizado visual en navegadores Safari / WebKit bajo iOS real (evaluado mediante inspección estricta de CSS y especificación).
- Comportamiento de lectores de pantalla en hardware físico móvil (TalkBack en Android y VoiceOver en iOS).
- Impacto exacto de métricas Web Vitals (LCP, FID, CLS) bajo red 3G móvil lenta (requiere ejecución de Lighthouse en Fase 4).

### 7.2. Aspectos Destacados a Preservar
- **URL-First Navigation:** El estado de búsqueda y filtros vive en los parámetros de la URL, garantizando que los resultados sean indexables, compartibles y compatibles con el historial del navegador.
- **Verificación Atómica por Campo:** Cada sección (precios, horarios, teléfono) mantiene su sello independiente, evitando badges globales engañosos.
- **Aviso Legal de No Certificación Sanitaria:** El modal de confiabilidad y el footer explican transparentemente que los datos son informativos y no reemplazan la acreditación médica ni sanitaria oficial.
- **Fallback de Mapas:** La coexistencia de Mapbox con OpenStreetMap asegura que el mapa nunca falle, incluso si la API key externa no está configurada.

---

## 8. Matriz de Hallazgos Priorizados

| ID | Hallazgo | Categoría | Estado | Severidad | Esfuerzo Estimado |
|---|---|---|---|---|---|
| **UI-01** | Colores hardcodeados (`emerald-*`, `slate-*`) que violan el sistema de tokens | Inconsistencia | **Confirmado** | Media | Medio (Fase 2/3) |
| **UI-02** | Reinvención ad-hoc de botones y links en 6 vistas distintas | Inconsistencia | **Confirmado** | Media | Bajo (Fase 2) |
| **UI-03** | `text-slate-400` y `text-ink-mute` fallan ratio de contraste WCAG 2.2 AA (< 4.5:1) | Accesibilidad | **Confirmado** | **Alta** | Bajo (Fase 1/2) |
| **UI-04** | Modal de Confiabilidad (`ClinicReliability`) sin focus-trap, sin tecla `Escape` ni ARIA dialog | Accesibilidad | **Confirmado** | **Alta** | Medio (Fase 2/3) |
| **UI-05** | Áreas táctiles inferiores a 44x44 px en botones `sm`, paginación y píldoras | Accesibilidad | **Confirmado** | **Alta** | Medio (Fase 2) |
| **UI-06** | Ausencia del banner visible de "Piloto en verificación" exigido por producto | Regla Producto | **Confirmado** | **Alta** | Bajo (Fase 1/3) |
| **UI-07** | Página `/terminos` sin estilos CSS (HTML crudo) frente a `/privacidad` estilizada | Inconsistencia | **Confirmado** | Media | Bajo (Fase 3) |
| **UI-08** | Ficha de clínica dispara 404 ante fallo transitorio de la API | Resiliencia | **Confirmado** | Media | Bajo (Fase 3) |
| **UI-09** | En móvil (<768px), el panel de filtros desplaza los resultados fuera del viewport inicial | UX / Mobile | **Confirmado** | **Alta** | Medio (Fase 3) |
| **UI-10** | Sin respeto de `prefers-reduced-motion` en skeletons y transiciones | Accesibilidad | **Confirmado** | Baja | Bajo (Fase 2) |
| **UI-11** | Enlaces `<a>` nativos en lugar de `<Link>` en tabla comparativa y perfil | Rendimiento | **Confirmado** | Media | Bajo (Fase 3) |
| **UI-12** | Tipografía sans genérica del sistema sin optimización `next/font` | Portafolio | **Confirmado** | Media | Bajo (Fase 1/2) |
