import Link from "next/link";
import PlaceholderImage from "./PlaceholderImage";
import { formatMoney } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <PlaceholderImage src={product.image} alt={product.name} className="h-[168px] w-full sm:h-[220px]" />
      <div className="mt-2.5 font-display text-[15px] font-semibold leading-snug text-ink group-hover:underline">{product.name}</div>
      {product.shortDesc ? <div className="mt-1 text-[12.5px] text-muted">{product.shortDesc}</div> : null}
      <div className="mt-1.5 flex items-baseline gap-2">
        {product.price !== null ? <span className="font-body text-[13.5px] font-semibold text-ink">{formatMoney(product.price)}</span> : null}
        {product.comparePrice ? (
          <span className="font-body text-[11.5px] text-faint line-through">{formatMoney(product.comparePrice)}</span>
        ) : null}
      </div>
    </Link>
  );
}
