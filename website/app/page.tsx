import Link from "next/link";
import PlaceholderImage from "@/components/PlaceholderImage";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";

export default async function HomePage() {
  const featured = await apiGet<ProductSummary[]>("/products/featured?limit=8", 60).catch(() => []);

  return (
    <div className="mx-auto max-w-content px-5 sm:px-10">
      <section className="flex flex-col gap-8 border-b border-border py-10 sm:flex-row sm:items-center sm:py-16">
        <div className="flex-1">
          <div className="eyebrow">Banner · New season</div>
          <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.02] tracking-tight text-ink sm:text-[56px]">
            The Monsoon
            <br />
            Edit
          </h1>
          <p className="mt-4 max-w-[380px] text-[15px] leading-relaxed text-muted">
            Forty pieces chosen for the season, across electronics, home and wardrobe. Considered goods, made to last.
          </p>
          <Link
            href="/products"
            className="btn-pill mt-6 inline-flex items-center bg-ink px-6 py-3 font-body text-[13px] font-medium text-paper hover:opacity-90"
          >
            Shop the edit
          </Link>
        </div>
        <PlaceholderImage
          alt="Editorial hero"
          label="editorial hero image"
          className="h-[220px] w-full flex-1 sm:h-[320px]"
        />
      </section>

      <section className="py-10 sm:py-14">
        <div className="rule-strong flex items-end justify-between pb-3.5">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">Featured</h2>
          <Link href="/products" className="text-[12.5px] text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {featured.length === 0 ? (
          <p className="mt-8 text-sm text-muted">
            No products yet — run <code className="font-mono">npm run db:seed</code> in the backend to load the catalogue.
          </p>
        ) : null}
      </section>
    </div>
  );
}
