"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/track";

// Mounted once in the root layout — fires a page view on first load and on
// every client-side route change. Renders nothing itself, same convention
// as TrackView/ToastHost.
export function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // A product page fires its own, more specific PRODUCT_VIEW instead (see
    // TrackView) — not in addition to this one, which would double-count
    // every product page view in the admin's "Top pages" list.
    if (pathname.startsWith("/product/")) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
