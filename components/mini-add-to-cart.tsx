"use client";

import { useCart } from "@/lib/cart";
import type { PublicProduct } from "@/lib/store";

// The Flash Deal card's compact cart control — a single full-width button
// until it's in the cart, then a stepper, matching the reference design.
// Only for simple (non-variant) products; a variant product links to its
// own page instead (see FlashDealCard) since a unit has to be picked first.
export function MiniAddToCart({ product }: { product: PublicProduct }) {
  const { items, add, setQuantity, remove } = useCart();
  const line = items.find((x) => x.productId === product.productId);

  // Orderable regardless of current stock — a sale isn't turned away just
  // because the shelf is briefly empty; the backend never blocks order
  // creation on stock either (only later, when an admin marks an order
  // "Ready to Ship", which is the actual point stock has to be real).
  if (!line) {
    return (
      <button
        type="button"
        onClick={() =>
          add(
            {
              productId: product.productId,
              slug: product.slug,
              name: product.name,
              image: product.thumbnailUrl,
              price: product.price,
            },
            1,
          )
        }
        className="block w-full rounded-lg bg-amber py-1.5 text-center text-md font-semibold text-white"
      >
        + কার্টে যোগ করুন
      </button>
    );
  }

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-leaf">
      <button
        type="button"
        onClick={() => (line.quantity <= 1 ? remove(product.productId) : setQuantity(product.productId, line.quantity - 1))}
        className="h-8 flex-1 bg-leaf-soft text-sm font-bold text-leaf-deep"
        aria-label="কমান"
      >
        −
      </button>
      <span className="num w-8 shrink-0 text-center text-sm font-semibold">{line.quantity}</span>
      <button
        type="button"
        onClick={() => setQuantity(product.productId, line.quantity + 1)}
        className="h-8 flex-1 bg-leaf-soft text-sm font-bold text-leaf-deep"
        aria-label="বাড়ান"
      >
        +
      </button>
    </div>
  );
}
