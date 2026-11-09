"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { WHATSAPP_NUMBER, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { bnTaka } from "./product-deal-card";

const QUICK_QTYS = [1, 2, 3];

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
  const inStock = selected ? selected.inStock : product.inStock;

  const specBullets = (product.specifications ?? []).filter(
    (s) => !/origin|country|import|দেশ|আমদানি/i.test(s.key) && s.value.trim(),
  );

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
    <div className="flex flex-col gap-4">
      {product.hasVariants && variants.length > 0 && (
        <>
          <div className="num flex items-baseline gap-2">
            <b className="font-display text-2xl text-amber-deep">{bnTaka(price)}</b>
            {compareAtPrice ? (
              <>
                <s className="text-sm text-muted">{bnTaka(compareAtPrice)}</s>
                {discount > 0 && (
                  <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                    {bn(discount)}% ছাড়
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

      <div>
        {/* <p className="mb-1.5 text-sm font-semibold text-ink">পরিমাণ বাছাই করুন</p> */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_QTYS.map((n) => {
            const savings = compareAtPrice && compareAtPrice > price ? (compareAtPrice - price) * n : 0;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setQty(n)}
                className={`rounded-xl border py-2.5 text-center ${
                  qty === n ? "border-leaf bg-leaf-soft" : "border-line"
                }`}
              >
                <span className="num block text-sm font-bold text-ink">{bn(n)}টি,{bnTaka(price * n)}</span>
                {/* <span className="num block text-xs text-leaf-deep">{bnTaka(price * n)}</span> */}
                <span className="num block text-[11px] text-muted">
                  {n === 1 ? "একটি" : savings > 0 ? `সাশ্রয় ${bnTaka(savings)}` : " "}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-sm text-muted">
        {specBullets.map((s, i) => (
          <li key={i}>
            {s.key}: {s.value}
          </li>
        ))}
        <li>১০০% আসল, সিল করা প্যাকেট</li>
        <li>ক্যাশ অন ডেলিভারি</li>
      </ul>

      <p className={`text-sm font-semibold ${inStock ? "text-leaf-deep" : "text-danger"}`}>
        {inStock ? "স্টকে আছে" : "স্টকে নেই"}
      </p>

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

      {WHATSAPP_NUMBER && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`এই পণ্যটি নিয়ে জানতে চাই: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-leaf py-2.5 text-sm font-semibold text-leaf-deep"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.48 1.34 5l-1.42 5.18 5.3-1.39a9.96 9.96 0 0 0 4.78 1.22h.01c5.52 0 10-4.48 10-10s-4.49-10.01-10.01-10.01zm0 18.17h-.01a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.08.81.83-3-.2-.31a8.16 8.16 0 0 1-1.26-4.35c0-4.51 3.67-8.18 8.19-8.18 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.52-3.68 8.16-8.21 8.16zm4.48-6.12c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.96-.14.17-.29.19-.53.06-.25-.12-1.03-.38-1.97-1.21-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.17 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.11-.23-.17-.48-.29z" />
          </svg>
          এই পণ্য নিয়ে হোয়াটসঅ্যাপে জিজ্ঞেস করুন
        </a>
      )}
    </div>
  );
}
