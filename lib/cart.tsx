"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  remove: (productId: string, variantId?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "relief-care-cart";

function sameLine(a: { productId: string; variantId?: string }, b: { productId: string; variantId?: string }): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
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
        ? prev.map((x) => (sameLine(x, item) ? { ...x, quantity: x.quantity + quantity } : x))
        : [...prev, { ...item, quantity }];
      persist(next);
      return next;
    });
  }

  function setQuantity(productId: string, quantity: number, variantId?: string) {
    setItems((prev) => {
      const next = prev.map((x) =>
        sameLine(x, { productId, variantId }) ? { ...x, quantity: Math.max(1, quantity) } : x,
      );
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
    <CartContext.Provider value={{ items, count, subtotal, add, setQuantity, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
