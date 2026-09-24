import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartHydrator from "@/components/CartHydrator";
import AuthHydrator from "@/components/AuthHydrator";
import { apiGet } from "@/lib/api";
import type { Category, ActiveTheme } from "@/lib/types";

const TOKEN_VAR: Record<keyof ActiveTheme["tokens"], string> = {
  accent: "--color-accent",
  accentDark: "--color-accent-dark",
  accentSoft: "--color-accent-soft",
  ink: "--color-ink",
  slate: "--color-slate",
  paper: "--color-paper",
  chrome: "--color-chrome",
  border: "--color-border",
  muted: "--color-muted",
  faint: "--color-faint",
};

const display = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Arca — considered goods",
  description: "Electronics, fashion, home and beauty — forty pieces chosen each season.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, theme, logo] = await Promise.all([
    apiGet<Category[]>("/categories", 300).catch(() => [] as Category[]),
    apiGet<ActiveTheme>("/themes/active", 30).catch(() => null),
    apiGet<{ site_logo_url: string }>("/logo/active", 30).catch(() => null),
  ]);
  const logoUrl = logo?.site_logo_url || undefined;

  // Inline style on <html> beats any stylesheet's :root rule on specificity
  // alone, so the active theme applies deterministically regardless of how
  // Next.js orders globals.css relative to this server-rendered markup —
  // and since this renders server-side, there's no flash of the old theme.
  const themeStyle = theme
    ? (Object.fromEntries(
        Object.entries(theme.tokens).map(([key, value]) => [TOKEN_VAR[key as keyof ActiveTheme["tokens"]], value])
      ) as React.CSSProperties)
    : undefined;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} style={themeStyle}>
      <body className="min-h-screen bg-paper font-body text-ink antialiased">
        <CartHydrator />
        <AuthHydrator />
        <Header categories={categories} logoUrl={logoUrl} />
        <main>{children}</main>
        <Footer logoUrl={logoUrl} />
      </body>
    </html>
  );
}
