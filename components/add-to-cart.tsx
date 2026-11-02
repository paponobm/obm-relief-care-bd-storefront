"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { PublicProduct } from "@/lib/store";

export function AddToCart({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function toCartItem() {
    return {
      productId: product.productId,
      slug: product.slug,
      name: product.name,
      image: product.thumbnailUrl,
      price: product.price,
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

  if (!product.inStock) {
    return <p className="font-semibold text-danger">এই মুহূর্তে স্টকে নেই</p>;
  }

  return (
    <div className="flex flex-col gap-3">
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
