"use client";

import { useEffect, useState } from "react";
import { ProductDealCard } from "./product-deal-card";
import { getProduct, type PublicProduct } from "@/lib/store";
import { getRecentlyViewedSlugs } from "@/lib/recently-viewed";

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
          <div key={p.productId} className="w-[168px] shrink-0 sm:w-[200px]">
            <ProductDealCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
