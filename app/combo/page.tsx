import { ComboBuilder } from "@/components/combo-builder";
import { getCategories, getChannelConfig, getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComboPage() {
  const [channel, categories, products] = await Promise.all([
    getChannelConfig().catch(() => null),
    getCategories().catch(() => []),
    // 100 is the storefront API's own max per-request limit (see
    // StorefrontService.getProducts) — comfortably above this channel's
    // catalog size, so every pickable product shows up in one request.
    getProducts({ limit: 100 }).then((r) => r.items).catch(() => []),
  ]);

  return <ComboBuilder tiers={channel?.comboBanners[0]?.tiers ?? []} categories={categories} products={products} />;
}
