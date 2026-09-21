import type { Config } from "tailwindcss";

// Same "1a — Signal" tokens as the customer site: brand blue on light slate,
// bordered/rounded cards, dense utility-first layout. Adds `ink` doing double
// duty as the dark-slate sidebar background, matching the mockup exactly.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8FAFC",
        chrome: "#E8EDF3",
        surface: "#FFFFFF",
        stripe: "#E3E9F1",
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#D7DEE7",
          faint: "#CBD5E1",
        },
        ink: "#0F172A",
        slate: "#1E293B",
        muted: "#475569",
        faint: "#94A3B8",
        "sidebar-label": "#64748B",
        accent: "#1F63D6",
        "accent-dark": "#164BA6",
        "accent-soft": "#EEF4FE",
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
      maxWidth: {
        content: "1360px",
      },
    },
  },
  plugins: [],
};

export default config;
