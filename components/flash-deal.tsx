import Link from "next/link";
import { ProductDealCard } from "./product-deal-card";
import { FlashCountdown } from "./flash-countdown";
import type { FlashSaleConfig } from "@/lib/store";

// The homepage's horizontally-scrolling deal strip — admin-curated product
// selection + order + optional countdown (Settings → Flash Sale). Disabled
// or empty just renders nothing, same honesty rule as ComboBanner/TrustStrip.
export function FlashDeal({ config }: { config: FlashSaleConfig }) {
  if (!config.enabled || config.items.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="relative mb-5 mt-2 flex items-baseline">
        <h2 className="font-display font-bold  text-2xl">
          ফ্ল্যাশ <span className="text-danger">ডিল</span>
        </h2>
        {config.endsAt && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FlashCountdown endsAt={config.endsAt} />
          </div>
        )}
        <Link href="/products" className="ml-auto font-semibold text-leaf">
          সব অফার দেখুন →
        </Link>
      </div>
      <div className=" flex gap-3 overflow-x-auto pb-3">
        {config.items.map((p) => (
          <div key={p.productId} className="w-[168px] shrink-0 sm:w-[200px]">
            <ProductDealCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
