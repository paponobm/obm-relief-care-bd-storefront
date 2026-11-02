import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/store";
import { CATEGORY_ICON } from "@/lib/category-icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, all] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ limit: 12 }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="relative overflow-hidden rounded-card bg-leaf-deep p-7 text-white lg:p-9">
          <h1 className="font-display max-w-[16ch] text-3xl leading-tight sm:text-4xl">
            ব্যথা, চুলকানি, সর্দি থেকে <span className="text-amber-soft">দ্রুত আরাম</span>
          </h1>
          <p className="mt-2 max-w-[44ch] opacity-90">
            বিশ্বস্ত ব্র্যান্ডের আসল পণ্য, ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে।
          </p>
          <Link href="/products" className="mt-4 inline-block rounded-full bg-amber px-5 py-2.5 font-semibold">
            কেনাকাটা শুরু করুন →
          </Link>
        </section>

        <Link
          href="/quiz"
          className="flex flex-col justify-center gap-3 rounded-card border border-leaf bg-leaf-soft p-5 text-ink lg:p-7"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
            </svg>
          </span>
          <span>
            <b className="font-display block text-lg text-leaf-deep">কোনটা নেবেন বুঝছেন না?</b>
            <span className="text-sm text-muted">৩টা প্রশ্নের উত্তর দিন, আমরা ঠিক পণ্যটা খুঁজে দেব</span>
          </span>
          <span className="font-semibold text-leaf">শুরু করুন →</span>
        </Link>
      </div>

      <section>
        <h2 className="font-display mb-3 text-xl">ক্যাটাগরি</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="flex flex-col items-center gap-2.5 rounded-card border border-line bg-surface p-4 text-center text-xs font-semibold text-ink transition-shadow hover:shadow-md"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-leaf-soft text-2xl text-leaf">
                {CATEGORY_ICON[c.name] ?? "●"}
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {featured.items.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl">
              আমাদের <span className="text-amber">পছন্দ</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featured.items.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl">সব পণ্য</h2>
          <Link href="/products" className="font-semibold text-leaf">
            সব দেখুন →
          </Link>
        </div>
        {all.items.length === 0 ? (
          <p className="text-muted">এখনো কোনো পণ্য যোগ করা হয়নি।</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {all.items.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-card border border-dashed border-amber bg-amber-soft p-4 text-sm text-ink">
        <b className="font-display block text-base text-amber-deep">শীঘ্রই আসছে</b>
        নিজের কম্বো বানানো, কুপন কোড, রেফারেল বোনাস, VIP কার্ড, এবং কাস্টমার রিভিউ — এই ফিচারগুলো নিয়ে আমরা কাজ করছি।
      </section>
    </div>
  );
}
