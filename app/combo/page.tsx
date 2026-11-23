import { ComboBuilder } from "@/components/combo-builder";
import { getCategories, getChannelConfig, getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComboPage({
  searchParams,
}: {
  // Which combo banner on the homepage was clicked (its index in
  // channel.comboBanners) — see components/combo-banner.tsx. Defaults to
  // the first one for a bare /combo visit.
  searchParams: { combo?: string };
}) {
  const [channel, categories, products] = await Promise.all([
    getChannelConfig().catch(() => null),
    getCategories().catch(() => []),
    // 100 is the storefront API's own max per-request limit (see
    // StorefrontService.getProducts) — comfortably above this channel's
    // catalog size, so every pickable product shows up in one request.
    getProducts({ limit: 100 }).then((r) => r.items).catch(() => []),
  ]);

  const comboIndex = Number(searchParams.combo ?? 0) || 0;
  const tiers = channel?.comboBanners[comboIndex]?.tiers ?? channel?.comboBanners[0]?.tiers ?? [];

  return <ComboBuilder tiers={tiers} categories={categories} products={products} />;
}
