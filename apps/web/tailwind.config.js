/** Design tokens VetBiobío (§7, §8, §44): teal salud/confianza, azul noche, neutros.
 *  Tipografía sans del sistema (sin dependencias). Mobile-first.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf7',
          100: '#d7f2ea',
          200: '#b0e4d5',
          300: '#7dd0ba',
          400: '#45b59a',
          500: '#24997f',
          600: '#177c67',
          700: '#146354',
          800: '#135045',
          900: '#12423b',
        },
        ink: {
          DEFAULT: '#16283c',
          soft: '#3b4f66',
          mute: '#64748b',
        },
        paper: '#f6f8f7',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.625rem',
        lg: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 40, 60, 0.06), 0 4px 16px rgba(22, 40, 60, 0.08)',
      },
    },
  },
  plugins: [],
};
