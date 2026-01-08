/** @type {import('tailwindcss').Config} */
module.exports = {
  darkmode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic Dark Mode Backgrounds
        'eco-dark': '#0f172a',       // Deep Blue-Black (Main BG)
        'eco-card': '#1e293b',       // Lighter Blue-Black (Cards/Sidebar)
        'eco-border': '#334155',     // Border color for separation
        
        // EcoPoints Brand Colors
        'eco-green': '#10b981',      // Primary Green (Success/Actions)
        'eco-green-glow': '#34d399', // Brighter Green for hover effects
        'eco-accent': '#0ea5e9',     // Sky Blue (Secondary/Info)
        
        // Status Colors (Snipe-IT style)
        'status-danger': '#ef4444',  // Red (Offline/Error)
        'status-warning': '#f59e0b', // Orange (Maintenance)
      },
      boxShadow: {
        'glow': '0 0 10px rgba(16, 185, 129, 0.5)', // Green glow effect
      }
    },
  },
  plugins: [],
}