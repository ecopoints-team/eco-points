/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        // Neutral mode colors
        'neutral-bg': '#374151',
        'neutral-card': '#4b5563',
        'neutral-border': '#6b7280',
        'neutral-text': '#f3f4f6',
      },
      boxShadow: {
        'glow': '0 0 10px rgba(16, 185, 129, 0.5)',
      }
    },
  },
  plugins: [],
}