import Link from "next/link";
import { HeroBanner } from "@/components/hero-banner";
import { TrustStrip } from "@/components/trust-strip";
import { ComboBanner } from "@/components/combo-banner";
import { FlashDeal } from "@/components/flash-deal";
import { HelpCards } from "@/components/help-cards";
import { AllProductsGrid } from "@/components/all-products-grid";
import { Reviews } from "@/components/reviews";
import { HealthTips } from "@/components/health-tips";
import { RecentlyViewed } from "@/components/recently-viewed";
import { getCategories, getChannelConfig, getFlashSale, getHealthTips, getProducts, getReviews } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, , all, channel, flashSale, reviews, healthTips] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ limit: 10 }),
    getChannelConfig().catch(() => null),
    getFlashSale().catch(() => ({ enabled: false, endsAt: null, items: [] })),
    getReviews().catch(() => []),
    getHealthTips().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <HeroBanner
        defaultTitle="ব্যথা, চুলকানি, সর্দি থেকে দ্রুত আরাম"
        defaultDescription="বিশ্বস্ত ব্র্যান্ডের আসল পণ্য। পণ্য হাতে পেয়ে টাকা দিন, সারা বাংলাদেশে হোম ডেলিভারি।"
        defaultCoupon={channel?.heroCoupon ?? null}
        slides={channel?.heroSlides ?? []}
      />

      <TrustStrip badges={channel?.trustBadges ?? []} />

      <section>
        <div className="mb-3 mt-8 flex items-baseline justify-between">
          <h2 className="font-bold  text-2xl">ক্যাটাগরি</h2>
          <Link href="/products" className="font-semibold text-leaf">
            সব পণ্য →
          </Link>
        </div>
        {/* Capped to 10 — small screens (grid-cols-4) show the first 8 as
            2 rows, larger screens (grid-cols-5) reveal all 10 as 2 rows.
            Anything beyond 10 isn't shown here at all; browse the rest from
            সব পণ্য instead of growing this grid past 2 rows. */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {categories.slice(0, 10).map((c, i) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              // className={`flex flex-col items-center gap-1.5 rounded-card bg-surface px-2.5 py-3.5 text-center text-sm font-semibold leading-[1.3] text-ink transition-transform hover:-translate-y-0.5 ${
              //   i >= 8 ? "hidden sm:flex" : ""
              // }`}
              className={`flex flex-col items-center gap-1.5 rounded-card sm:bg-surface px-2.5 py-3.5 text-center text-sm font-semibold leading-[1.3] text-ink sm:transition-transform hover:-translate-y-0.5 ${i >= 8 ? "hidden sm:flex" : ""
                }`}
            >
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, not part of the Next.js image pipeline
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="h-[52px] w-[52px] rounded-card object-cover"
                />
              ) : (
                <span className="grid h-[52px] w-[52px] place-items-center rounded-card bg-leaf-soft text-xl font-bold text-leaf">
                  {c.name.charAt(0)}
                </span>
              )}
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <ComboBanner configs={channel?.comboBanners ?? []} />

      <FlashDeal config={flashSale} />

      <HelpCards />

      {/* {featured.items.length > 0 && (
        <section>
          <div className="mb-3 mt-10 flex items-baseline justify-between">
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
      )} */}

      <section>
        <div className="mb-3 mt-7 flex items-baseline justify-between">
          <h2 className="font-display font-bold  text-2xl">সকল পণ্য</h2>
          <Link href="/products" className="font-semibold text-leaf">
            সব দেখুন →
          </Link>
        </div>
        {all.items.length === 0 ? (
          <p className="text-muted">এখনো কোনো পণ্য যোগ করা হয়নি।</p>
        ) : (
          <AllProductsGrid initialItems={all.items} initialTotal={all.total} initialPage={all.page} />
        )}
      </section>

      <Reviews reviews={reviews} />

      <HealthTips tips={healthTips} />

      <RecentlyViewed />

      {/* <section className="rounded-card border border-dashed border-amber bg-amber-soft p-4 text-sm text-ink">
        <b className="font-display block text-base text-amber-deep">শীঘ্রই আসছে</b>
        কুপন কোড, রেফারেল বোনাস, এবং VIP কার্ড — এই ফিচারগুলো নিয়ে আমরা কাজ করছি।
      </section> */}
    </div>
  );
}
