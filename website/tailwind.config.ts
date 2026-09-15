import type { Config } from "tailwindcss";

// Design tokens lifted from the "1b — Atelier" mockup: warm paper background,
// rule lines instead of card shadows, oversized display type, generous margins.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F0E6",
        chrome: "#EAE4D5",
        surface: "#F9F6EE",
        stripe: "#E2DACA",
        border: {
          DEFAULT: "#E0DACA",
          strong: "#DED7C6",
          faint: "#CFC7B3",
        },
        ink: "#1F1D18",
        muted: "#6E6959",
        faint: "#9A927D",
        accent: "#5F6B2E",
        warn: "#A8441F",
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
