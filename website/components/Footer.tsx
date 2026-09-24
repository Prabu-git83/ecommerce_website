import Link from "next/link";

export default function Footer({ logoUrl }: { logoUrl?: string }) {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div>
            <div className="font-display text-lg font-extrabold text-ink">
              {logoUrl ? <img src={logoUrl} alt="ARCA" className="h-8 w-auto max-w-[160px] object-contain" /> : "ARCA"}
            </div>
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-muted">
              Forty pieces chosen each season, across electronics, home and wardrobe.
            </p>
          </div>
          <div>
            <div className="eyebrow">Shop</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink">
              <li><Link href="/products" className="hover:text-accent">All products</Link></li>
              <li><Link href="/category/electronics" className="hover:text-accent">Electronics</Link></li>
              <li><Link href="/category/fashion" className="hover:text-accent">Fashion</Link></li>
              <li><Link href="/category/home" className="hover:text-accent">Home</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow">Account</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink">
              <li><Link href="/account" className="hover:text-accent">Your profile</Link></li>
              <li><Link href="/account/orders" className="hover:text-accent">Orders</Link></li>
              <li><Link href="/cart" className="hover:text-accent">Bag</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow">Company</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink">
              <li><Link href="/about" className="hover:text-accent">About us</Link></li>
              <li><Link href="/contact" className="hover:text-accent">Contact us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-faint sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Arca. All rights reserved.</span>
          <span>Card · UPI · Wallet · COD</span>
        </div>
      </div>
    </footer>
  );
}
