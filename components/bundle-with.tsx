"use client";

import { Fragment, useState } from "react";
import { useCart } from "@/lib/cart";
import type { PublicProduct } from "@/lib/store";
import { ProductArt } from "./product-art";
import { bnTaka } from "./product-deal-card";

function BundleTile({
  name,
  price,
  image,
  checked,
  disabled,
  label,
  onToggle,
}: {
  name: string;
  price: number;
  image: string | null;
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onToggle?: () => void;
}) {
  return (
    <label
      className={`flex w-[108px] shrink-0 flex-col items-center gap-1.5 rounded-card border p-2.5 text-center ${
        checked ? "border-leaf bg-leaf-soft" : "border-line opacity-60"
      } ${disabled ? "" : "cursor-pointer"}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} className="h-4 w-4 accent-leaf" />
      <div className="h-12 w-12 overflow-hidden rounded-lg bg-surface">
        <ProductArt name={name} categoryName={null} thumbnailUrl={image} className="h-full w-full object-cover" />
      </div>
      {label && <span className="text-[10px] font-bold text-leaf-deep">{label}</span>}
      <span className="line-clamp-2 text-xs font-medium leading-snug text-ink">{name}</span>
      <b className="num text-xs text-amber-deep">{bnTaka(price)}</b>
    </label>
  );
}

// "এর সাথে মানানসই" — lets a shopper bundle this product with related ones
// (from the symptom-quiz COMPLEMENT map, same real catalog data used for the
// plain related-products grid elsewhere) and add all checked items with one
// tap. Every name/price/image here is the real product's own data; nothing
// is invented, and there's no fake "bundle discount" since none exists.
export function BundleWith({ product, related }: { product: PublicProduct; related: PublicProduct[] }) {
  const { add } = useCart();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(related.map((p) => [p.productId, true])),
  );
  const [added, setAdded] = useState(false);

  if (related.length === 0) return null;

  const selected = related.filter((p) => checked[p.productId]);
  const total = product.price + selected.reduce((sum, p) => sum + p.price, 0);

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
    setAdded(false);
  }

  function addAll() {
    add(
      { productId: product.productId, slug: product.slug, name: product.name, image: product.thumbnailUrl, price: product.price },
      1,
    );
    selected.forEach((p) =>
      add({ productId: p.productId, slug: p.slug, name: p.name, image: p.thumbnailUrl, price: p.price }, 1),
    );
    setAdded(true);
  }

  return (
    <section className="rounded-card border border-dashed border-amber bg-amber-soft p-4">
      <h2 className="font-display text-lg">এর সাথে মানানসই</h2>
      <p className="mb-3 text-xs text-muted">একসাথে নিলে ডেলিভারির চার্জ একবারই লাগবে</p>
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        <BundleTile name={product.name} price={product.price} image={product.thumbnailUrl} checked disabled label="এই পণ্য" />
        {related.map((p) => (
          <Fragment key={p.productId}>
            <span className="self-center text-lg text-muted">+</span>
            <BundleTile
              name={p.name}
              price={p.price}
              image={p.thumbnailUrl}
              checked={!!checked[p.productId]}
              onToggle={() => toggle(p.productId)}
            />
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <span className="block text-xs text-muted">মোট</span>
          <b className="num font-display text-xl text-amber-deep">{bnTaka(total)}</b>
        </div>
        <button
          type="button"
          onClick={addAll}
          className="shrink-0 rounded-xl bg-amber px-4 py-2.5 text-sm font-semibold text-white"
        >
          {added ? "কার্টে যোগ হয়েছে" : "সবগুলো কার্টে যোগ করুন"}
        </button>
      </div>
    </section>
  );
}
