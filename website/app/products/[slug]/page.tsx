import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import AddToCartPanel from "@/components/AddToCartPanel";
import { apiGet } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await apiGet<ProductDetail>(`/products/${slug}`, 30).catch(() => null);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-content px-5 py-6 sm:px-10">
      <div className="font-mono text-[10.5px] text-faint">
        HOME{product.category ? ` / ${product.category.name.toUpperCase()}` : ""} · SKU {product.variants[0]?.sku}
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight text-ink sm:text-[30px]">{product.name}</h1>
          <p className="mt-2.5 max-w-[440px] text-[13.5px] leading-relaxed text-muted">{product.description}</p>

          <div className="mt-5">
            <AddToCartPanel variants={product.variants} />
          </div>
        </div>
      </div>

      {product.related.length > 0 ? (
        <section className="mt-14">
          <div className="rule-strong pb-3 font-display text-[17px] font-semibold text-ink">You may also like</div>
          <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
