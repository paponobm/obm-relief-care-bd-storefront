import type { Metadata } from "next";
import Link from "next/link";
import { ProductsGrid } from "@/components/products-grid";
import { PriceRangeSlider } from "@/components/price-range-slider";
import { getCategories, getPriceBounds, getProducts } from "@/lib/store";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: { category?: string; search?: string; minPrice?: string; maxPrice?: string };
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  if (searchParams.search) {
    // Search-result pages are low-value, near-duplicate content for crawlers
    // (same catalog, infinite query variations) — keep them out of the index
    // rather than let them compete with the canonical /products listing.
    return { title: `"${searchParams.search}" এর ফলাফল`, robots: { index: false, follow: true } };
  }
  if (searchParams.category) {
    const categories = await getCategories().catch(() => []);
    const category = categories.find((c) => c.id === searchParams.category);
    if (category) {
      return {
        title: category.name,
        alternates: { canonical: absoluteUrl(`/products?category=${category.id}`) },
      };
    }
  }
  return { title: "সব পণ্য", alternates: { canonical: absoluteUrl("/products") } };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const [categories, result, priceBounds] = await Promise.all([
    getCategories(),
    getProducts({
      categoryId: searchParams.category,
      search: searchParams.search,
      minPrice,
      maxPrice,
      page: 1,
      limit: 20,
    }),
    getPriceBounds({ categoryId: searchParams.category, search: searchParams.search }),
  ]);

  const activeCategory = categories.find((c) => c.id === searchParams.category);
  const title = searchParams.search
    ? `"${searchParams.search}" এর ফলাফল`
    : (activeCategory?.name ?? "সব পণ্য");

  return (
    <div className="flex flex-col gap-4">
      <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/products"
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
            !searchParams.category ? "border-leaf bg-leaf text-white" : "border-line text-ink"
          }`}
        >
          সব পণ্য
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.id}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              searchParams.category === c.id ? "border-leaf bg-leaf text-white" : "border-line text-ink"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {priceBounds && (
        <PriceRangeSlider
          // Forces a remount (fresh internal state) whenever the category
          // or search changes — otherwise this Client Component keeps its
          // old minVal/maxVal across a soft Link navigation even though its
          // bounds/initial props just changed underneath it.
          key={`${searchParams.category ?? ""}:${searchParams.search ?? ""}`}
          bounds={priceBounds}
          initialMin={minPrice ?? priceBounds.min}
          initialMax={maxPrice ?? priceBounds.max}
          categoryId={searchParams.category}
          search={searchParams.search}
        />
      )}

      <h1 className="font-display text-xl">{title}</h1>

      <ProductsGrid
        key={`${searchParams.category ?? ""}:${searchParams.search ?? ""}:${minPrice ?? ""}:${maxPrice ?? ""}`}
        initialItems={result.items}
        initialTotal={result.total}
        initialPage={result.page}
        categoryId={searchParams.category}
        search={searchParams.search}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </div>
  );
}
