const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'frontend/app/**/*.{js,jsx}'),
    path.join(__dirname, 'frontend/components/**/*.{js,jsx}'),
    path.join(__dirname, 'frontend/lib/**/*.{js,jsx}'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        surface: '#ffffff',
        bgbase: '#f8fafc',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cal)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
