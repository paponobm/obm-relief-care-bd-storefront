"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { QuantityDiscount } from "./store";

export interface CartItem {
  productId: string;
  // Set when this line is a specific variant, not the base product — two
  // variants of the same product are different lines (different price),
  // so every lookup/match below keys on productId+variantId together, not
  // productId alone.
  variantId?: string;
  variantLabel?: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  // The real, undiscounted per-unit price. Only set by callers that want
  // this line's `price` to keep re-tiering itself (via qtyDiscountRate)
  // whenever its quantity changes in the cart — add()/setQuantity() below
  // recompute `price` from it on every quantity change. Left unset by
  // callers with their own separate pricing (e.g. the combo builder's own
  // combo-tier discount), which leaves `price` untouched, same as before
  // this field existed.
  basePrice?: number;
  quantity: number;
}

// Site-wide bulk-order pricing — Settings → Other Settings → Quantity
// discounts (e.g. 2 → 5% off, 3 → 10% off). The highest-quantity tier a
// given quantity actually reaches wins (not stacked); quantity 1 is always
// the free baseline, same as before this was admin-configurable. The single
// source of truth for every quantity control that opts into it (product
// page buy box, cart drawer).
export function qtyDiscountRate(n: number, tiers: QuantityDiscount[]): number {
  const best = tiers
    .filter((t) => t.quantity <= n)
    .sort((a, b) => b.quantity - a.quantity)[0];
  return best ? best.discountPercent / 100 : 0;
}

function tierPrice(
  basePrice: number,
  quantity: number,
  tiers: QuantityDiscount[],
): number {
  return Math.round(basePrice * (1 - qtyDiscountRate(quantity, tiers)));
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  quantityDiscounts: QuantityDiscount[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  remove: (productId: string, variantId?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "relief-care-cart";

function sameLine(
  a: { productId: string; variantId?: string },
  b: { productId: string; variantId?: string },
): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}

export function CartProvider({
  children,
  quantityDiscounts = [],
}: {
  children: React.ReactNode;
  quantityDiscounts?: QuantityDiscount[];
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // corrupt/unavailable storage — start from an empty cart
    }
  }, []);

  // Persisted directly inside each mutator, from the freshly-computed next
  // state — not via a separate `useEffect([items])` watcher. That watcher
  // approach raced the load effect above: on mount it ran once with the
  // still-empty initial `items` before the load's setItems had flushed,
  // silently overwriting a real saved cart with "[]" (most visible under
  // React StrictMode's double-effect dev behavior, which re-reads
  // localStorage a second time and picks up its own corruption).
  function persist(next: CartItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full/unavailable — cart still works in memory for this session
    }
  }

  function add(item: Omit<CartItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((x) => sameLine(x, item));
      const next = existing
        ? prev.map((x) => {
            if (!sameLine(x, item)) return x;
            const nextQuantity = x.quantity + quantity;
            const basePrice = item.basePrice ?? x.basePrice;
            return {
              ...x,
              basePrice,
              quantity: nextQuantity,
              price:
                basePrice !== undefined
                  ? tierPrice(basePrice, nextQuantity, quantityDiscounts)
                  : item.price,
            };
          })
        : [...prev, { ...item, quantity }];
      persist(next);
      return next;
    });
  }

  function setQuantity(
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    setItems((prev) => {
      const next = prev.map((x) => {
        if (!sameLine(x, { productId, variantId })) return x;
        const nextQuantity = Math.max(1, quantity);
        return {
          ...x,
          quantity: nextQuantity,
          price:
            x.basePrice !== undefined
              ? tierPrice(x.basePrice, nextQuantity, quantityDiscounts)
              : x.price,
        };
      });
      persist(next);
      return next;
    });
  }

  function remove(productId: string, variantId?: string) {
    setItems((prev) => {
      const next = prev.filter((x) => !sameLine(x, { productId, variantId }));
      persist(next);
      return next;
    });
  }

  function clear() {
    setItems([]);
    persist([]);
  }

  const count = items.reduce((a, x) => a + x.quantity, 0);
  const subtotal = items.reduce((a, x) => a + x.price * x.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        quantityDiscounts,
        add,
        setQuantity,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
