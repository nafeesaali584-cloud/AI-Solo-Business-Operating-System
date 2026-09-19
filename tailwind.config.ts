import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          "surface-hover": "var(--surface-hover)",
          "surface-raised": "var(--surface-raised)",
          border: "var(--border)",
          "border-hover": "var(--border-hover)",
          accent: "var(--accent)",
          "accent-soft": "var(--accent-soft)",
          "accent-border": "var(--accent-border)",
          "accent-hover": "var(--accent-hover)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
          "text-dim": "var(--text-dim)",
        },
        status: {
          success: "var(--success)",
          "success-soft": "var(--success-soft)",
          "success-border": "var(--success-border)",
          warning: "var(--warning)",
          "warning-soft": "var(--warning-soft)",
          "warning-border": "var(--warning-border)",
          danger: "var(--danger)",
          "danger-soft": "var(--danger-soft)",
          "danger-border": "var(--danger-border)",
          info: "var(--info)",
          "info-soft": "var(--info-soft)",
          "info-border": "var(--info-border)",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
