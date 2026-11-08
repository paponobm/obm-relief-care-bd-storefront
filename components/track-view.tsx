"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";

// Records this product in the viewer's own browser so it can surface in the
// homepage's "সম্প্রতি দেখেছেন" row — renders nothing itself.
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    addRecentlyViewed(slug);
  }, [slug]);

  return null;
}
