"use client";

import { useState } from "react";
import type { PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { ProductArt } from "./product-art";

// Real photos only — `thumbnailUrl` plus the admin-uploaded `images` list,
// deduped. No placeholder/sample images are ever added to this list.
export function ProductGallery({
  product,
  categoryName,
  discount,
}: {
  product: PublicProduct;
  categoryName: string | null;
  discount: number;
}) {
  const gallery = Array.from(
    new Set([product.thumbnailUrl, ...product.images].filter((u): u is string => Boolean(u))),
  );
  const [active, setActive] = useState<string | null>(gallery[0] ?? null);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-leaf-soft sm:aspect-square">
        {!product.hasVariants && discount > 0 && (
          <span className="num absolute left-3 top-3 z-10 rounded-md bg-danger px-2 py-1 text-sm font-bold text-white">
            -{bn(discount)}%
          </span>
        )}
        <ProductArt name={product.name} categoryName={categoryName} thumbnailUrl={active} />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {gallery.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(url)}
              aria-label={product.name}
              aria-pressed={active === url}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-leaf-soft ${
                active === url ? "border-leaf" : "border-transparent"
              }`}
            >
              <ProductArt
                name={product.name}
                categoryName={categoryName}
                thumbnailUrl={url}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
