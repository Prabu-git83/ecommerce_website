"use client";

import { useState } from "react";
import PlaceholderImage from "@/components/PlaceholderImage";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const slots = images.length > 0 ? images : [null];
  const active = slots[activeIdx] ?? slots[0];

  return (
    <div className="flex gap-3">
      {slots.length > 1 ? (
        <div className="flex w-[64px] flex-none flex-col gap-2.5 sm:w-[76px]">
          {slots.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`overflow-hidden rounded-lg border transition-colors ${
                idx === activeIdx ? "border-[1.5px] border-accent" : "border-border hover:border-faint"
              }`}
            >
              <PlaceholderImage src={img} alt={`${alt} thumbnail ${idx + 1}`} className="aspect-square w-full" />
            </button>
          ))}
        </div>
      ) : null}

      <PlaceholderImage
        src={active}
        alt={alt}
        label="product image"
        className="h-[360px] w-full rounded-lg border border-border sm:h-[440px]"
      />
    </div>
  );
}
