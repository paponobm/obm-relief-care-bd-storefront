"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  getFlashSale,
  type ChannelConfig,
  type PublicProduct,
} from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { bnTaka, ProductDealCard } from "./product-deal-card";
import { ProductArt } from "./product-art";

// The header cart button opens this instead of jumping straight to
// /checkout — matches the reference design's slide-over cart panel.
// Cross-sell row reuses the same admin-curated Flash Sale list the
// homepage shows (Settings → Flash Sale) — no separate "recommended"
// logic invented for this panel.
export function CartDrawer({
  open,
  onClose,
  channel,
}: {
  open: boolean;
  onClose: () => void;
  channel: ChannelConfig;
}) {
  const { items, subtotal, setQuantity, remove, quantityDiscounts } = useCart();
  const combo = channel.comboBanners[0];
  const [crossSell, setCrossSell] = useState<PublicProduct[]>([]);

  useEffect(() => {
    if (!open) return;
    getFlashSale()
      .then((r) => setCrossSell(r.items))
      .catch(() => setCrossSell([]));
  }, [open]);

  const cartIds = new Set(items.map((i) => i.productId));
  const suggestions = crossSell
    .filter((p) => !cartIds.has(p.productId))
    .slice(0, 8);

  // Settings → Other Settings → Minimum order amount. null/0 means no
  // minimum, same "omitted = off" convention as every other channel config
  // on this page — the checkout button only ever gates on a real admin value.
  const minimum = channel.minimumOrderAmount;
  const remaining = minimum ? Math.max(0, minimum - subtotal) : 0;
  const metMinimum = !minimum || subtotal >= minimum;

  // Settings → Other Settings → Spend-more rewards. Shown only once the
  // minimum order (above) is met, as a single box with a single bar —
  // already-reached tiers' "অভিনন্দন…" messages plus (if any tier is still
  // out of reach) the next one's "আর ৳X নিলে …" prompt, all in one line; the
  // bar fills toward the next tier, or sits full once every tier is met.
  const rewardTiers = channel.spendingRewards;
  const metRewardTiers = rewardTiers.filter((t) => subtotal >= t.amount);
  const nextRewardTier = rewardTiers.find((t) => subtotal < t.amount);
  const rewardMessage = [
    ...metRewardTiers.map((t) => `অভিনন্দন! আপনি ${t.description} পাচ্ছেন`),
    ...(nextRewardTier
      ? [
          `আর ${bnTaka(nextRewardTier.amount - subtotal)} এর পণ্য নিলে ${nextRewardTier.description}!`,
        ]
      : []),
  ].join(", ");
  const rewardBarPercent = nextRewardTier
    ? Math.min(100, (subtotal / nextRewardTier.amount) * 100)
    : 100;

  // The one real part of spendingRewards: the highest-amount tier the
  // subtotal already qualifies for that set a discount %, same "best tier
  // wins, not stacked" rule the backend applies when the order is created.
  const discountTier = [...metRewardTiers]
    .reverse()
    .find((t) => (t.discountPercent ?? 0) > 0);
  const discountAmount = discountTier
    ? Math.round((subtotal * discountTier.discountPercent!) / 100)
    : 0;

  // "৫% ছাড় পাচ্ছেন · আর ১টা নিলে ১০%" — only for lines whose price actually
  // re-tiers on quantity change (basePrice set, see lib/cart.tsx). Combines
  // the discount already earned at this quantity with the next admin-
  // configured tier still available (Settings → Other Settings → Quantity
  // discounts, sorted ascending); clickable (jumps straight to that tier's
  // quantity — tiers aren't necessarily consecutive) whenever one is left to
  // reach, plain text once the highest tier is already applied.
  function tierMessage(
    quantity: number,
    basePrice?: number,
  ): { text: string; nextQuantity: number | null } | null {
    if (basePrice === undefined) return null;
    const sorted = [...quantityDiscounts].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const earnedTier = [...sorted]
      .reverse()
      .find((t) => t.quantity <= quantity);
    const nextTier = sorted.find((t) => t.quantity > quantity);
    const earned = earnedTier
      ? `${bn(earnedTier.discountPercent)}% ছাড় পাচ্ছেন`
      : null;
    const next = nextTier
      ? `আর ${bn(nextTier.quantity - quantity)}টা নিলে ${bn(nextTier.discountPercent)}% ছাড়`
      : null;
    if (!earned && !next) return null;
    return {
      text: [earned, next].filter(Boolean).join(" · "),
      nextQuantity: nextTier ? nextTier.quantity : null,
    };
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-label="আপনার কার্ট"
        className={`fixed right-0 top-0 z-[80] flex h-full w-[min(400px,92%)] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <h2 className="font-display flex-1 text-lg">আপনার কার্ট</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="কার্ট বন্ধ করুন"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-lg text-ink"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3.5">
          {items.length > 0 && minimum && !metMinimum && (
            <div className="mb-3.5 rounded-xl border border-amber bg-amber-soft px-3.5 py-3">
              <p className="text-[13px] text-sans font-semibold text-amber-deep">
                সর্বনিম্ন অর্ডার{" "}
                <span className="font-bold text-ink">{bnTaka(minimum)}</span>।
                অর্ডার করতে আর{" "}
                <span className="font-bold text-ink">{bnTaka(remaining)}</span>{" "}
                এর পণ্য যোগ করুন
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-amber"
                  style={{
                    width: `${Math.min(100, (subtotal / minimum) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {items.length > 0 && metMinimum && rewardTiers.length > 0 && (
            <div
              className={`mb-3.5 rounded-xl border px-3.5 py-3 ${
                nextRewardTier ? "border-amber bg-amber-soft" : "border-leaf bg-leaf-soft"
              }`}
            >
              <p
                className={`text-[13px] font-sans font-semibold ${
                  nextRewardTier ? "text-amber-deep" : "text-leaf-deep"
                }`}
              >
                {rewardMessage}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className={`h-full rounded-full ${nextRewardTier ? "bg-amber" : "bg-leaf"}`}
                  style={{ width: `${rewardBarPercent}%` }}
                />
              </div>
            </div>
          )}

          {combo && (
            <Link
              href="/combo"
              onClick={onClose}
              className="mb-3.5 flex flex-col gap-0.5 rounded-xl border border-amber bg-amber-soft px-3.5 py-3"
            >
              <b className="font-display text-base text-amber-deep">
                {combo.title}
              </b>
              <span className="num text-xs text-muted">
                {combo.description}
              </span>
            </Link>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col gap-3.5">
              <div className="rounded-xl border border-line px-4 py-6 text-center text-sm text-muted">
                কার্ট খালি আছে।
                <br />
                পছন্দের পণ্য যোগ করুন।
              </div>
              {suggestions.length > 0 && (
                <div>
                  <h3 className="font-display mb-2 text-sm">জনপ্রিয় পণ্য</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {suggestions.map((p) => (
                      <div key={p.productId} className="w-[150px] shrink-0">
                        <ProductDealCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {items.map((i) => {
                  const tier = tierMessage(i.quantity, i.basePrice);
                  return (
                    <div
                      key={`${i.productId}:${i.variantId ?? ""}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sans"
                    >
                      <div className="flex min-w-0 gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-soft">
                          <ProductArt
                            name={i.name}
                            categoryName={null}
                            thumbnailUrl={i.image}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-ink">
                            {i.name}
                            {i.variantLabel && (
                              <span className="text-muted">
                                {" "}
                                · {i.variantLabel}
                              </span>
                            )}
                          </p>
                          <p className="num text-xs text-muted font-sans">
                            {bnTaka(i.basePrice ?? i.price)} × {bn(i.quantity)}{" "}
                            = {bnTaka(i.price * i.quantity)}
                          </p>
                          {tier &&
                            (tier.nextQuantity !== null ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(
                                    i.productId,
                                    tier.nextQuantity!,
                                    i.variantId,
                                  )
                                }
                                className="num mt-0.5 block text-xs font-semibold text-amber-deep font-display"
                              >
                                {tier.text} →
                              </button>
                            ) : (
                              <p className="font-sans num mt-0.5 text-xs font-semibold text-amber-deep">
                                {tier.text}
                              </p>
                            ))}
                          <button
                            type="button"
                            onClick={() => remove(i.productId, i.variantId)}
                            className="mt-0.5 block text-xs font-semibold text-muted underline font-sans"
                          >
                            সরান
                          </button>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-line-hard">
                        <button
                          type="button"
                          onClick={() =>
                            i.quantity <= 1
                              ? remove(i.productId, i.variantId)
                              : setQuantity(
                                  i.productId,
                                  i.quantity - 1,
                                  i.variantId,
                                )
                          }
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-ink"
                          aria-label="কমান"
                        >
                          −
                        </button>
                        <span className="num w-6 text-center text-xs font-semibold text-ink font-sans">
                          {bn(i.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              i.productId,
                              i.quantity + 1,
                              i.variantId,
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-leaf-deep"
                          aria-label="বাড়ান"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-display mb-3 text-sm font-sans">
                    {!metMinimum && minimum
                      ? `যোগ করে ${bnTaka(minimum)} পূরণ করুন`
                      : "আরও কিছু যোগ করুন"}
                  </h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {suggestions.map((p) => (
                      <div key={p.productId} className="w-[150px] shrink-0">
                        <ProductDealCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border-t border-line px-4 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="block w-full rounded-xl bg-amber py-3 text-center font-bold text-white"
            >
              কেনাকাটা শুরু করুন
            </button>
          </div>
        ) : (
          <div className="border-t border-line px-4 py-3.5">
            {discountAmount > 0 ? (
              <>
                <div className="num mb-1 flex items-center justify-between text-sm text-muted">
                  <span>সাবটোটাল</span>
                  <span className="font-sans">{bnTaka(subtotal)}</span>
                </div>
                <div className="num mb-1 flex items-center justify-between text-sm text-leaf-deep">
                  <span>ছাড় ({bn(discountTier!.discountPercent!)}%)</span>
                  <span className="font-sans">-{bnTaka(discountAmount)}</span>
                </div>
                <div className="num mb-3 flex items-center justify-between text-base font-semibold">
                  <span>মোট</span>
                  <span className="text-amber-deep font-sans">
                    {bnTaka(subtotal - discountAmount)}
                  </span>
                </div>
              </>
            ) : (
              <div className="num mb-3 flex items-center justify-between text-base font-semibold">
                <span>সাবটোটাল</span>
                <span className="text-amber-deep font-sans">
                  {bnTaka(subtotal)}
                </span>
              </div>
            )}
            {metMinimum ? (
              <Link
                href="/checkout"
                onClick={onClose}
                className="block rounded-xl bg-amber py-3 text-center font-bold text-white"
              >
                চেকআউট করুন
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="block w-full rounded-xl bg-amber py-3 text-center font-bold text-white"
              >
                আরও {bnTaka(remaining)} এর পণ্য যোগ করুন
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
