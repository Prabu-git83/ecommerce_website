"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatMoney } from "@/lib/format";
import type { ProductVariant } from "@/lib/types";

export default function AddToCartPanel({ variants }: { variants: ProductVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants.find((v) => v.isDefault)?.id ?? variants[0]?.id);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const selected = useMemo(() => variants.find((v) => v.id === selectedId) ?? variants[0], [variants, selectedId]);
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  if (!selected) return null;

  const outOfStock = selected.qtyAvailable <= 0;

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(selected.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-body text-[22px] font-semibold text-ink">{formatMoney(selected.price)}</span>
        {selected.comparePrice ? (
          <span className="font-body text-[14px] text-faint line-through">{formatMoney(selected.comparePrice)}</span>
        ) : null}
      </div>

      {attributeKeys.map((key) => (
        <div key={key} className="mt-5">
          <div className="eyebrow mb-2 capitalize">{key}</div>
          <div className="flex flex-wrap gap-2">
            {variants
              .filter((v, idx, arr) => arr.findIndex((x) => x.attributes[key] === v.attributes[key]) === idx)
              .map((v) => {
                const isActive = selected.attributes[key] === v.attributes[key];
                const disabled = v.qtyAvailable <= 0;
                // Find the concrete variant matching current selection but with this option value.
                const target =
                  variants.find((x) =>
                    attributeKeys.every((k) => (k === key ? x.attributes[k] === v.attributes[key] : x.attributes[k] === selected.attributes[k]))
                  ) ?? v;
                return (
                  <button
                    key={v.attributes[key]}
                    onClick={() => setSelectedId(target.id)}
                    disabled={disabled && target.id === v.id}
                    className={`btn-pill border px-4 py-2 font-body text-[12.5px] ${
                      isActive
                        ? "border-ink bg-ink text-paper"
                        : disabled
                          ? "border-border-faint text-faint/60"
                          : "border-border-faint text-ink hover:border-ink"
                    }`}
                  >
                    {v.attributes[key]}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="rule mt-6 pt-4 font-body text-[13px] leading-relaxed text-muted">
        Standard delivery in 3-5 days · free over ₹999
        <br />
        {outOfStock ? (
          <span className="font-semibold text-warn">Out of stock</span>
        ) : (
          <span className="font-semibold text-accent">
            In stock{selected.lowStock ? ` · only ${selected.qtyAvailable} left` : ""}
          </span>
        )}{" "}
        · 7-day returns
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleAdd}
          disabled={outOfStock || adding}
          className="btn-pill flex h-12 flex-1 items-center justify-center bg-ink font-body text-[13.5px] font-medium text-paper disabled:opacity-40"
        >
          {outOfStock ? "Out of stock" : added ? "Added to bag" : adding ? "Adding…" : `Add to bag — ${formatMoney(selected.price)}`}
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="btn-pill flex h-12 w-12 items-center justify-center border border-border-faint text-ink hover:border-ink"
          aria-label="Go to bag"
        >
          ♡
        </button>
      </div>
    </div>
  );
}
