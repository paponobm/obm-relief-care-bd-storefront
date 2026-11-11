"use client";

import type { ReactNode } from "react";
import type { PublicProduct } from "@/lib/store";

// Wraps a product card's image/name so clicking it opens the quick-view
// modal (see QuickViewModal, mounted once in layout.tsx) instead of
// navigating straight to the full product page — same product object the
// card already has, no extra fetch. A plain window event, same pattern as
// the cart drawer's own "relief-care:open-cart" — works regardless of
// where in the tree the modal happens to be mounted.
export function QuickViewTrigger({
  product,
  className,
  children,
}: {
  product: PublicProduct;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("relief-care:quick-view", { detail: product }))}
      className={className}
    >
      {children}
    </button>
  );
}
