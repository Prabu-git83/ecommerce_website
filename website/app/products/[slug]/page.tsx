import { notFound } from "next/navigation";
import PlaceholderImage from "@/components/PlaceholderImage";
import ProductCard from "@/components/ProductCard";
import AddToCartPanel from "@/components/AddToCartPanel";
import { apiGet } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await apiGet<ProductDetail>(`/products/${slug}`, 30).catch(() => null);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-content px-5 py-8 sm:px-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <PlaceholderImage
          src={product.images[0]}
          alt={product.name}
          label="full-bleed product shot"
          className="h-[360px] w-full sm:h-[520px]"
        />

        <div>
          <div className="eyebrow">
            ARCA{product.category ? ` · ${product.category.name.toUpperCase()}` : ""} · {product.variants[0]?.sku}
          </div>
          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[42px]">
            {product.name}
          </h1>
          <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6">
            <AddToCartPanel variants={product.variants} />
          </div>
        </div>
      </div>

      {product.related.length > 0 ? (
        <section className="mt-20">
          <div className="rule-strong pb-3.5 font-display text-xl font-extrabold tracking-tight text-ink">You may also like</div>
          <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
