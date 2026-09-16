import type { Config } from "tailwindcss";

// Same "Atelier" family as the customer site, adapted for an operations
// console: paper ground, typographic left-rail nav (no icons), rule-line
// tables, numbers set large. Adds a status blue for "shipped" that the
// customer site never needed.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F0E6",
        surface: "#F9F6EE",
        sidebar: "#EDE8DA",
        chrome: "#EAE4D5",
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
        info: "#3E5C8A",
        disabled: "#C9C2AE",
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
