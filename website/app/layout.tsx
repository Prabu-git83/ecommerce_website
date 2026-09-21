import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartHydrator from "@/components/CartHydrator";
import AuthHydrator from "@/components/AuthHydrator";
import { apiGet } from "@/lib/api";
import type { Category } from "@/lib/types";

const display = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Arca — considered goods",
  description: "Electronics, fashion, home and beauty — forty pieces chosen each season.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await apiGet<Category[]>("/categories", 300).catch(() => [] as Category[]);

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-body text-ink antialiased">
        <CartHydrator />
        <AuthHydrator />
        <Header categories={categories} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
