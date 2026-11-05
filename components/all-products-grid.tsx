"use client";

import { useState } from "react";
import { ProductDealCard } from "./product-deal-card";
import { getProducts, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

// Widest grid breakpoint (xl:grid-cols-5 below) — rows are only ever shown
// once full, so a dangling 2-of-5 row never appears. Narrower breakpoints
// (3 or 4 columns) may then show a row that isn't itself "full" at that
// width, but never more items than fit 5 per row at the widest size.
const COLS = 5;
const PAGE_SIZE = 10;

export function AllProductsGrid({
  initialItems,
  initialTotal,
  initialPage,
}: {
  initialItems: PublicProduct[];
  initialTotal: number;
  initialPage: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCount = Math.floor(items.length / COLS) * COLS;
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length < total;

  async function loadMore() {
    setError(null);
    setLoading(true);
    try {
      const next = await getProducts({ page: page + 1, limit: PAGE_SIZE });
      setItems((prev) => [...prev, ...next.items]);
      setPage(next.page);
      setTotal(next.total);
    } catch {
      setError("পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleItems.map((p) => (
          <ProductDealCard key={p.productId} product={p} />
        ))}
      </div>
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 block w-full rounded-xl border border-leaf py-3 text-center text-sm font-semibold text-leaf disabled:opacity-60"
        >
          {loading ? "লোড হচ্ছে…" : `পরের ${bn(PAGE_SIZE)}টি পণ্য দেখুন →`}
        </button>
      )}
    </div>
  );
}
