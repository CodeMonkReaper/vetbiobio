const path = require('path');

module.exports = {
  plugins: {
    // Ruta explícita: con pnpm workspaces el CWD suele ser la raíz del
    // monorepo y Tailwind no encuentra tailwind.config.js (falla silenciosa
    // en Next → CSS crudo). __dirname siempre es apps/web.
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
