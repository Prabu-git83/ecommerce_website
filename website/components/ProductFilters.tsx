"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

export default function ProductFilters({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(searchParams.get("minPrice") ?? "");
  const [max, setMax] = useState(searchParams.get("maxPrice") ?? "");

  const selectedBrands = searchParams.getAll("brand");
  const availability = searchParams.get("availability");

  const active = Boolean(
    searchParams.get("minPrice") || searchParams.get("maxPrice") || availability || selectedBrands.length > 0
  );

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleAvailability(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (availability === value) params.delete("availability");
    else params.set("availability", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleBrand(brand: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("brand");
    params.delete("brand");
    const next = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
    next.forEach((b) => params.append("brand", b));
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setMin("");
    setMax("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("availability");
    params.delete("brand");
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

      <form onSubmit={applyPrice} className="mt-4">
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

      <div className="mt-6">
        <div className="eyebrow mb-2">Availability</div>
        <div className="flex flex-col gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-[12.5px] text-muted">
              <input
                type="checkbox"
                className="!w-auto"
                checked={availability === opt.value}
                onChange={() => toggleAvailability(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 ? (
        <div className="mt-6">
          <div className="eyebrow mb-2">Brand</div>
          <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-[12.5px] text-muted">
                <input type="checkbox" className="!w-auto" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} />
                {brand}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
