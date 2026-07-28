/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b00',
          dark: '#e65c00',
          light: '#ff8533',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
          light: '#334155',
        }
      },
    },
  },
  plugins: [],
}
