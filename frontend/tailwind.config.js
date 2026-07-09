/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal: púrpura (estilo admin dashboard); los degradados
        // combinan brand con fuchsia/pink de la paleta estándar de Tailwind.
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
