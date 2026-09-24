"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatMoney } from "@/lib/format";
import type { ProductVariant } from "@/lib/types";

const USD_RATE = 83.2;

function estimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

export default function AddToCartPanel({ variants }: { variants: ProductVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants.find((v) => v.isDefault)?.id ?? variants[0]?.id);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("560001");
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const eta = useMemo(() => estimatedDelivery(), []);

  const selected = useMemo(() => variants.find((v) => v.id === selectedId) ?? variants[0], [variants, selectedId]);
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  if (!selected) return null;

  const outOfStock = selected.qtyAvailable <= 0;
  const discountPct =
    selected.comparePrice && Number(selected.comparePrice) > Number(selected.price)
      ? Math.round(((Number(selected.comparePrice) - Number(selected.price)) / Number(selected.comparePrice)) * 100)
      : null;

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

  async function handleBuyNow() {
    setAdding(true);
    try {
      await addItem(selected.id, 1);
      router.push("/cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-body text-[24px] font-bold text-ink">{formatMoney(selected.price)}</span>
        {selected.comparePrice ? (
          <span className="font-body text-[13px] text-faint line-through">{formatMoney(selected.comparePrice)}</span>
        ) : null}
        {discountPct ? <span className="status-pill bg-success-soft text-success-text">{discountPct}% OFF</span> : null}
      </div>
      <div className="mt-1 font-mono text-[11px] text-faint">
        ${(Number(selected.price) / USD_RATE).toFixed(0)} USD · incl. GST
      </div>

      {attributeKeys.map((key) => (
        <div key={key} className="mt-5">
          <div className="font-body text-[12px] font-medium capitalize text-muted">{key}</div>
          <div className="mt-2 flex flex-wrap gap-2">
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
                    className={`btn-pill border px-3.5 py-2 font-body text-[12px] font-medium ${
                      isActive
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : disabled
                          ? "border-border text-faint line-through"
                          : "border-border text-muted hover:border-accent"
                    }`}
                  >
                    {v.attributes[key]}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="card mt-5 p-3.5 font-body text-[12px] text-muted">
        <div className="flex items-center justify-between">
          <span>Deliver to</span>
          <span className="flex items-center gap-2">
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="!w-[68px] !py-1 !px-2 text-right text-[12px]"
              maxLength={6}
              inputMode="numeric"
            />
            <span className="font-medium text-ink">{eta}</span>
          </span>
        </div>
        <div className="mt-1.5 flex justify-between">
          <span>Availability</span>
          {outOfStock ? (
            <span className="font-medium text-warn">Out of stock</span>
          ) : (
            <span className="font-medium text-success">In stock · {selected.qtyAvailable}</span>
          )}
        </div>
        <div className="mt-1.5 flex justify-between">
          <span>Returns</span>
          <span className="text-ink">7-day, free pickup</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={handleAdd}
          disabled={outOfStock || adding}
          className="btn-pill btn-primary flex h-11 flex-1 items-center justify-center font-body text-[13px] font-semibold disabled:opacity-40 disabled:shadow-none"
        >
          {outOfStock ? "Out of stock" : added ? "Added to cart" : adding ? "Adding…" : "Add to cart"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={outOfStock || adding}
          className="btn-pill flex h-11 flex-1 items-center justify-center border-[1.5px] border-accent font-body text-[13px] font-semibold text-accent disabled:opacity-40"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
