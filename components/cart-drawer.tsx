"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type CartItem, useCart } from "@/lib/cart";
import {
  getFlashSale,
  type ChannelConfig,
  type PublicProduct,
} from "@/lib/store";
import { bn, bnToNumber } from "@/lib/bn-digits";
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
  const router = useRouter();
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

  // "পণ্যে ছাড়" — every line's own quantity-tier reduction (its real
  // basePrice vs its current, re-tiered price). Labeled with the percent
  // only when every discounted line shares the same one — a mixed cart
  // doesn't get a single, potentially-misleading percent slapped on it.
  // grossTotal (list prices, before any discount) is also the minimum-order
  // gate's basis — matching exactly what StorefrontService.createOrder
  // computes server-side off its own gross `subtotal`, so what's shown here
  // is never more generous than what the order actually gets charged. The
  // reward-tier/coupon/free-delivery checks below use standaloneGrossTotal
  // instead (see its own comment).
  const grossTotal = items.reduce((sum, i) => sum + (i.basePrice ?? i.price) * i.quantity, 0);
  const itemSavings = grossTotal - subtotal;

  // Everything EXCEPT combo-builder items — spend-more rewards, the coupon
  // and the delivery-charge waiver are all based on this, never grossTotal.
  // A combo already has its own bundle pricing (Settings → Home Page Combo
  // → Pricing tier cards); letting its value also count toward "spend ৳1,300
  // get free delivery" would double-discount the same taka, so it only ever
  // gets its own combo-tier cut — same rule StorefrontService.createOrder
  // applies server-side.
  const standaloneGrossTotal = items
    .filter((i) => !i.comboGroupId)
    .reduce((sum, i) => sum + (i.basePrice ?? i.price) * i.quantity, 0);

  // Settings → Other Settings → Minimum order amount. null/0 means no
  // minimum, same "omitted = off" convention as every other channel config
  // on this page — the checkout button only ever gates on a real admin value.
  const minimum = channel.minimumOrderAmount;
  const remaining = minimum ? Math.max(0, minimum - grossTotal) : 0;
  const metMinimum = !minimum || grossTotal >= minimum;

  // Settings → Other Settings → Spend-more rewards. Shown only once the
  // minimum order (above) is met, as a single box with a single bar —
  // already-reached tiers' "অভিনন্দন…" messages plus (if any tier is still
  // out of reach) the next one's "আর ৳X নিলে …" prompt, all in one line; the
  // bar fills toward the next tier, or sits full once every tier is met.
  const rewardTiers = channel.spendingRewards;
  const metRewardTiers = rewardTiers.filter((t) => standaloneGrossTotal >= t.amount);
  const nextRewardTier = rewardTiers.find((t) => standaloneGrossTotal < t.amount);
  const rewardMessage = [
    ...metRewardTiers.map((t) => `অভিনন্দন! আপনি ${t.description} পাচ্ছেন`),
    ...(nextRewardTier
      ? [
          `আর ${bnTaka(nextRewardTier.amount - standaloneGrossTotal)} এর পণ্য নিলে ${nextRewardTier.description}!`,
        ]
      : []),
  ].join(", ");
  const rewardBarPercent = nextRewardTier
    ? Math.min(100, (standaloneGrossTotal / nextRewardTier.amount) * 100)
    : 100;

  // The one real part of spendingRewards: the highest-amount tier the
  // order already qualifies for that set a discount %, same "best tier
  // wins, not stacked" rule the backend applies when the order is created.
  const discountTier = [...metRewardTiers]
    .reverse()
    .find((t) => (t.discountPercent ?? 0) > 0);
  const discountAmount = discountTier
    ? Math.round((standaloneGrossTotal * discountTier.discountPercent!) / 100)
    : 0;

  const itemDiscountPercents = Array.from(
    new Set(
      items
        .filter((i) => i.basePrice !== undefined && i.basePrice > i.price)
        .map((i) => Math.round(((i.basePrice! - i.price) / i.basePrice!) * 100)),
    ),
  );
  const itemSavingsLabel = itemDiscountPercents.length === 1 ? `${bn(itemDiscountPercents[0])}%` : "";

  // "পরিমাণে ছাড়" — the spend-more reward discount above. Labeled with
  // whichever reward tiers are already met (e.g. "ফ্রি ডেলিভারি + ১৫%ছাড়"),
  // the same real admin-written descriptions shown in the reward box.
  const savingsLabel = metRewardTiers.map((t) => t.description).join(" + ");

  // "নিজের কম্বো" — every line ComboBuilder.confirmCombo added together
  // shares one comboGroupId; grouped here into its own card instead of flat
  // rows (see the reference design). Settings → Home Page Combo → Pricing
  // tier cards' Rate % is the real part: the highest-amount tier this
  // group's own (gross) subtotal reaches sets its discount, and a tier with
  // Free delivery ticked waives the order's delivery charge just like a
  // spend-more reward's own freeDelivery — exactly the rule
  // StorefrontService.createOrder applies when the order is actually
  // created from the same comboGroupId.
  const comboTiers = (combo?.tiers ?? [])
    .filter((t) => (t.discountPercent ?? 0) > 0)
    .map((t) => ({ amount: bnToNumber(t.title), discountPercent: t.discountPercent!, description: t.description }));
  // Every pricing-tier card, discount or not (e.g. a free-delivery-only
  // first step) — sorted lowest-amount first, same convention as the
  // spend-more rewards box, so the combo card's own "আর ৳X যোগ করলে …" hint
  // below can find the very next one regardless of admin row order.
  const allComboTiers = (combo?.tiers ?? [])
    .map((t) => ({ amount: bnToNumber(t.title), description: t.description, freeDelivery: t.freeDelivery }))
    .sort((a, b) => a.amount - b.amount);
  const comboGroupIds = Array.from(new Set(items.filter((i) => i.comboGroupId).map((i) => i.comboGroupId!)));
  const comboGroups = comboGroupIds.map((groupId) => {
    const groupItems = items.filter((i) => i.comboGroupId === groupId);
    const groupGross = groupItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Each line's own regular/MSRP price (compareAtPrice), when it has one —
    // the crossed-out total below reflects this even when no combo tier has
    // discounted the group yet, same as a single product's own sale price.
    const groupRegularTotal = groupItems.reduce((sum, i) => sum + (i.compareAtPrice ?? i.price) * i.quantity, 0);
    const metComboTiers = comboTiers.filter((t) => groupGross >= t.amount);
    // Once an item joins a combo, the combo's own tiers are the only thing
    // that discounts it — never also the generic per-product quantity-tier
    // discount (Settings → Other Settings → Quantity discounts). Mixing the
    // two made "কম্বো ছাড়" show an amount that had nothing to do with any
    // combo tier actually being reached.
    const comboPercent = [...metComboTiers].reverse()[0]?.discountPercent ?? 0;
    const groupDiscount = groupItems.reduce((sum, i) => sum + Math.round((i.price * i.quantity * comboPercent) / 100), 0);
    // The green "✓" line reads off every reached tier (comboTiers only has
    // the discount-bearing ones — a free-delivery-only first step would
    // never show here otherwise, even once it's actually met).
    const badgeText = allComboTiers
      .filter((t) => groupGross >= t.amount)
      .flatMap((t) => t.description.split("\n"))
      .map((line) => line.replace(/^\+\s*/, "").trim())
      .filter(Boolean)
      .join(" + ");
    // "আর ৳X যোগ করলে …" — the next pricing-tier card this group hasn't
    // reached yet, same "add more, get more" hint the combo builder page's
    // own progress bar already gives.
    const nextTier = allComboTiers.find((t) => groupGross < t.amount);
    const nextTierText = nextTier
      ? nextTier.description
          .split("\n")
          .map((line) => line.replace(/^\+\s*/, "").trim())
          .filter(Boolean)
          .join(" + ")
      : null;
    // This group's own "ফ্রি ডেলিভারি" achievement — waives the order's
    // delivery charge below, independent of the spend-more reward's own
    // freeDelivery (standalone items only).
    const groupFreeDelivery = allComboTiers.some((t) => groupGross >= t.amount && t.freeDelivery);
    return {
      groupId,
      groupItems,
      groupGross,
      groupRegularTotal,
      groupNet: groupGross - groupDiscount,
      groupDiscount,
      badgeText,
      nextTier,
      nextTierText,
      groupFreeDelivery,
    };
  });
  const comboDiscountTotal = comboGroups.reduce((sum, g) => sum + g.groupDiscount, 0);
  const comboFreeDelivery = comboGroups.some((g) => g.groupFreeDelivery);
  const standaloneItems = items.filter((i) => !i.comboGroupId);

  // "ডেলিভারি চার্জ" — Settings → Other Settings → Delivery charge, waived
  // (shown as ফ্রি) whenever a met reward tier has Free delivery ticked, or
  // any combo group's own tier does — the exact same rule
  // StorefrontService.createOrder applies server-side.
  const metFreeDelivery = metRewardTiers.some((t) => t.freeDelivery) || comboFreeDelivery;
  const deliveryCharge = channel.deliveryCharge && !metFreeDelivery ? channel.deliveryCharge : 0;
  const showDeliveryLine = Boolean(channel.deliveryCharge);

  const finalTotal = grossTotal - itemSavings - discountAmount - comboDiscountTotal + deliveryCharge;
  const totalSavings = itemSavings + discountAmount + comboDiscountTotal;

  // "কম্বো এডিট করুন" — sends this group's lines back into the combo builder
  // (same shape ComboBuilder.readCombo expects) and off the main cart, so
  // editing it there doesn't also double-count it here.
  function editCombo(groupId: string, groupItems: CartItem[]) {
    try {
      localStorage.setItem(
        "relief-care-combo",
        JSON.stringify(
          groupItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            variantLabel: i.variantLabel,
            slug: i.slug,
            name: i.name,
            image: i.image,
            price: i.price,
            compareAtPrice: i.compareAtPrice,
            quantity: i.quantity,
          })),
        ),
      );
      // The combo stays in the cart exactly as it is — ComboBuilder removes
      // (and replaces, if anything's left) this exact group once the edit
      // is actually confirmed or emptied out, never just for opening it.
      localStorage.setItem("relief-care-combo-editing-group", groupId);
    } catch {
      // storage unavailable — fall back to editing a disconnected copy
    }
    onClose();
    router.push("/combo");
    // A same-URL push (already on /combo — e.g. right after confirming this
    // very combo) doesn't remount the page, so ComboBuilder's own mount
    // effect never re-runs on its own; this nudges it to re-read what was
    // just written above instead of showing an empty builder.
    window.dispatchEvent(new Event("relief-care:combo-updated"));
  }
  function removeCombo(groupItems: CartItem[]) {
    groupItems.forEach((i) => remove(i.productId, i.variantId));
  }

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

          {combo && comboGroups.length === 0 && (
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
                {comboGroups.map((g) => (
                  <div key={g.groupId} className="rounded-xl border border-amber bg-amber-soft p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-white">নিজের কম্বো</span>
                      <span className="num text-xs text-muted font-sans">{bn(g.groupItems.length)}টি পণ্য</span>
                    </div>
                    <div className="mb-2 flex -space-x-2">
                      {g.groupItems.slice(0, 5).map((i) => (
                        <div
                          key={`${i.productId}:${i.variantId ?? ""}`}
                          className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-amber-soft bg-leaf-soft"
                        >
                          <ProductArt name={i.name} categoryName={null} thumbnailUrl={i.image} className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {g.groupItems.length > 5 && (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-amber-soft bg-line text-xs font-bold text-ink font-sans">
                          +{bn(g.groupItems.length - 5)}
                        </div>
                      )}
                    </div>
                    <div className="num mb-1 flex items-baseline gap-2">
                      {g.groupRegularTotal > g.groupNet && <s className="font-sans text-sm text-muted">{bnTaka(g.groupRegularTotal)}</s>}
                      <b className="font-display text-xl text-amber-deep font-sans">{bnTaka(g.groupNet)}</b>
                    </div>
                    {g.badgeText && <p className="mb-1 font-sans text-xs font-semibold text-leaf-deep">✓ {g.badgeText}</p>}
                    {g.nextTier && (
                      <p className="mb-2 font-sans text-xs font-semibold text-amber-deep">
                        <span className="num">আর {bnTaka(g.nextTier.amount - g.groupGross)}</span> যোগ করলে {g.nextTierText}!
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editCombo(g.groupId, g.groupItems)}
                        className="flex-1 rounded-lg border border-amber bg-surface py-1.5 text-xs font-semibold text-amber-deep font-sans"
                      >
                        কম্বো এডিট করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCombo(g.groupItems)}
                        className="shrink-0 text-xs font-semibold text-muted underline font-sans"
                      >
                        কম্বো সরান
                      </button>
                    </div>
                  </div>
                ))}
                {standaloneItems.map((i) => {
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
            {itemSavings > 0 || discountAmount > 0 || comboDiscountTotal > 0 || showDeliveryLine ? (
              <>
                <div className="num mb-1 flex items-center justify-between text-sm text-muted">
                  <span className="font-semibold text-leaf">পণ্যের মূল দাম</span>
                  <span className="font-sans font-semibold text-leaf">{bnTaka(grossTotal)}</span>
                </div>
                {itemSavings > 0 && (
                  <div className="num mb-1 flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold font-sans">পণ্যে ছাড়{itemSavingsLabel ? `(${itemSavingsLabel})` : ""}</span>
                    <span className="font-sans font-semibold ">-{bnTaka(itemSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="num mb-1 flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold font-sans">পরিমাণে ছাড়{savingsLabel ? ` (${savingsLabel})` : ""}</span>
                    <span className="font-sans font-semibold">-{bnTaka(discountAmount)}</span>
                  </div>
                )}
                {comboDiscountTotal > 0 && (
                  <div className="num mb-1 flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold font-sans">কম্বো ছাড়</span>
                    <span className="font-sans font-semibold">-{bnTaka(comboDiscountTotal)}</span>
                  </div>
                )}
                {showDeliveryLine && (
                  <div className="num mb-1 flex items-center justify-between text-sm text-muted">
                    <span className="font-semibold text-leaf">ডেলিভারি চার্জ</span>
                    <span className="font-sans font-bold text-bold text-black">{deliveryCharge > 0 ? bnTaka(deliveryCharge) : "ফ্রি"}</span>
                  </div>
                )}
                <div className="num mb-3 flex items-center justify-between text-base font-semibold">
                  <span>সাবটোটাল</span>
                  <span className="text-amber-deep font-sans">{bnTaka(finalTotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <p className=" font-sans num mb-3 rounded-lg bg-leaf-soft px-3 py-2 text-center text-sm font-semibold text-leaf-deep">
                    এই অর্ডারে আপনি মোট {bnTaka(totalSavings)} সাশ্রয় করছেন
                  </p>
                )}
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
               অর্ডার করুন →
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
