"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddToCart } from "./add-to-cart";
import { ProductArt } from "./product-art";
import { bn } from "@/lib/bn-digits";
import { bnTaka, COUNTRY_FLAGS, importCountry } from "./product-deal-card";
import type { PublicProduct } from "@/lib/store";

// Mounted once (see layout.tsx) — listens for QuickViewTrigger's event
// instead of taking the product as a prop, so any product card anywhere in
// the tree can open it without threading state through every page in
// between. Same product object the card already had (list endpoints already
// return everything AddToCart needs — price, variants, specs, stock), so
// opening this never costs an extra fetch.
export function QuickViewModal() {
  const [product, setProduct] = useState<PublicProduct | null>(null);

  useEffect(() => {
    function onQuickView(e: Event) {
      setProduct((e as CustomEvent<PublicProduct>).detail);
    }
    window.addEventListener("relief-care:quick-view", onQuickView);
    return () => window.removeEventListener("relief-care:quick-view", onQuickView);
  }, []);

  // Background stays put behind the drawer elsewhere on this site, but a
  // centered preview reads better pinned in place while it's open.
  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [product]);

  if (!product) return null;

  function close() {
    setProduct(null);
  }

  const category = product.category ?? product.categories?.[0] ?? null;
  const origin = importCountry(product);
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div
      onClick={close}
      aria-hidden
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface p-5 sm:rounded-card"
      >
        <button
          type="button"
          onClick={close}
          aria-label="বন্ধ করুন"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-bg text-lg text-ink"
        >
          ×
        </button>

        <div className="relative mx-auto mb-3 aspect-square w-full max-w-[220px] overflow-hidden rounded-xl bg-leaf-soft">
          <ProductArt name={product.name} categoryName={category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
        </div>

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

          <h2 className="font-display text-xl leading-tight">{product.name}</h2>

          {/* A variant product's real price depends on which variant is
              picked, so AddToCart (below) owns that display reactively —
              same reasoning as the full product page. */}
          {!product.hasVariants && (
            <div className="num flex items-baseline gap-2">
              <b className="font-display text-xl text-amber-deep">{bnTaka(product.price)}</b>
              {product.compareAtPrice ? (
                <>
                  <s className="text-sm text-muted">{bnTaka(product.compareAtPrice)}</s>
                  {discount > 0 && (
                    <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                      {bn(discount)}% ছাড়
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}

          {product.slogan && <p className="text-sm text-muted">{product.slogan}</p>}

          <AddToCart product={product} />

          <Link
            href={`/product/${product.slug}`}
            onClick={close}
            className="block w-full rounded-xl border border-line py-2.5 text-center text-sm font-semibold text-ink"
          >
            বিস্তারিত দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}
