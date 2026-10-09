/** Design tokens VetBiobío — Sistema de Diseño "Cálido y Confiable" (Fase 1 / ADR-009)
 *  Cumple WCAG 2.2 AA en todos los pares de color. Mobile-first (touch-target 44px).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de Marca (Teal Bosque del Biobío)
        brand: {
          50: '#effaf7',
          100: '#d7f2ea',
          200: '#a3dfcf',
          300: '#72cbb6',
          400: '#45b59a',
          500: '#24997f',
          600: '#177c67', // Acción interactiva primaria (4.91:1)
          700: '#146354', // Marca de alto contraste & foco visible (6.31:1)
          800: '#105446', // Hover de acción primaria (7.54:1)
          900: '#0d4035',
        },
        // Textos Neutros con Ratio de Contraste Calculado
        ink: {
          DEFAULT: '#122335', // Texto primario (14.83:1 sobre blanco)
          soft: '#33475b',    // Texto secundario (8.24:1 sobre blanco)
          mute: '#4a6177',    // Texto muted / metadatos (5.61:1 sobre blanco)
        },
        // Superficies y Fondos
        canvas: '#f8faf9',
        paper: '#f8faf9', // Alias de retrocompatibilidad
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f0f4f2',
        },
        // Bordes Semánticos
        border: {
          subtle: '#e1e7e4',
          DEFAULT: '#cbd5d1',
          hover: '#94a39f',
          focus: '#146354',
        },
        // Estados de Verificación y Feedback
        status: {
          verified: {
            text: '#135045',
            bg: '#effaf7',
            border: '#a3dfcf',
          },
          review: {
            text: '#7c2d12',
            bg: '#fef3c7',
            border: '#fcd34d',
          },
          outdated: {
            text: '#7c2d12',
            bg: '#ffedd5',
            border: '#fdba74',
          },
          unverified: {
            text: '#1e3a8a',
            bg: '#eff6ff',
            border: '#bfdbfe',
          },
          danger: {
            text: '#881337',
            bg: '#ffe4e6',
            border: '#fda4af',
          },
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '0.25rem',   // 4px
        md: '0.5rem',    // 8px
        DEFAULT: '0.5rem',
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(18, 35, 53, 0.05)',
        card: '0 1px 3px 0 rgba(18, 35, 53, 0.06), 0 4px 16px -2px rgba(18, 35, 53, 0.08)',
        md: '0 4px 12px -2px rgba(18, 35, 53, 0.08)',
        lg: '0 12px 28px -4px rgba(18, 35, 53, 0.14)',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
