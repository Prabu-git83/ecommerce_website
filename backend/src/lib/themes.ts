// Catalog of storefront themes a super admin can assign to the customer-facing
// website. Each theme recolors the site (same "1a Signal" layout/structure)
// by overriding a fixed set of CSS custom properties — see
// website/app/globals.css and website/tailwind.config.ts for how these are
// consumed. Values are "R G B" triplets so Tailwind's `rgb(var(--x) / <alpha>)`
// pattern can still support opacity modifiers like `bg-accent/35`.
export type ThemeTokens = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  ink: string;
  slate: string;
  paper: string;
  chrome: string;
  border: string;
  muted: string;
  faint: string;
};

export type ThemeDef = {
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
};

export const THEMES: ThemeDef[] = [
  {
    id: "signal",
    name: "Signal",
    description: "Brand blue on light slate — dense, utility-first, always-visible filters.",
    tokens: {
      accent: "31 99 214",
      accentDark: "22 75 166",
      accentSoft: "238 244 254",
      ink: "15 23 42",
      slate: "30 41 59",
      paper: "248 250 252",
      chrome: "232 237 243",
      border: "226 232 240",
      muted: "71 85 105",
      faint: "148 163 184",
    },
  },
  {
    id: "atelier",
    name: "Atelier",
    description: "Warm editorial olive on paper — the original considered-goods look.",
    tokens: {
      accent: "95 107 46",
      accentDark: "74 84 36",
      accentSoft: "239 241 228",
      ink: "31 29 24",
      slate: "58 55 48",
      paper: "244 240 230",
      chrome: "234 228 213",
      border: "224 218 202",
      muted: "110 105 89",
      faint: "154 146 125",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep violet accent on cool near-white — a premium, after-dark feel.",
    tokens: {
      accent: "109 40 217",
      accentDark: "91 33 182",
      accentSoft: "243 238 252",
      ink: "24 19 43",
      slate: "46 38 80",
      paper: "250 250 255",
      chrome: "237 233 254",
      border: "228 222 251",
      muted: "87 75 114",
      faint: "167 155 196",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm rust and clay on cream — earthy, handmade, artisanal.",
    tokens: {
      accent: "194 65 12",
      accentDark: "154 52 18",
      accentSoft: "253 238 229",
      ink: "43 27 18",
      slate: "74 52 35",
      paper: "251 246 240",
      chrome: "243 230 216",
      border: "233 213 191",
      muted: "124 91 69",
      faint: "183 154 127",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green accent on soft mint-white — calm, natural, sustainable.",
    tokens: {
      accent: "21 128 61",
      accentDark: "17 100 48",
      accentSoft: "231 246 236",
      ink: "15 36 25",
      slate: "31 59 44",
      paper: "246 250 247",
      chrome: "227 240 231",
      border: "211 231 217",
      muted: "75 102 86",
      faint: "143 170 154",
    },
  },
];

export const DEFAULT_THEME_ID = "signal";

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}
