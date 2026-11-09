"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatTaka, type PublicProduct } from "@/lib/store";

export function AddToCart({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variants = product.hasVariants ? (product.variants ?? []) : [];
  const [variantId, setVariantId] = useState(() => variants.find((v) => v.isDefault)?.id ?? variants[0]?.id);
  const selected = variants.find((v) => v.id === variantId) ?? null;

  const price = selected?.price ?? product.price;
  const compareAtPrice = selected ? selected.compareAtPrice : product.compareAtPrice;
  const discount = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  function toCartItem() {
    return {
      productId: product.productId,
      variantId: selected?.id,
      variantLabel: selected?.label ?? undefined,
      slug: product.slug,
      name: product.name,
      image: selected?.imageUrl ?? product.thumbnailUrl,
      price,
    };
  }

  function handleAdd() {
    add(toCartItem(), qty);
    setAdded(true);
  }

  function handleBuyNow() {
    add(toCartItem(), qty);
    router.push("/checkout");
  }

  // Orderable regardless of current stock — a sale isn't turned away just
  // because the shelf is briefly empty; the backend never blocks order
  // creation on stock either (only later, when an admin marks an order
  // "Ready to Ship", which is the actual point stock has to be real).
  return (
    <div className="flex flex-col gap-3">
      {product.hasVariants && variants.length > 0 && (
        <>
          <div className="num flex items-baseline gap-2">
            <b className="font-display text-2xl text-amber-deep">{formatTaka(price)}</b>
            {compareAtPrice ? (
              <>
                <s className="text-sm text-muted">{formatTaka(compareAtPrice)}</s>
                {discount > 0 && (
                  <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                    {discount}% ছাড়
                  </span>
                )}
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                  v.id === variantId ? "border-leaf bg-leaf text-white" : "border-line text-ink"
                }`}
              >
                {v.label ?? "ভ্যারিয়েন্ট"}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center overflow-hidden rounded-xl border border-leaf">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-10 w-10 bg-leaf-soft text-lg font-bold text-leaf-deep"
          aria-label="কমান"
        >
          −
        </button>
        <span className="num w-10 text-center font-semibold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="h-10 w-10 bg-leaf-soft text-lg font-bold text-leaf-deep"
          aria-label="বাড়ান"
        >
          +
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl border border-leaf py-3 font-semibold text-leaf-deep"
        >
          {added ? "কার্টে যোগ হয়েছে" : "কার্টে যোগ করুন"}
        </button>
        <button type="button" onClick={handleBuyNow} className="rounded-xl bg-amber py-3 font-semibold text-white">
          এখনই কিনুন
        </button>
      </div>
    </div>
  );
}
