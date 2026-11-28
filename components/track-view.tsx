"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { trackProductView } from "@/lib/track";

// Records this product in the viewer's own browser so it can surface in the
// homepage's "সম্প্রতি দেখেছেন" row, and reports a real PRODUCT_VIEW to the
// admin's own analytics (see RouteTracker, which deliberately skips firing
// a plain page view on this same path so the two don't double-count it).
// Renders nothing itself.
export function TrackView({ slug, productId }: { slug: string; productId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    addRecentlyViewed(slug);
  }, [slug]);

  useEffect(() => {
    trackProductView(pathname, productId);
  }, [pathname, productId]);

  return null;
}
