import ProductCard from "./ProductCard";
import SortSelect from "./SortSelect";
import { apiGetWithMeta } from "@/lib/api";
import type { Category, ProductSummary } from "@/lib/types";

export default async function ProductListing({
  categorySlug,
  searchParams,
}: {
  categorySlug?: string;
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);

  const path = searchParams.q
    ? `/products/search?q=${encodeURIComponent(searchParams.q)}`
    : `/products?${params.toString()}`;

  const { data: items, meta } = await apiGetWithMeta<ProductSummary[]>(path, 30);
  const category = (meta?.category as Category | null | undefined) ?? null;

  const heading = searchParams.q ? `Results for "${searchParams.q}"` : category?.name ?? "All products";
  const eyebrow = searchParams.q ? "Search" : category ? category.slug.toUpperCase().replace(/-/g, " / ") : "Shop";

  return (
    <div className="mx-auto max-w-content px-5 py-8 sm:px-10 sm:py-12">
      <div className="eyebrow">{eyebrow}</div>
      <div className="rule-strong mt-2 flex flex-wrap items-end justify-between gap-3 pb-4">
        <h1 className="font-display text-[30px] font-extrabold tracking-tight text-ink sm:text-[34px]">{heading}</h1>
        <div className="flex items-center gap-5 text-[12.5px] text-muted">
          <span>{items.length} items</span>
          {!searchParams.q ? <SortSelect /> : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted">No products found.</p>
      )}
    </div>
  );
}
