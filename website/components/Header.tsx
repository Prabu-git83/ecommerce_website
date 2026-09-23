"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Category } from "@/lib/types";

export default function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const itemCount = useCartStore((s) => s.itemCount);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  }

  const navLinks = [{ name: "All categories", slug: "" }, ...categories.map((c) => ({ name: c.name, slug: c.slug }))];

  return (
    <header className="sticky top-0 z-40">
      {/* utility bar */}
      <div className="hidden bg-ink px-5 py-1.5 font-body text-[11px] text-border-faint sm:flex sm:items-center sm:justify-between sm:px-10">
        <span>Free delivery over ₹999 · COD available</span>
        <span className="flex gap-4">
          <Link href="/account/orders" className="hover:text-white">
            Track order
          </Link>
          <Link href="/contact" className="hover:text-white">
            Help centre
          </Link>
          <span>INR ₹ / EN</span>
        </span>
      </div>

      {/* main header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-content items-center gap-6 px-5 py-3.5 sm:px-10">
          <Link href="/" className="font-display text-xl font-bold tracking-tight text-ink">
            ARCA
          </Link>

          <form onSubmit={submitSearch} className="hidden max-w-[460px] flex-1 lg:block">
            <div className="flex h-[38px] items-center gap-2 rounded-lg border border-border bg-chrome/60 px-3.5 focus-within:border-accent focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgb(var(--color-accent-soft))]">
              <span className="h-3 w-3 flex-none rounded-full border-[1.5px] border-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="!w-full !border-0 !bg-transparent !p-0 !text-[13px] !shadow-none"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-5 font-body text-[12.5px] font-medium text-slate">
            <Link href={user ? "/account" : "/login"} className="hidden sm:inline hover:text-ink">
              {user ? user.firstName ?? "Account" : "Sign in"}
            </Link>
            <Link href="/cart" className="text-accent">
              Bag {itemCount > 0 ? `· ${itemCount}` : ""}
            </Link>
            <button className="text-ink lg:hidden" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {/* category tabs */}
      <nav className="hidden border-b border-border bg-surface px-10 lg:flex lg:gap-6">
        {navLinks.map((link) => {
          const href = link.slug ? `/category/${link.slug}` : "/products";
          const active = pathname === href;
          return (
            <Link
              key={link.name}
              href={href}
              className={`border-b-2 py-2.5 font-body text-[12.5px] font-medium ${
                active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {menuOpen ? (
        <div className="flex flex-col gap-3 border-b border-border bg-surface px-5 py-4 font-body text-sm lg:hidden">
          <form onSubmit={submitSearch}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="w-full" />
          </form>
          {navLinks.map((link) => (
            <Link key={link.name} href={link.slug ? `/category/${link.slug}` : "/products"} onClick={() => setMenuOpen(false)} className="text-ink">
              {link.name}
            </Link>
          ))}
          <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="text-muted">
            {user ? "Account" : "Sign in"}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
