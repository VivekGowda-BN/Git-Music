/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // dark blue/slate
        surface: '#1e293b',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        accent: '#f43f5e'
      }
    },
  },
  plugins: [],
}
