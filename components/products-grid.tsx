"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { getProducts, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

// Same "load more, accumulate" pattern as the homepage's সকল পণ্য grid
// (components/all-products-grid.tsx) — 20 shown initially, each click
// fetches 20 more and appends them rather than replacing the grid, so the
// filters above (category/search/price) never get re-applied by a fresh
// page reload. Kept as this page's own component (not a shared one) since
// it uses ProductCard, not ProductDealCard, and carries this page's own
// filter params on every "load more" fetch.
const PAGE_SIZE = 20;

export function ProductsGrid({
  initialItems,
  initialTotal,
  initialPage,
  categoryId,
  search,
  minPrice,
  maxPrice,
}: {
  initialItems: PublicProduct[];
  initialTotal: number;
  initialPage: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = items.length < total;

  async function loadMore() {
    setError(null);
    setLoading(true);
    try {
      const next = await getProducts({
        categoryId,
        search,
        minPrice,
        maxPrice,
        page: page + 1,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...next.items]);
      setPage(next.page);
      setTotal(next.total);
    } catch {
      setError("পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="rounded-card bg-surface p-8 text-center text-muted">কোনো পণ্য পাওয়া যায়নি।</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p) => (
          <ProductCard key={p.productId} product={p} />
        ))}
      </div>
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-5 block w-full rounded-xl border border-leaf py-3 text-center text-sm font-sans font-semibold text-leaf disabled:opacity-60"
        >
          {loading ? "লোড হচ্ছে…" : `পরের ${bn(PAGE_SIZE)}টি পণ্য দেখুন →`}
        </button>
      )}
    </div>
  );
}
