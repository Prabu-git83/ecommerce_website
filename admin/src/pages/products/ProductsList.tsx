import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusText from "@/components/StatusText";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Category, ProductListItem } from "@/lib/types";

function stockStatus(item: ProductListItem): { status: string; label: string } {
  if (item.status !== "active") return { status: item.status, label: item.status };
  if (item.totalStock <= 0) return { status: "out_of_stock", label: "Out of stock" };
  return { status: "in_stock", label: "Active" };
}

export default function ProductsList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    apiGet<Category[]>("/admin/categories").then(setCategories);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (q) params.set("q", q);
    apiGet<ProductListItem[]>(`/admin/products?${params.toString()}`).then(setProducts);
  }, [activeCategory, q]);

  return (
    <div>
      <PageHeader
        title="Products"
        sub={products ? `${products.length} shown` : undefined}
        actions={
          <>
            <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="!w-48 !py-1.5" />
            <Link to="/products/new" className="btn-pill btn-primary px-5 py-2 font-medium">
              New product
            </Link>
          </>
        }
      />

      <div className="flex">
        <div className="w-[180px] flex-none border-r border-border bg-surface px-5 pt-5">
          <div className="eyebrow mb-3">Categories</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-left text-[12.5px] ${!activeCategory ? "font-semibold text-accent" : "text-muted hover:text-ink"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => setActiveCategory(c.slug)}
                  className={`flex w-full justify-between text-left text-[12.5px] ${
                    activeCategory === c.slug ? "font-semibold text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="font-mono text-[10.5px]">{c.productCount}</span>
                </button>
                {c.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveCategory(child.slug)}
                    className={`mt-2 flex w-full justify-between pl-3 text-left text-[12.5px] ${
                      activeCategory === child.slug ? "font-semibold text-accent" : "text-muted hover:text-ink"
                    }`}
                  >
                    <span>{child.name}</span>
                    <span className="font-mono text-[10.5px]">{child.productCount}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-8 pt-5">
          <div className="table-card">
            <div className="table-head grid grid-cols-[minmax(0,1fr)_110px_88px_64px_102px_50px] gap-3 px-4 py-2.5">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span></span>
            </div>
            {products === null ? (
              <p className="px-4 py-4 text-[13px] text-muted">Loading…</p>
            ) : products.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-muted">No products found.</p>
            ) : (
              products.map((p) => {
                const stock = stockStatus(p);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[minmax(0,1fr)_110px_88px_64px_102px_50px] items-center gap-3 border-b border-chrome px-4 py-2.5 last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="stripe-placeholder h-8 w-8 flex-none rounded-md bg-cover bg-center"
                        style={p.image ? { backgroundImage: `url(${p.image})` } : undefined}
                      />
                      <span className="truncate text-[13px] text-ink">{p.name}</span>
                    </span>
                    <span className="truncate text-[12px] text-muted">{p.category?.name ?? "—"}</span>
                    <span className="text-[13px] font-semibold text-ink">{p.price !== null ? formatMoney(p.price) : "—"}</span>
                    <span className={`font-mono text-[12px] ${p.totalStock <= 5 ? "text-warning" : "text-ink"}`}>{p.totalStock}</span>
                    <StatusText status={stock.status} label={stock.label} />
                    <Link to={`/products/${p.id}`} className="font-medium text-[12px] text-accent hover:underline">
                      Edit
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
