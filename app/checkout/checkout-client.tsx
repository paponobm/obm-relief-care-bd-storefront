"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, type CartItem, useCart } from "@/lib/cart";
import {
  placeOrder,
  saveCheckoutLead,
  getCheckoutUpsell,
  addUpsellItem,
  getCategories,
  getProducts,
  WHATSAPP_NUMBER,
  type ChannelConfig,
  type CheckoutUpsellConfig,
  type CreatedOrder,
  type PublicCategory,
  type PublicProduct,
} from "@/lib/store";
import { ProductArt } from "@/components/product-art";
import { MiniAddToCart } from "@/components/mini-add-to-cart";
import { QuickViewTrigger } from "@/components/quick-view-trigger";
import { QuizModal } from "@/components/quiz-modal";
import { bnTaka } from "@/components/product-deal-card";
import { RewardCelebration } from "@/components/reward-celebration";
import { bn, bnToNumber } from "@/lib/bn-digits";

const PHONE_RE = /^01\d{9}$/;

// mm:ss for the "একই পার্সেলে যোগ করুন" countdown.
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${bn(String(m).padStart(2, "0"))}:${bn(String(s).padStart(2, "0"))}`;
}

// The order-confirmation page's status tracker — purely presentational, no
// real per-order status feed exists yet, so it always shows "অর্ডার গ্রহণ"
// (just placed) as the current step, same as every order reaching this page.
const CONFIRMATION_STEPS = ["অর্ডার গ্রহণ", "ফোনে কনফার্ম", "প্যাকিং", "ডেলিভারি"];
function OrderStatusTracker() {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-md items-start">
      {CONFIRMATION_STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                i === 0 ? "bg-leaf text-white" : "border-2 border-line bg-surface text-muted"
              }`}
            >
              {i === 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              ) : (
                <span className="num">{bn(i + 1)}</span>
              )}
            </div>
            <span className={`w-20 text-center text-[11px] font-semibold ${i === 0 ? "text-leaf-deep" : "text-muted"}`}>
              {label}
            </span>
          </div>
          {i < CONFIRMATION_STEPS.length - 1 && <div className="mx-1 mt-[-18px] h-0.5 flex-1 bg-line" />}
        </div>
      ))}
    </div>
  );
}

