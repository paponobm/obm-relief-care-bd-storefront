"use client";

import { useState } from "react";
import { AddToCart } from "./add-to-cart";
import { ProductGallery } from "./product-gallery";
import { bn } from "@/lib/bn-digits";
import { bnTaka, COUNTRY_FLAGS } from "./product-deal-card";
import type { PublicProduct } from "@/lib/store";

// Pulled out of the product page (a server component) only so the gallery
// and AddToCart — otherwise unrelated siblings — can share which variant is
// selected: picking one with its own photo swaps the gallery's main image,
// the same way clicking a thumbnail does. Same exact markup/classes the
// page had inline before.
export function ProductDetailGrid({
  product,
  category,
  origin,
  discount,
}: {
  product: PublicProduct;
  category: { name: string } | null;
  origin: string | null;
  discount: number;
}) {
  const [variantImage, setVariantImage] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <ProductGallery
        product={product}
        categoryName={category?.name ?? null}
        discount={discount}
        activeImage={variantImage}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="w-fit rounded-md bg-leaf-soft px-2 py-0.5 text-sm font-semibold text-leaf-deep">
              {category.name}
            </span>
          )}
          {origin && (
            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-amber-soft px-2 py-0.5 text-sm font-semibold text-amber-deep">
              {COUNTRY_FLAGS[origin] ? `${COUNTRY_FLAGS[origin]} ` : ""}
              {origin}-এ তৈরি
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl leading-tight">{product.name}</h1>
        {/* A variant product's real price depends on which variant is
            picked, so AddToCart (below) owns that display reactively —
            this static block would just show a meaningless base price. */}
        {!product.hasVariants && (
          <div className="num flex items-baseline gap-2">
            <b className="font-display text-2xl text-amber-deep">{bnTaka(product.price)}</b>
            {discount > 0 && (
              <>
                <s className="text-sm text-muted">{bnTaka(product.compareAtPrice!)}</s>
                <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                  {bn(discount)}% ছাড়
                </span>
              </>
            )}
          </div>
        )}
        {product.slogan && <p className="text-base text-muted">{product.slogan}</p>}
        <AddToCart
          product={product}
          onVariantChange={(v) => setVariantImage(v?.imageUrl ?? null)}
        />
      </div>
    </div>
  );
}
