import { ProductCard } from "@/components/product-card";
import { FlashCountdown } from "@/components/flash-countdown";
import { getFlashSale } from "@/lib/store";

export const dynamic = "force-dynamic";

// "সব অফার দেখুন" from the homepage's ফ্ল্যাশ ডিল strip — the same
// admin-curated items (Settings → Flash Sale), just the full set instead of
// the horizontally-scrolling preview. Not /products: that page shows the
// whole catalog, not only what's on this deal.
export default async function FlashDealPage() {
  const flashSale = await getFlashSale().catch(() => ({ enabled: false, endsAt: null, items: [] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-xl font-bold">
          ফ্ল্যাশ <span className="text-danger">ডিল</span>
        </h1>
        {flashSale.enabled && flashSale.endsAt && <FlashCountdown endsAt={flashSale.endsAt} />}
      </div>

      {!flashSale.enabled || flashSale.items.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-muted">এখন কোনো ফ্ল্যাশ ডিল সক্রিয় নেই।</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {flashSale.items.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
