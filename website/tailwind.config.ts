import type { Config } from "tailwindcss";

// Design tokens lifted from the "1a — Signal" mockup: brand blue on light
// slate, bordered/rounded cards, dense utility-first layout, filters and
// status always visible.
//
// The brand/decorative tokens below (paper/chrome/border/ink/slate/muted/
// faint/accent*) read from CSS custom properties defined in globals.css, so
// a super admin can re-theme the live site by swapping those variables —
// see themes.ts on the backend and the <style> override in app/layout.tsx.
// rgb(var(--x) / <alpha-value>) keeps opacity modifiers (e.g. bg-accent/35)
// working. Functional/status colors (success/warning/warn) stay fixed hex
// across every theme so stock/order-status meaning never varies.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        chrome: "rgb(var(--color-chrome) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        inverse: "rgb(var(--color-inverse) / <alpha-value>)",
        "accent-ink": "rgb(var(--color-accent-ink) / <alpha-value>)",
        stripe: "#E3E9F1",
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border) / <alpha-value>)",
          faint: "rgb(var(--color-border) / <alpha-value>)",
        },
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        faint: "rgb(var(--color-faint) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-dark": "rgb(var(--color-accent-dark) / <alpha-value>)",
        "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
        success: "#16A34A",
        "success-soft": "#ECFDF3",
        "success-text": "#166534",
        warning: "#D97706",
        "warning-soft": "#FEF3C7",
        "warning-text": "#B45309",
        warn: "#DC2626",
        "warn-soft": "#FEE2E2",
        "warn-text": "#991B1B",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
      },
      maxWidth: {
        content: "1360px",
      },
    },
  },
  plugins: [],
};

export default config;
