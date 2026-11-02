import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({
      categoryId: searchParams.category,
      search: searchParams.search,
      page,
      limit: 24,
    }),
  ]);

  const activeCategory = categories.find((c) => c.id === searchParams.category);
  const title = searchParams.search
    ? `"${searchParams.search}" এর ফলাফল`
    : (activeCategory?.name ?? "সব পণ্য");

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (searchParams.category) qs.set("category", searchParams.category);
    if (searchParams.search) qs.set("search", searchParams.search);
    if (targetPage > 1) qs.set("page", String(targetPage));
    const s = qs.toString();
    return s ? `/products?${s}` : "/products";
  }

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

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-xl">{title}</h1>
        <span className="num text-sm text-muted">{result.total}টি পণ্য</span>
      </div>

      {result.items.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-muted">কোনো পণ্য পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {result.items.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="num flex items-center justify-center gap-3 pt-2 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded-full border border-line px-4 py-1.5 text-ink">
              আগের
            </Link>
          )}
          <span>
            {page} / {result.totalPages}
          </span>
          {page < result.totalPages && (
            <Link href={pageHref(page + 1)} className="rounded-full border border-line px-4 py-1.5 text-ink">
              পরের
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
