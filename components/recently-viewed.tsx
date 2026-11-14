"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductArt } from "./product-art";
import { MiniAddToCart } from "./mini-add-to-cart";
import { QuickViewTrigger } from "./quick-view-trigger";
import { bnTaka } from "./product-deal-card";
import { getProduct, type PublicProduct } from "@/lib/store";
import { getRecentlyViewedSlugs } from "@/lib/recently-viewed";
import { bn } from "@/lib/bn-digits";

// Image on the left, name/price/buy-control on the right — this section's
// own card design, deliberately separate from ProductDealCard (which stays
// untouched for Flash Deal and the homepage's সকল পণ্য grid).
function RecentlyViewedCard({ product }: { product: PublicProduct }) {
  return (
    <div className="flex h-full w-full items-center gap-3 overflow-hidden rounded-card border border-line bg-surface p-2.5">
      <QuickViewTrigger
        product={product}
        className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-leaf-soft"
      >
        <ProductArt name={product.name} categoryName={product.category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
      </QuickViewTrigger>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <QuickViewTrigger product={product} className="line-clamp-2 text-left text-sm font-semibold leading-snug text-ink">
          {product.name}
        </QuickViewTrigger>

        {product.hasVariants ? (
          <div className="num flex items-baseline gap-1">
            <b className="font-display text-base font-bold text-amber-deep">
              {bnTaka(product.minPrice ?? product.price)}
              {product.maxPrice !== undefined && product.maxPrice !== product.minPrice
                ? `–${bnTaka(product.maxPrice)}`
                : ""}
            </b>
          </div>
        ) : (
          <div className="num flex items-baseline gap-2">
            <b className="font-display text-base font-bold text-amber-deep">{bnTaka(product.price)}</b>
            {product.compareAtPrice ? <s className="font-sans text-xs text-muted">{bnTaka(product.compareAtPrice)}</s> : null}
          </div>
        )}

        {product.hasVariants ? (
          <Link
            href={`/product/${product.slug}`}
            className="mt-0.5 w-fit rounded-lg border border-orange bg-transparent px-3 py-1 text-center text-xs font-semibold text-leaf"
          >
            {product.variantOptionLabel ? `${bn(product.variantCount ?? 0)}টি ${product.variantOptionLabel}` : "ভ্যারিয়েন্ট"}{" "}
            · বাছুন
          </Link>
        ) : (
          <MiniAddToCart product={product} />
        )}
      </div>
    </div>
  );
}

// "সম্প্রতি দেখেছেন" — this viewer's own browsing history (localStorage),
// re-fetched live by slug so a product that's gone unpublished since being
// viewed silently drops, same honesty rule as every admin-curated section on
// this page. Entirely client-side: the history only exists in this browser,
// so there's nothing for the server to render.
export function RecentlyViewed() {
  const [items, setItems] = useState<PublicProduct[] | null>(null);

  useEffect(() => {
    const slugs = getRecentlyViewedSlugs(10);
    if (slugs.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    Promise.all(slugs.map((slug) => getProduct(slug).catch(() => null))).then((results) => {
      if (!cancelled) setItems(results.filter((p): p is PublicProduct => p !== null));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="mb-3 font-bold text-2xl">
        সম্প্রতি <span className="text-amber">দেখেছেন</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {items.map((p) => (
          <div key={p.productId} className="w-[260px] shrink-0 sm:w-[300px]">
            <RecentlyViewedCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
