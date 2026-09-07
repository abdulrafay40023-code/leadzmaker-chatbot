/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#84cc16', // Neon lime
          primaryHover: '#65a30d',
          secondary: '#a3e635',
          accent: '#bef264',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        dark: {
          bg: '#070b12',
          surface: '#0d1522',
          card: '#121d2f',
          border: '#1e2d44',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
};
