import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/store";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS = ["/", "/products", "/combo", "/quiz", "/policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getAllProducts(),
  ]);

  const now = new Date();

  return [
    ...STATIC_PATHS.map((path) => ({
      url: new URL(path, SITE_URL).toString(),
      lastModified: now,
    })),
    ...categories.map((c) => ({
      url: new URL(`/products?category=${c.id}`, SITE_URL).toString(),
      lastModified: now,
    })),
    ...products.map((p) => ({
      url: new URL(`/product/${p.slug}`, SITE_URL).toString(),
      lastModified: now,
    })),
  ];
}

async function getAllProducts() {
  const all: { slug: string }[] = [];
  let page = 1;
  // Backend caps `limit` at 100 per page (see StorefrontService.getProducts)
  // — paginate until a page comes back short of that, rather than assuming
  // the whole catalog fits in one request.
  for (;;) {
    const result = await getProducts({ page, limit: 100 }).catch(() => null);
    if (!result || result.items.length === 0) break;
    all.push(...result.items.map((p) => ({ slug: p.slug })));
    if (result.items.length < 100) break;
    page += 1;
  }
  return all;
}