export function CheckoutClient({
  channel,
  suggestions,
}: {
  channel: ChannelConfig | null;
  suggestions: PublicProduct[];
}) {
  const { items, subtotal, setQuantity, remove, add, clear } = useCart();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  // The code field/Apply button stay collapsed behind a plain question line
  // until clicked — most customers don't have a code, so the field doesn't
  // need to sit open by default.
  const [showCoupon, setShowCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  // "অর্ডারের বিবরণ" on the confirmation page reads from this snapshot (taken
  // right before clear() empties the cart in handleSubmit), not live cart
  // state, which is gone by the time that section renders. Re-synced to the
  // server's own totals whenever a same-parcel upsell item is added below,
  // so it never drifts from what the order will actually be charged.
  const [orderedSummary, setOrderedSummary] = useState<{
    lines: {
      key: string;
      name: string;
      variantLabel?: string | null;
      quantity: number;
      lineTotal: number;
      // Set whenever this specific line carries its own discount — e.g. one
      // added from the "একই পার্সেলে যোগ করুন" strip at that feature's
      // percent off, so it's clear in the breakdown which line that was.
      discountPercent?: number;
    }[];
    discountAmount: number;
    deliveryCharge: number;
    finalTotal: number;
  } | null>(null);
  // The confirmation page's "কোনটা নেবেন বুঝছেন না?" strip — same real quiz
  // modal HelpCards opens elsewhere, not a separate flow.
  const [confirmQuizOpen, setConfirmQuizOpen] = useState(false);

  const phoneValid = PHONE_RE.test(phone);

  // Mirrors CartDrawer's gross/net math exactly — same reward tiers, same
  // delivery-charge waiver — so what this page shows is never more generous
  // than what StorefrontService.createOrder actually charges.
  const grossTotal = items.reduce((sum, i) => sum + (i.basePrice ?? i.price) * i.quantity, 0);
  const itemSavings = grossTotal - subtotal;

  // Everything EXCEPT combo-builder items (see CartDrawer's own comment) —
  // a combo already has its own bundle pricing, so its value never also
  // counts toward a spend-more reward or a coupon.
  const standaloneGrossTotal = items
    .filter((i) => !i.comboGroupId)
    .reduce((sum, i) => sum + (i.basePrice ?? i.price) * i.quantity, 0);

  const rewardTiers = channel?.spendingRewards ?? [];
  const metRewardTiers = rewardTiers.filter((t) => standaloneGrossTotal >= t.amount);
  const discountTier = [...metRewardTiers].reverse().find((t) => (t.discountPercent ?? 0) > 0);
  const rewardDiscountPercent = discountTier?.discountPercent ?? 0;

  const itemDiscountPercents = Array.from(
    new Set(
      items
        .filter((i) => i.basePrice !== undefined && i.basePrice > i.price)
        .map((i) => Math.round(((i.basePrice! - i.price) / i.basePrice!) * 100)),
    ),
  );
  const itemSavingsLabel = itemDiscountPercents.length === 1 ? `${bn(itemDiscountPercents[0])}%` : "";

  // A real, already-earned discount gets a one-time confetti celebration on
  // this page — never for "almost there" (nextTier) states, only for what's
  // actually been reached. That includes a channel-wide spend-more reward
  // AND a plain per-product quantity-tier discount (Settings → Other
  // Settings → Quantity discounts) — both are real money off, so both earn
  // it, not just the spend-more one. celebratedRef stops it firing again if
  // items change later and briefly dip below a tier before coming back, or
  // on an unrelated re-render — once per page visit is enough.
  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedRef = useRef(false);
  // "হিসাব দেখুন" — same collapsed-by-default breakdown as CartDrawer.
  const [showBreakdown, setShowBreakdown] = useState(false);
  // One combined sentence even when 2+ things are true at once (e.g. "আপনি
  // ফ্রি ডেলিভারি, ৫% ছাড় পাচ্ছেন") instead of repeating "আপনি … পাচ্ছেন" once
  // per reward.
  const rewardDescriptions = [
    ...metRewardTiers.map((t) => t.description),
    ...(itemSavings > 0 ? [itemSavingsLabel ? `${itemSavingsLabel} ছাড়` : "ছাড়"] : []),
  ];
  const hasReward = rewardDescriptions.length > 0;
  const celebrationMessage = `আপনি ${rewardDescriptions.join(" + ")} পাচ্ছেন`;
  useEffect(() => {
    if (!hasReward || celebratedRef.current) return;
    celebratedRef.current = true;
    setShowCelebration(true);
    const t = setTimeout(() => setShowCelebration(false), 5000);
    return () => clearTimeout(t);
  }, [hasReward]);

  // The applied coupon doesn't stack with the spend-more reward above —
  // same "best wins, not summed" rule StorefrontService.createOrder applies
  // server-side, so this never shows a bigger discount than what's charged.
  const couponDiscountPercent = appliedCoupon?.discountPercent ?? 0;
  const couponWins = couponDiscountPercent > rewardDiscountPercent;
  const bestDiscountPercent = Math.max(rewardDiscountPercent, couponDiscountPercent);
  const discountAmount = bestDiscountPercent ? Math.round((standaloneGrossTotal * bestDiscountPercent) / 100) : 0;
  const savingsLabel = couponWins
    ? `কুপন ${appliedCoupon!.code}`
    : metRewardTiers.map((t) => t.description).join(" + ");

  // "নিজের কম্বো" — grouped into its own card exactly like CartDrawer (same
  // reference design), instead of flat rows mixed in with regular items.
  // Settings → Home Page Combo → Pricing tier cards' Rate % is the real
  // part: the highest-amount tier this group's own (gross) subtotal reaches
  // sets its discount, and a tier with Free delivery ticked waives the
  // order's delivery charge just like a spend-more reward's own
  // freeDelivery — exactly the rule StorefrontService.createOrder applies
  // when the order is actually created from the same comboGroupId.
  const comboTiers = (channel?.comboBanners?.[0]?.tiers ?? [])
    .filter((t) => (t.discountPercent ?? 0) > 0)
    .map((t) => ({ amount: bnToNumber(t.title), discountPercent: t.discountPercent!, description: t.description }));
  // Every pricing-tier card, discount or not (e.g. a free-delivery-only
  // first step) — sorted lowest-amount first, same convention as the
  // spend-more rewards box, so the combo card's own "আর ৳X যোগ করলে …" hint
  // below can find the very next one regardless of admin row order.
  const allComboTiers = (channel?.comboBanners?.[0]?.tiers ?? [])
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
  // whenever a met reward tier has Free delivery ticked, or any combo
  // group's own tier does — the exact same rule
  // StorefrontService.createOrder applies server-side.
  const metFreeDelivery = metRewardTiers.some((t) => t.freeDelivery) || comboFreeDelivery;
  const deliveryCharge = channel?.deliveryCharge && !metFreeDelivery ? channel.deliveryCharge : 0;
  const showDeliveryLine = Boolean(channel?.deliveryCharge);
  // The real delivery charge even when waived — shown as "৳100 (ফ্রি)"
  // instead of a bare "ফ্রি" so the actual taka amount being saved is never
  // hidden, and folded into totalSavings below for the same reason.
  const deliverySavings = metFreeDelivery ? (channel?.deliveryCharge ?? 0) : 0;

  const finalTotal = subtotal - discountAmount - comboDiscountTotal + deliveryCharge;
  const totalSavings = itemSavings + discountAmount + comboDiscountTotal + deliverySavings;
  // What this order would have cost with no discounts and no waived
  // delivery — the সর্বমোট row's struck-through figure.
  // const originalTotal = finalTotal + totalSavings;

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
    router.push("/combo");
    // A same-URL push doesn't remount the page, so ComboBuilder's own mount
    // effect never re-runs on its own; this nudges it to re-read what was
    // just written above instead of showing an empty builder.
    window.dispatchEvent(new Event("relief-care:combo-updated"));
  }
  function removeCombo(groupItems: CartItem[]) {
    groupItems.forEach((i) => remove(i.productId, i.variantId, { silent: true }));
    toast("কার্ট থেকে ডিলিট হয়েছে");
  }

  // One real, in-stock suggestion not already in the cart — the same
  // admin-curated Flash Sale list CartDrawer's cross-sell row uses. Adding
  // it ticks it into a normal cart line at its real price; no invented
  // "bundle" discount is applied since no such pricing exists server-side.
  const cartIds = new Set(items.map((i) => i.productId));
  const addon = suggestions.find((p) => !cartIds.has(p.productId));

  useEffect(() => {
    if (!phoneValid || items.length === 0) return;
    const t = setTimeout(() => {
      saveCheckoutLead({
        customerPhone: phone,
        customerName: name || undefined,
        shippingAddress: address || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [phone, name, address, items, phoneValid]);

  // Order-confirmation page extras — fetched only once an order actually
  // exists, since there's nothing to show (and nothing safe to price) before
  // checkout succeeds.
  const [upsell, setUpsell] = useState<CheckoutUpsellConfig | null>(null);
  const [upsellSecondsLeft, setUpsellSecondsLeft] = useState(0);
  // Which upsell items have been successfully added to the real order (see
  // addToSameParcel below) — drives each button's "✓ যোগ হয়েছে" state.
  const [addedUpsellIds, setAddedUpsellIds] = useState<Set<string>>(new Set());
  // The one upsell item currently being added, if any — disables its own
  // button (and only its own) while the request is in flight.
  const [addingUpsellId, setAddingUpsellId] = useState<string | null>(null);
  const [moreCategories, setMoreCategories] = useState<PublicCategory[]>([]);
  const [moreCategoryId, setMoreCategoryId] = useState<string | null>(null);
  const [moreProducts, setMoreProducts] = useState<PublicProduct[]>([]);
  const orderId = order?.id;

  useEffect(() => {
    if (!orderId) return;
    getCheckoutUpsell()
      .then((cfg) => {
        setUpsell(cfg);
        if (cfg.enabled && cfg.items.length > 0) setUpsellSecondsLeft(cfg.durationMinutes * 60);
      })
      .catch(() => {});
    getCategories()
      .then(setMoreCategories)
      .catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    getProducts({ categoryId: moreCategoryId ?? undefined, limit: 8 })
      .then((res) => setMoreProducts(res.items))
      .catch(() => {});
  }, [orderId, moreCategoryId]);

  // Ticks the countdown down to 0, then stops (the strip itself hides once
  // it reaches 0 — see the render below).
  useEffect(() => {
    if (upsellSecondsLeft <= 0) return;
    const t = setTimeout(() => setUpsellSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [upsellSecondsLeft]);

  // Really adds the product to the order just placed, at the strip's
  // advertised discount and with no added delivery charge — the backend
  // re-validates the order is still PENDING/unapproved and the countdown
  // hasn't expired, so this can still fail even with the button enabled
  // (e.g. the admin approved the order in another tab a moment ago).
  async function addToSameParcel(productId: string) {
    if (!order || addedUpsellIds.has(productId) || addingUpsellId) return;
    setAddingUpsellId(productId);
    try {
      const result = await addUpsellItem(order.id, productId);
      setAddedUpsellIds((prev) => new Set(prev).add(productId));
      // Synced to the server's own totals — never guessed client-side — so
      // "অর্ডারের বিবরণ" always matches what the order will actually charge.
      setOrderedSummary({
        lines: result.items.map((i) => {
          const lineDiscount = Number(i.discount);
          const rawLineTotal = Number(i.unitPrice) * i.quantity;
          return {
            key: i.productId,
            name: i.productName,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
            lineTotal: Number(i.total),
            discountPercent:
              lineDiscount > 0 && rawLineTotal > 0 ? Math.round((lineDiscount / rawLineTotal) * 100) : undefined,
          };
        }),
        discountAmount: Number(result.discount),
        deliveryCharge: Number(result.shippingFee),
        finalTotal: Number(result.total),
      });
      toast("পার্সেলে যোগ হয়েছে ✓");
    } catch (err) {
      toast(err instanceof Error ? err.message : "যোগ করা গেল না, আবার চেষ্টা করুন");
    } finally {
      setAddingUpsellId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("কার্ট খালি আছে। কেনাকাটা চালিয়ে যান।");
      return;
    }
    if (!phoneValid) {
      setError("১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)");
      return;
    }
    if (!name.trim() || !address.trim()) {
      setError("নাম ও পূর্ণ ঠিকানা লিখুন");
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeOrder({
        customerName: name.trim(),
        customerPhone: phone,
        shippingAddress: address.trim(),
        notes: note.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          comboGroupId: i.comboGroupId,
        })),
        couponCode: appliedCoupon?.code,
      });
      setOrder(result);
      // Snapshotted before clear() empties the cart — "অর্ডারের বিবরণ" below
      // reads from this, not the live (now-empty) cart.
      setOrderedSummary({
        lines: items.map((i) => ({
          key: `${i.productId}:${i.variantId ?? ""}`,
          name: i.name,
          variantLabel: i.variantLabel,
          quantity: i.quantity,
          lineTotal: i.price * i.quantity,
          discountPercent:
            i.basePrice && i.basePrice > i.price
              ? Math.round(((i.basePrice - i.price) / i.basePrice) * 100)
              : undefined,
        })),
        discountAmount: discountAmount + comboDiscountTotal,
        deliveryCharge,
        finalTotal,
      });
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    const showUpsell = Boolean(upsell?.enabled && upsell.items.length > 0 && upsellSecondsLeft > 0);
    return (
      <div className="mx-auto flex w-full flex-col gap-4">
        <div className="rounded-card bg-surface p-8 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-leaf text-white">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 5 5 9-10" />
            </svg>
          </div>
          <h1 className="font-display text-2xl">ধন্যবাদ, অর্ডার হয়েছে!</h1>
          <p className="num mt-2 text-lg text-amber-deep">#{order.orderNumber}</p>
          <p className="mt-2 text-sm text-muted">আমাদের প্রতিনিধি শীঘ্রই কল করে অর্ডার কনফার্ম করবেন।</p>
          <OrderStatusTracker />
        </div>

        {(showUpsell || moreProducts.length > 0) && (
          <div className="rounded-card border-2 border-dashed border-amber bg-amber-soft p-4">
            {showUpsell && upsell && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base text-ink">একই পার্সেলে যোগ করুন, ডেলিভারি চার্জ লাগবে না</p>
                    <p className="mt-1 text-xs text-muted">
                      আপনার অর্ডার এখনো প্যাক হয়নি। এখন যোগ করলে প্রতিটি পণ্যে
                      {upsell.discountPercent > 0 ? ` অতিরিক্ত ${bn(upsell.discountPercent)}% ছাড়,` : ""} আলাদা অর্ডার
                      করতে হবে না।
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-surface px-3 py-2 text-center">
                    <p className="num font-display text-lg text-amber-deep">{formatCountdown(upsellSecondsLeft)}</p>
                    <p className="text-[10px] text-muted">অফার বাকি</p>
                  </div>
                </div>
                <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-1">
                  {upsell.items.map((p) => {
                    const discountedPrice =
                      upsell.discountPercent > 0
                        ? Math.round(p.price * (1 - upsell.discountPercent / 100))
                        : p.price;
                    const added = addedUpsellIds.has(p.productId);
                    const adding = addingUpsellId === p.productId;
                    return (
                      <div key={p.productId} className="w-32 shrink-0 rounded-xl border border-line bg-surface p-2.5">
                        <div className="relative h-20 w-full overflow-hidden rounded-lg bg-leaf-soft">
                          <ProductArt
                            name={p.name}
                            categoryName={p.category?.name ?? null}
                            thumbnailUrl={p.thumbnailUrl}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                        <p className="line-clamp-2 mt-1.5 min-h-[2.4em] text-xs font-semibold leading-snug text-ink">
                          {p.name}
                        </p>
                        <p className="num mt-1 flex items-baseline gap-1 text-sm font-bold text-amber-deep">
                          {bnTaka(discountedPrice)}
                          {discountedPrice !== p.price && (
                            <s className="font-sans text-[10px] font-normal text-muted">{bnTaka(p.price)}</s>
                          )}
                        </p>
                        <button
                          type="button"
                          disabled={added || adding}
                          onClick={() => addToSameParcel(p.productId)}
                          className={`num mt-1.5 w-full rounded-lg py-1.5 text-xs font-semibold disabled:opacity-70 ${
                            added ? "bg-leaf-soft text-leaf-deep" : "bg-leaf text-white"
                          }`}
                        >
                          {added ? "✓ যোগ হয়েছে" : adding ? "যোগ হচ্ছে…" : "অর্ডারে যোগ করুন"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {moreProducts.length > 0 && (
              <div className={showUpsell ? "mt-4 border-t border-amber pt-4" : ""}>
                <p className="font-display mb-2 text-base text-ink">বাসায় আর কারো জন্য কিছু লাগবে?</p>
                <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setMoreCategoryId(null)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                      !moreCategoryId ? "border-leaf bg-leaf text-white" : "border-line text-ink"
                    }`}
                  >
                    সব পণ্য
                  </button>
                  {moreCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMoreCategoryId(c.id)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                        moreCategoryId === c.id ? "border-leaf bg-leaf text-white" : "border-line text-ink"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </nav>
                <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-1">
                  {moreProducts.map((p) => (
                    <div key={p.productId} className="w-32 shrink-0 rounded-xl border border-line bg-surface p-2.5">
                      <div className="relative h-20 w-full overflow-hidden rounded-lg bg-leaf-soft">
                        <ProductArt
                          name={p.name}
                          categoryName={p.category?.name ?? null}
                          thumbnailUrl={p.thumbnailUrl}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <p className="line-clamp-2 mt-1.5 min-h-[2.4em] text-xs font-semibold leading-snug text-ink">
                        {p.name}
                      </p>
                      <p className="num mt-1 flex items-baseline gap-1 text-sm font-bold text-amber-deep">
                        {p.hasVariants ? (
                          <>
                            {bnTaka(p.minPrice ?? p.price)}
                            {p.maxPrice !== undefined && p.maxPrice !== p.minPrice ? `–${bnTaka(p.maxPrice)}` : ""}
                          </>
                        ) : (
                          <>
                            {bnTaka(p.price)}
                            {p.compareAtPrice ? (
                              <s className="font-sans text-[10px] font-normal text-muted">{bnTaka(p.compareAtPrice)}</s>
                            ) : null}
                          </>
                        )}
                      </p>
                      <div className="mt-1.5 text-xs">
                        {p.hasVariants ? (
                          <QuickViewTrigger
                            product={p}
                            className="block w-full rounded-lg border border-leaf bg-transparent py-1.5 text-center text-xs font-semibold text-leaf"
                          >
                            বাছুন
                          </QuickViewTrigger>
                        ) : (
                          <MiniAddToCart product={p} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {orderedSummary && (
          <div className="rounded-card bg-surface p-5">
            <p className="font-display mb-3 text-base text-ink">অর্ডারের বিবরণ</p>
            <div className="flex flex-col gap-1.5 text-sm">
              {orderedSummary.lines.map((i) => (
                <div key={i.key} className="flex items-center justify-between gap-3">
                  <span className="text-ink">
                    {i.name}
                    {i.variantLabel && <span className="text-muted"> · {i.variantLabel}</span>}
                    <span className="num text-muted"> × {bn(i.quantity)}</span>
                    {i.discountPercent ? (
                      <span className="num text-leaf-deep"> (+{bn(i.discountPercent)}% ছাড়)</span>
                    ) : null}
                  </span>
                  <b className="num shrink-0 font-sans text-ink">{bnTaka(i.lineTotal)}</b>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
              {orderedSummary.discountAmount > 0 && (
                <div className="num flex items-center justify-between text-danger">
                  <span className="font-semibold">পরিমাণে ছাড়</span>
                  <span className="font-sans font-semibold">-{bnTaka(orderedSummary.discountAmount)}</span>
                </div>
              )}
              <div className="num flex items-center justify-between">
                <span className="font-semibold text-muted">ডেলিভারি</span>
                <span className="font-sans font-semibold text-ink">
                  {orderedSummary.deliveryCharge > 0 ? bnTaka(orderedSummary.deliveryCharge) : "ফ্রি"}
                </span>
              </div>
              <div className="num flex items-center justify-between pt-1">
                <span className="font-bold text-ink">মোট পরিশোধ</span>
                <span className="font-display font-sans text-lg font-bold text-amber-deep">
                  {bnTaka(orderedSummary.finalTotal)}
                </span>
              </div>
            </div>
          </div>
        )}

        {confirmQuizOpen && <QuizModal onClose={() => setConfirmQuizOpen(false)} />}
        <div className="flex flex-col items-start justify-between gap-3 rounded-card bg-amber-soft p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base text-leaf-deep">কোনটা নেবেন বুঝছেন না?</p>
            <p className="mt-1 text-xs text-muted">
              সমস্যা লিখে দিন, আমাদের প্রতিনিধি কল করে সঠিক পণ্য বেছে দেবেন। কোনো চার্জ নেই।
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setConfirmQuizOpen(true)}
              className="rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-white"
            >
              ফ্রি কল-পরামর্শ
            </button>
            {WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-leaf px-4 py-2 text-sm font-semibold text-leaf-deep"
              >
                হোয়াটসঅ্যাপে লিখুন
              </a>
            )}
          </div>
        </div>

        <Link href="/products" className="block rounded-xl bg-amber px-5 py-2.5 text-center font-semibold text-white">
          আরও কেনাকাটা
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showCelebration && <RewardCelebration message={celebrationMessage} />}
      <Link href="/products" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-leaf">
        ← কেনাকাটা চালিয়ে যান
      </Link>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card bg-surface p-5">
          <h2 className="font-display mb-3 text-lg">ডেলিভারি তথ্য</h2>
          <div className="mb-3 flex flex-col gap-1">
            <label className="text-sm font-semibold">
              আপনার নাম <i className="text-danger">*</i>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: রহিম উদ্দিন"
              className="rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-leaf"
            />
          </div>
          <div className="mb-3 flex flex-col gap-1">
            <label className="text-sm font-semibold">
              মোবাইল নম্বর <i className="text-danger">*</i>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              className="num rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-leaf"
            />
          </div>
          <div className="mb-3 flex flex-col gap-1">
            <label className="text-sm font-semibold">
              পূর্ণ ঠিকানা <i className="text-danger">*</i>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="বাসা/রোড, এলাকা, থানা, জেলা"
              className="rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-leaf"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">নোট (ঐচ্ছিক)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="যেমন: বিকেলে ডেলিভারি দিন"
              className="rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-leaf"
            />
          </div>
        </div>

        <div className="rounded-card bg-surface p-5">
          <h2 className="font-display mb-3 text-lg">আপনার অর্ডার</h2>
          {items.length === 0 ? (
            <p className="text-muted">কার্ট খালি আছে।</p>
          ) : (
            <div className="mb-3 flex flex-col gap-3">
              {comboGroups.map((g) => (
                <div key={g.groupId} className="rounded-xl border border-amber bg-amber-soft p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-white">নিজের কম্বো</span>
                    <span className="num text-xs text-muted font-sans">{bn(g.groupItems.length)}টি পণ্য</span>
                  </div>
                  <div className="num mb-2 flex items-baseline gap-2">
                    {g.groupRegularTotal > g.groupNet && <s className="font-sans text-sm text-muted">{bnTaka(g.groupRegularTotal)}</s>}
                    <b className="font-display text-xl text-amber-deep font-sans">{bnTaka(g.groupNet)}</b>
                  </div>
                  <div className="mb-2 flex flex-col gap-2.5 border-t border-amber pt-2.5">
                    {g.groupItems.map((i) => (
                      <div key={`${i.productId}:${i.variantId ?? ""}`} className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-soft">
                          <ProductArt
                            name={i.name}
                            categoryName={null}
                            thumbnailUrl={i.image}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <span className="num absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-leaf px-1 text-[9px] font-bold text-white">
                            {bn(i.quantity)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-ink">
                            {i.name}
                            {i.variantLabel && <span className="text-muted"> · {i.variantLabel}</span>}
                          </p>
                          <p className="num font-sans text-xs text-muted">
                            {bnTaka(i.price)} × {bn(i.quantity)}
                          </p>
                        </div>
                        <b className="num shrink-0 font-sans text-sm text-ink">{bnTaka(i.price * i.quantity)}</b>
                      </div>
                    ))}
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
              {standaloneItems.map((i) => (
                <div key={`${i.productId}:${i.variantId ?? ""}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-leaf-soft">
                      <ProductArt
                        name={i.name}
                        categoryName={null}
                        thumbnailUrl={i.image}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[10px] font-bold text-white">
                        {bn(i.quantity)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">
                        {i.name}
                        {i.variantLabel && <span className="text-muted"> · {i.variantLabel}</span>}
                      </p>
                      <p className="num font-sans text-xs text-muted">
                        {bnTaka(i.basePrice ?? i.price)} × {bn(i.quantity)}
                      </p>
                      {/* <button
                        type="button"
                        onClick={() => remove(i.productId, i.variantId)}
                        aria-label={`${i.name} সরান`}
                        className="mt-1 block text-base font-bold leading-none text-danger"
                      >
                        ×
                      </button> */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-line-hard">
                          <button
                            type="button"
                            onClick={() =>
                              i.quantity <= 1 ? remove(i.productId, i.variantId) : setQuantity(i.productId, i.quantity - 1, i.variantId)
                            }
                            className="flex h-6 w-6 items-center justify-center text-xs font-bold text-ink bg-leaf-soft"
                            aria-label="কমান"
                          >
                            −
                          </button>
                          <span className="num w-5 text-center text-xs font-semibold font-sans text-ink">{bn(i.quantity)}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(i.productId, i.quantity + 1, i.variantId)}
                            className="flex h-6 w-6 items-center justify-center text-xs font-bold text-leaf-deep bg-leaf-soft"
                            aria-label="বাড়ান"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <b className="num shrink-0 font-sans">{bnTaka(i.price * i.quantity)}</b>
                </div>
              ))}
            </div>
          )}

          {addon && (
            <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber bg-amber-soft px-3.5 py-3">
              <input
                type="checkbox"
                checked={false}
                onChange={(e) => {
                  if (!e.target.checked) return;
                  add(
                    {
                      productId: addon.productId,
                      slug: addon.slug,
                      name: addon.name,
                      image: addon.thumbnailUrl,
                      price: addon.price,
                      basePrice: addon.price,
                    },
                    1,
                  );
                }}
                className="h-4 w-4 shrink-0 accent-amber"
              />
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-leaf-soft">
                <ProductArt
                  name={addon.name}
                  categoryName={addon.category?.name ?? null}
                  thumbnailUrl={addon.thumbnailUrl}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="num text-sm font-semibold text-amber-deep">
                {addon.name} যোগ করুন <span className="font-sans">{bnTaka(addon.price)}</span>
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={() => setShowCoupon((v) => !v)}
            className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-leaf"
          >
            আপনার কি কোনো কুপন, গিফট ভাউচার বা রেফারেল কোড আছে?
            <span className={`transition-transform ${showCoupon ? "rotate-180" : ""}`}>⌄</span>
          </button>
          {showCoupon && (
            <>
              <div className="mb-3 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    // A changed code needs re-applying — don't keep charging the
                    // previous one's discount while a new, unverified code sits
                    // in the box.
                    setAppliedCoupon(null);
                    setCouponMsg("");
                  }}
                  placeholder="কুপন কোড"
                  className="flex-1 rounded-xl border border-dashed border-amber bg-bg px-3.5 py-2.5 uppercase text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = coupon.trim().toUpperCase();
                    if (!code) {
                      setAppliedCoupon(null);
                      setCouponMsg("কুপন কোড লিখুন");
                      return;
                    }
                    const match = (channel?.coupons ?? []).find((c) => c.code.toUpperCase() === code);
                    if (match) {
                      setAppliedCoupon({ code: match.code, discountPercent: match.discountPercent });
                      setCouponMsg(`✓ ${bn(match.discountPercent)}% ছাড় প্রযোজ্য হয়েছে`);
                    } else {
                      setAppliedCoupon(null);
                      setCouponMsg("এই কুপন কোডটি সঠিক নয়");
                    }
                  }}
                  className="rounded-xl bg-leaf px-4 font-semibold text-white"
                >
                  প্রয়োগ
                </button>
              </div>
              {couponMsg && (
                <p className={`num mb-2 text-xs font-semibold ${appliedCoupon ? "text-leaf-deep" : "text-danger"}`}>{couponMsg}</p>
              )}
            </>
          )}

          <div className="border-t border-line pt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">সর্বমোট</span>
              {(itemSavings > 0 || discountAmount > 0 || comboDiscountTotal > 0 || showDeliveryLine) && (
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="flex items-center gap-1 font-sans text-sm font-semibold text-leaf"
                >
                  হিসাব দেখুন
                  <span className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`}>⌄</span>
                </button>
              )}
            </div>
            <div className="num mb-3 flex items-baseline gap-2">
              <b className="font-display text-2xl text-amber-deep font-sans">{bnTaka(finalTotal)}</b>
              {/* {totalSavings > 0 && <s className="font-sans text-sm text-muted">{bnTaka(originalTotal)}</s>} */}
            </div>

            {showBreakdown && (
              <div className="mb-3 flex flex-col gap-1 rounded-lg bg-bg p-3">
                <div className="num flex items-center justify-between text-sm">
                  <span className="font-semibold text-leaf">পণ্যের মূল দাম</span>
                  <span className="font-sans font-semibold text-leaf">{bnTaka(grossTotal)}</span>
                </div>
                {itemSavings > 0 && (
                  <div className="num flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold">পণ্যে ছাড়{itemSavingsLabel ? `(${itemSavingsLabel})` : ""}</span>
                    <span className="font-sans font-semibold">-{bnTaka(itemSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="num flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold">পরিমাণে ছাড়{savingsLabel ? ` (${savingsLabel})` : ""}</span>
                    <span className="font-sans font-semibold">-{bnTaka(discountAmount)}</span>
                  </div>
                )}
                {comboDiscountTotal > 0 && (
                  <div className="num flex items-center justify-between text-sm text-danger">
                    <span className="font-semibold">কম্বো ছাড়</span>
                    <span className="font-sans font-semibold">-{bnTaka(comboDiscountTotal)}</span>
                  </div>
                )}
                {showDeliveryLine && (
                  <div className="num flex items-center justify-between text-sm">
                    <span className="font-semibold text-leaf">ডেলিভারি চার্জ</span>
                    <span className="font-sans font-semibold text-ink">
                      {deliveryCharge > 0 ? bnTaka(deliveryCharge) : `${bnTaka(channel?.deliveryCharge ?? 0)} (ফ্রি)`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {totalSavings > 0 && (
            <p className=" font-sans mb-0 rounded-lg border-2 border-leaf-soft px-3 py-2 text-center text-sm font-semibold text-leaf-deep">
              এই অর্ডারে আপনি মোট <span className="text-xl">{bnTaka(totalSavings)}</span> সাশ্রয় করছেন
            </p>
          )}

          {error && <p className="mt-3 rounded-lg bg-danger-soft p-2.5 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="num mt-2 w-full rounded-xl bg-amber py-3.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "অর্ডার হচ্ছে…" : `অর্ডার কনফার্ম করুন · ${bnTaka(finalTotal)}`}
          </button>

          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 block w-full rounded-xl border border-leaf py-3 text-center font-semibold text-leaf-deep"
            >
              অর্ডার করতে সমস্যা? হোয়াটসঅ্যাপে লিখুন
            </a>
          )}

          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            পেমেন্ট: ক্যাশ অন ডেলিভারি, পণ্য হাতে পেয়ে টাকা দিন . 
            <Link href="/policy" className="font-semibold text-leaf underline">
              রিটার্ন নীতি
            </Link>
          </p>
          {/* <p className="mt-1.5 text-xs text-muted">
            ভাঙা, ভুল বা মেয়াদোত্তীর্ণ পণ্য এলে বদলে দেব ·{" "}
            <Link href="/policy" className="font-semibold text-leaf underline">
              রিটার্ন নীতি
            </Link>
          </p> */}
        </div>
      </form>
    </div>
  );
}
