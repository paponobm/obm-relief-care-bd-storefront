import { CheckoutClient } from "./checkout-client";
import { getChannelConfig, getFlashSale } from "@/lib/store";

export const dynamic = "force-dynamic";

// Server wrapper only: the real breakdown (reward tiers, delivery charge,
// minimum order) needs the channel's live themeConfig, and the cross-sell
// box needs real admin-curated Flash Sale items — same two calls app/page.tsx
// already makes, just reused here instead of a client-side fetch.
export default async function CheckoutPage() {
  const [channel, flashSale] = await Promise.all([
    getChannelConfig().catch(() => null),
    getFlashSale().catch(() => ({ enabled: false, endsAt: null, items: [] })),
  ]);

  return <CheckoutClient channel={channel} suggestions={flashSale.items} />;
}
