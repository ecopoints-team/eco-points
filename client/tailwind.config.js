/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'eco-dark': '#0f172a',
        'eco-card': '#1e293b',
        'eco-border': '#334155',
        'eco-green': '#10b981',
        'eco-green-glow': '#34d399',
        'eco-accent': '#0ea5e9',
        'status-danger': '#ef4444',
        'status-warning': '#f59e0b',
      },
      boxShadow: {
        'glow': '0 0 10px rgba(16, 185, 129, 0.5)',
      }
    },
  },
  plugins: [],
}