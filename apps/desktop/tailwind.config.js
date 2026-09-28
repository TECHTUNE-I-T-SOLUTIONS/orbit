/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D10',
        surface: '#12161B',
        'surface-2': '#181D23',
        primary: '#E6EAF0',
        muted: '#8B949E',
        accent: '#6EE7B7',
        border: '#252B33',
        danger: '#F87171',
      }
    },
  },
  plugins: [],
}
