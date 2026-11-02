"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export interface CartItem {
  productId: string;
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
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "relief-care-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const loaded = useRef(false);

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
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/unavailable — cart still works in memory for this session
    }
  }, [items]);

  function add(item: Omit<CartItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((x) => x.productId === item.productId);
      if (existing) {
        return prev.map((x) =>
          x.productId === item.productId ? { ...x, quantity: x.quantity + quantity } : x,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, quantity: Math.max(1, quantity) } : x)),
    );
  }

  function remove(productId: string) {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }

  function clear() {
    setItems([]);
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
