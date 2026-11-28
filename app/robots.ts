import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal/transactional pages — nothing a crawler should index, and
      // /track echoes a shopper's own last order out of localStorage.
      disallow: ["/checkout", "/track"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
