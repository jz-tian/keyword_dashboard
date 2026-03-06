import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven tokens — switched by .bloomberg / .apple on <html>
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        border: "var(--color-border)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          faint: "var(--color-text-faint)",
        },
        accent: "var(--color-accent)",
        "accent-dim": "var(--color-accent-dim)",
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",
        neutral: "var(--color-neutral)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      spacing: {
        card: "var(--spacing-card)",
      },
    },
  },
  plugins: [],
};

export default config;
