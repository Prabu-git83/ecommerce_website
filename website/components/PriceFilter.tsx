"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function PriceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(searchParams.get("minPrice") ?? "");
  const [max, setMax] = useState(searchParams.get("maxPrice") ?? "");

  const active = Boolean(searchParams.get("minPrice") || searchParams.get("maxPrice"));

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setMin("");
    setMax("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-body text-[13px] font-semibold text-ink">Filters</span>
        {active ? (
          <button onClick={clear} className="font-mono text-[11px] text-accent hover:underline">
            Clear
          </button>
        ) : null}
      </div>
      <form onSubmit={apply} className="mt-4">
        <div className="eyebrow mb-2">Price</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="!w-full !py-1.5 !text-[12px]"
          />
          <span className="text-faint">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="!w-full !py-1.5 !text-[12px]"
          />
        </div>
        <button
          type="submit"
          className="btn-pill mt-3 flex h-8 w-full items-center justify-center border border-border-strong text-[12px] font-medium text-ink hover:border-accent hover:text-accent"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
