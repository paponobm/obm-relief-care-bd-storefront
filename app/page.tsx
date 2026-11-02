import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { getCategories, getChannelConfig, getProducts } from "@/lib/store";
import { CATEGORY_ICON } from "@/lib/category-icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, all, channel] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ limit: 12 }),
    getChannelConfig().catch(() => null),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <HeroBanner
        defaultTitle="ব্যথা, চুলকানি, সর্দি থেকে দ্রুত আরাম"
        defaultDescription="বিশ্বস্ত ব্র্যান্ডের আসল পণ্য। পণ্য হাতে পেয়ে টাকা দিন, সারা বাংলাদেশে হোম ডেলিভারি।"
        defaultCoupon={channel?.heroCoupon ?? null}
        slides={channel?.heroSlides ?? []}
      />

      <Link
        href="/quiz"
        className="flex w-full items-center gap-3.5 rounded-card border border-leaf bg-leaf-soft p-4 text-left text-ink"
      >
        <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-leaf text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
          </svg>
        </span>
        <span>
          <b className="font-display block text-lg leading-tight text-leaf-deep">কোনটা নেবেন বুঝছেন না?</b>
          <span className="text-sm text-muted">৩টা প্রশ্নের উত্তর দিন, আমরা ঠিক পণ্যটা খুঁজে দেব</span>
        </span>
        <span className="ml-auto hidden shrink-0 font-semibold text-leaf sm:block">শুরু করুন →</span>
      </Link>

      <section>
        <h2 className="font-display mb-3 text-xl">ক্যাটাগরি</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="flex flex-col items-center gap-1.5 rounded-card bg-surface px-2.5 py-3.5 text-center text-sm font-semibold leading-[1.3] text-ink transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-leaf-soft text-xl text-leaf">
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
