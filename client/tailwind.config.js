/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "eco-dark": "#0f172a",
        "eco-card": "#1e293b",
        "eco-border": "#334155",
        "eco-green": "#10b981",
        "eco-green-glow": "#34d399",
        "eco-accent": "#0ea5e9",
        "status-danger": "#ef4444",
        "status-warning": "#f59e0b",
        // Neutral mode colors
        "neutral-bg": "#374151",
        "neutral-card": "#4b5563",
        "neutral-border": "#6b7280",
        "neutral-text": "#f3f4f6",
        // System theme colors (Environmental Dark)
        "system-bg": "#0F1B11",
        "system-card": "#1A2E1F",
        "system-text": "#E1E4E1",
        "system-border": "rgba(123, 160, 91, 0.2)",
        "system-accent": "#7BA05B",
      },
      boxShadow: {
        glow: "0 0 10px rgba(16, 185, 129, 0.5)",
        "system-glow": "0 0 10px rgba(123, 160, 91, 0.5)",
      },
    },
  },
  plugins: [
    // Custom plugin for system: variant
    function ({ addVariant }) {
      addVariant("system", ".system &");
    },
  ],
};
