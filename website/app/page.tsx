import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import type { ProductSummary, ActiveBanner } from "@/lib/types";

export default async function HomePage() {
  const [featured, banner] = await Promise.all([
    apiGet<ProductSummary[]>("/products/featured?limit=10", 60).catch(() => []),
    apiGet<ActiveBanner>("/banner/active", 30).catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-content px-5 py-6 sm:px-10">
      <section className="flex flex-col gap-4 sm:flex-row">
        <div
          className="flex flex-1 flex-col justify-center rounded-lg p-7 text-white sm:p-9"
          style={
            banner?.banner_image_url
              ? {
                  backgroundImage: `linear-gradient(100deg, rgb(var(--color-ink) / 0.6), rgb(var(--color-ink) / 0.35)), url(${banner.banner_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: "linear-gradient(100deg, rgb(var(--color-accent)), rgb(var(--color-accent-dark)))" }
          }
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-80">
            {banner?.banner_eyebrow || "Banner · New season"}
          </span>
          <h1 className="mt-2.5 font-display text-[30px] font-semibold leading-[1.15] tracking-tight sm:text-[38px]">
            {banner?.banner_heading || "The Monsoon Edit"}
          </h1>
          <p className="mt-1.5 max-w-[380px] text-[14px] opacity-90">
            {banner?.banner_subtext || "Up to 40% off across electronics, home and wardrobe — ends Sunday."}
          </p>
          <Link
            href={banner?.banner_cta_link || "/products"}
            className="btn-pill mt-5 inline-flex w-fit items-center bg-white px-5 py-2.5 font-body text-[12.5px] font-semibold text-accent-dark"
          >
            {banner?.banner_cta_label || "Shop the edit"}
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:max-w-[280px]">
          <Link href="/account/orders" className="card flex-1 p-4 hover:border-accent">
            <div className="font-body text-[13px] font-semibold text-ink">Your order history</div>
            <div className="mt-1 text-[11.5px] text-muted">Reorder something you loved</div>
          </Link>
          <Link href="/account/orders" className="card flex-1 p-4 hover:border-accent">
            <div className="font-body text-[13px] font-semibold text-ink">Track an order</div>
            <div className="mt-1 text-[11.5px] text-success">View live delivery status</div>
          </Link>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[17px] font-semibold text-ink">Featured</h2>
          <Link href="/products" className="text-[12px] font-medium text-accent hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
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
