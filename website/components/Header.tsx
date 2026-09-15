"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Category } from "@/lib/types";

export default function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const itemCount = useCartStore((s) => s.itemCount);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  const navLinks = [{ name: "New in", slug: "" }, ...categories.map((c) => ({ name: c.name, slug: c.slug }))];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center gap-7 px-5 py-4 sm:px-10">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
          ARCA
        </Link>

        <nav className="hidden flex-1 items-center gap-6 font-body text-[13px] text-ink lg:flex">
          {navLinks.map((link) => {
            const href = link.slug ? `/category/${link.slug}` : "/products";
            const active = pathname === href;
            return (
              <Link
                key={link.name}
                href={href}
                className={active ? "border-b-2 border-accent pb-0.5 font-semibold" : "text-ink/90 hover:text-ink"}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-5 font-body text-[13px] text-muted">
          {searchOpen ? (
            <form onSubmit={submitSearch} className="hidden items-center sm:flex">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Search products…"
                className="!w-48 !py-2 !text-[13px]"
              />
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="hidden sm:inline hover:text-ink">
              Search
            </button>
          )}
          <Link href={user ? "/account" : "/login"} className="hidden sm:inline hover:text-ink">
            {user ? user.firstName ?? "Account" : "Account"}
          </Link>
          <Link href="/cart" className="font-semibold text-ink">
            Bag {itemCount > 0 ? `(${itemCount})` : ""}
          </Link>
          <button
            className="text-ink lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="flex flex-col gap-3 border-t border-border px-5 py-4 font-body text-sm lg:hidden">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.slug ? `/category/${link.slug}` : "/products"} onClick={() => setMenuOpen(false)} className="text-ink">
              {link.name}
            </Link>
          ))}
          <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="text-muted">
            {user ? "Account" : "Sign in"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
