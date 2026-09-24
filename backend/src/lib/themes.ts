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
  // surface: cards/inputs; inverse: solid dark bars/buttons; accentInk: accent-coloured text on accentSoft.
  surface: string;
  inverse: string;
  accentInk: string;
};

export type ThemeDef = {
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
};

type BaseTokens = Omit<ThemeTokens, "surface" | "inverse" | "accentInk">;

// Light themes keep white cards, an ink-coloured top bar, and the deep accent for text.
function light(t: BaseTokens): ThemeTokens {
  return { ...t, surface: "255 255 255", inverse: t.ink, accentInk: t.accentDark };
}

export const THEMES: ThemeDef[] = [
  {
    id: "signal",
    name: "Signal",
    description: "Brand blue on light slate — dense, utility-first, always-visible filters.",
    tokens: light({
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
    }),
  },
  {
    id: "atelier",
    name: "Atelier",
    description: "Warm editorial olive on paper — the original considered-goods look.",
    tokens: light({
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
    }),
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep violet accent on cool near-white — a premium, after-dark feel.",
    tokens: light({
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
    }),
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm rust and clay on cream — earthy, handmade, artisanal.",
    tokens: light({
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
    }),
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green accent on soft mint-white — calm, natural, sustainable.",
    tokens: light({
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
    }),
  },
  {
    id: "dark",
    name: "Dark",
    description: "True dark mode — charcoal surfaces, soft blue accent, easy on the eyes at night.",
    tokens: {
      accent: "59 130 246", accentDark: "37 99 235", accentSoft: "30 41 75",
      ink: "236 239 245", slate: "203 210 225", paper: "15 17 23", chrome: "33 37 50", border: "45 50 66",
      muted: "156 165 185", faint: "105 114 135",
      surface: "24 27 36", inverse: "33 37 50", accentInk: "147 197 253",
    },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Electric fuchsia glowing on deep indigo-black — nightlife, gaming and streetwear.",
    tokens: {
      accent: "217 70 239", accentDark: "192 38 211", accentSoft: "58 22 74",
      ink: "240 240 255", slate: "200 200 235", paper: "10 8 24", chrome: "30 24 64", border: "60 44 110",
      muted: "160 150 210", faint: "110 100 170",
      surface: "20 16 44", inverse: "30 24 64", accentInk: "244 160 255",
    },
  },
  {
    id: "neural",
    name: "Neural",
    description: "AI-lab dark teal with cyan signal accents — a machine-intelligence, data-driven feel.",
    tokens: {
      accent: "8 145 178", accentDark: "14 116 144", accentSoft: "12 50 62",
      ink: "226 246 250", slate: "190 225 232", paper: "7 17 20", chrome: "18 40 47", border: "30 62 71",
      muted: "130 175 186", faint: "80 120 130",
      surface: "12 27 32", inverse: "18 40 47", accentInk: "103 232 249",
    },
  },
  {
    id: "cortex",
    name: "Cortex",
    description: "AI-product light: cool graphite neutrals with an electric indigo accent.",
    tokens: light({
      accent: "79 70 229", accentDark: "67 56 202", accentSoft: "238 240 255",
      ink: "17 24 39", slate: "31 41 55", paper: "244 245 247", chrome: "229 231 235", border: "217 220 227",
      muted: "75 85 99", faint: "156 163 175",
    }),
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Bright amber on warm cream — busy, deal-driven, big-box-retail energy.",
    tokens: light({
      accent: "217 119 6", accentDark: "180 83 9", accentSoft: "254 243 199",
      ink: "39 30 8", slate: "68 52 14", paper: "255 251 235", chrome: "254 240 190", border: "250 224 150",
      muted: "113 90 40", faint: "178 152 96",
    }),
  },
  {
    id: "boutique",
    name: "Boutique",
    description: "Soft blush and deep rose — fashion, beauty and gifting.",
    tokens: light({
      accent: "190 24 93", accentDark: "157 23 77", accentSoft: "253 232 243",
      ink: "46 16 34", slate: "76 29 58", paper: "255 247 250", chrome: "252 231 243", border: "249 213 232",
      muted: "131 74 105", faint: "190 145 172",
    }),
  },
  {
    id: "megasale",
    name: "Mega Sale",
    description: "Loud crimson on blush white — festival and clearance campaigns.",
    tokens: light({
      accent: "185 28 28", accentDark: "153 27 27", accentSoft: "254 226 226",
      ink: "55 10 10", slate: "90 20 20", paper: "255 246 246", chrome: "254 226 226", border: "252 205 205",
      muted: "139 70 70", faint: "196 140 140",
    }),
  },
];

export const DEFAULT_THEME_ID = "signal";

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}
