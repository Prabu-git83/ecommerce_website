import Link from "next/link";
import ProductCard from "./ProductCard";
import SortSelect from "./SortSelect";
import ProductFilters from "./ProductFilters";
import { apiGetWithMeta } from "@/lib/api";
import type { Category, ProductSummary } from "@/lib/types";

export default async function ProductListing({
  categorySlug,
  searchParams,
}: {
  categorySlug?: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (searchParams.sort) params.set("sort", searchParams.sort as string);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice as string);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice as string);
  if (searchParams.availability) params.set("availability", searchParams.availability as string);
  const brandFilter = searchParams.brand ? (Array.isArray(searchParams.brand) ? searchParams.brand : [searchParams.brand]) : [];
  brandFilter.forEach((b) => params.append("brand", b));

  const path = searchParams.q
    ? `/products/search?q=${encodeURIComponent(searchParams.q as string)}`
    : `/products?${params.toString()}`;

  const { data: items, meta } = await apiGetWithMeta<ProductSummary[]>(path, 30);
  const category = (meta?.category as Category | null | undefined) ?? null;
  const brands = (meta?.brands as string[] | undefined) ?? [];

  const heading = searchParams.q ? `Results for "${searchParams.q}"` : category?.name ?? "All products";
  const breadcrumb = searchParams.q ? "SEARCH" : category ? `HOME / ${category.slug.toUpperCase().replace(/-/g, " / ")}` : "HOME / SHOP";

  const filterCount =
    [searchParams.minPrice, searchParams.maxPrice, searchParams.availability].filter(Boolean).length + brandFilter.length;

  return (
    <div className="mx-auto max-w-content px-5 py-6 sm:px-10">
      <div className="font-mono text-[10.5px] text-faint">{breadcrumb}</div>

      <div className="mt-6 flex gap-8">
        {!searchParams.q ? (
          <aside className="hidden w-[200px] flex-none lg:block">
            <ProductFilters brands={brands} />
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-[20px] font-semibold text-ink">
              {heading} <span className="font-mono text-[12px] font-normal text-muted">{items.length} results</span>
            </h1>
            {!searchParams.q ? (
              <div className="flex items-center gap-3">
                {filterCount > 0 ? (
                  <span className="font-mono text-[11px] text-accent">Filters · {filterCount} active</span>
                ) : null}
                <SortSelect />
              </div>
            ) : null}
          </div>

          {items.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-10 text-sm text-muted">
              No products found.{" "}
              <Link href={categorySlug ? `/category/${categorySlug}` : "/products"} className="text-accent hover:underline">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
