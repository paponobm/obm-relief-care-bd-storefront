"use client";

import { useState } from "react";
import { bnTaka } from "./product-deal-card";

// "Filter by price" — a dual-handle range slider between this page's own
// real lowest and highest product price (from the price-range endpoint),
// not a fixed/guessed scale. Dragging only updates the live "Price: X — Y"
// label; the actual re-filter (a fresh server fetch with minPrice/maxPrice)
// only happens on FILTER, matching the reference design's separate button.
export function PriceRangeSlider({
  bounds,
  initialMin,
  initialMax,
  categoryId,
  search,
}: {
  bounds: { min: number; max: number };
  initialMin: number;
  initialMax: number;
  categoryId?: string;
  search?: string;
}) {
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);

  function buildHref(nextMin: number, nextMax: number) {
    const qs = new URLSearchParams();
    if (categoryId) qs.set("category", categoryId);
    if (search) qs.set("search", search);
    if (nextMin > bounds.min) qs.set("minPrice", String(nextMin));
    if (nextMax < bounds.max) qs.set("maxPrice", String(nextMax));
    const s = qs.toString();
    return s ? `/products?${s}` : "/products";
  }

  // A flat catalog (every matching product the same price) has nothing to
  // drag — min === max would also divide by zero below.
  if (bounds.min >= bounds.max) return null;

  const span = bounds.max - bounds.min;
  const minPct = ((minVal - bounds.min) / span) * 100;
  const maxPct = ((maxVal - bounds.min) / span) * 100;

  function onMinChange(v: number) {
    setMinVal(Math.min(v, maxVal));
  }
  function onMaxChange(v: number) {
    setMaxVal(Math.max(v, minVal));
  }

  const thumb =
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-deep " +
    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white " +
    "[&::-moz-range-thumb]:bg-amber-deep";

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-3 font-semibold text-ink">দাম অনুযায়ী ফিল্টার</h2>
      <div className="relative h-4">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-amber-deep"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={minVal}
          onChange={(e) => onMinChange(Number(e.target.value))}
          className={`pointer-events-none absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent ${thumb}`}
          style={{ zIndex: 3 }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={maxVal}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          className={`pointer-events-none absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent ${thumb}`}
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="num text-sm text-muted">
          দাম: {bnTaka(minVal)} — {bnTaka(maxVal)}
        </span>
        <button
          type="button"
          // A full navigation rather than router.push — this route's
          // client-side router cache doesn't refetch on a searchParams-only
          // change here (same pre-existing quirk noted in combo-builder.tsx),
          // so a soft push silently leaves the URL/results unchanged.
          onClick={() => {
            window.location.href = buildHref(minVal, maxVal);
          }}
          className="shrink-0 rounded-full border border-leaf bg-leaf px-4 py-1.5 text-sm font-medium text-white"
        >
          ফিল্টার
        </button>
      </div>
    </div>
  );
}
