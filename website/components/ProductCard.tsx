import Link from "next/link";
import PlaceholderImage from "./PlaceholderImage";
import { formatMoney } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductSummary }) {
  const discountPct =
    product.comparePrice && product.price && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <Link href={`/products/${product.slug}`} className="group block overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md">
      <div className="relative">
        <PlaceholderImage src={product.image} alt={product.name} className="h-[168px] w-full sm:h-[190px]" />
        {discountPct ? (
          <span className="status-pill absolute left-2.5 top-2.5 bg-success-soft text-success-text">{discountPct}% OFF</span>
        ) : null}
      </div>
      <div className="p-3">
        <div className="font-display text-[13px] font-medium leading-snug text-ink group-hover:text-accent">{product.name}</div>
        {product.shortDesc ? <div className="mt-1 truncate text-[11.5px] text-faint">{product.shortDesc}</div> : null}
        <div className="mt-1.5 flex items-baseline gap-2">
          {product.price !== null ? <span className="font-body text-[13.5px] font-semibold text-ink">{formatMoney(product.price)}</span> : null}
          {product.comparePrice ? (
            <span className="font-body text-[11px] text-faint line-through">{formatMoney(product.comparePrice)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
