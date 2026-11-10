"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { placeOrder, saveCheckoutLead, WHATSAPP_NUMBER, type ChannelConfig, type CreatedOrder, type PublicProduct } from "@/lib/store";
import { ProductArt } from "@/components/product-art";
import { bnTaka } from "@/components/product-deal-card";
import { bn } from "@/lib/bn-digits";

const PHONE_RE = /^01\d{9}$/;

export function CheckoutClient({
  channel,
  suggestions,
}: {
  channel: ChannelConfig | null;
  suggestions: PublicProduct[];
}) {
  const { items, subtotal, setQuantity, remove, add, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  const phoneValid = PHONE_RE.test(phone);

  // Mirrors CartDrawer's gross/net math exactly — same reward tiers, same
  // delivery-charge waiver — so what this page shows is never more generous
  // than what StorefrontService.createOrder actually charges.
  const grossTotal = items.reduce((sum, i) => sum + (i.basePrice ?? i.price) * i.quantity, 0);
  const itemSavings = grossTotal - subtotal;

  const rewardTiers = channel?.spendingRewards ?? [];
  const metRewardTiers = rewardTiers.filter((t) => grossTotal >= t.amount);
  const discountTier = [...metRewardTiers].reverse().find((t) => (t.discountPercent ?? 0) > 0);
  const discountAmount = discountTier ? Math.round((grossTotal * discountTier.discountPercent!) / 100) : 0;
  const savingsLabel = metRewardTiers.map((t) => t.description).join(" + ");

  const itemDiscountPercents = Array.from(
    new Set(
      items
        .filter((i) => i.basePrice !== undefined && i.basePrice > i.price)
        .map((i) => Math.round(((i.basePrice! - i.price) / i.basePrice!) * 100)),
    ),
  );
  const itemSavingsLabel = itemDiscountPercents.length === 1 ? `${bn(itemDiscountPercents[0])}%` : "";

  const metFreeDelivery = metRewardTiers.some((t) => t.freeDelivery);
  const deliveryCharge = channel?.deliveryCharge && !metFreeDelivery ? channel.deliveryCharge : 0;
  const showDeliveryLine = Boolean(channel?.deliveryCharge);
  const finalTotal = subtotal - discountAmount + deliveryCharge;
  const totalSavings = itemSavings + discountAmount;

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
    if (!name.trim() || address.trim().length < 8) {
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
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      });
      setOrder(result);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-md rounded-card bg-surface p-8 text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-leaf text-white">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h1 className="font-display text-2xl">ধন্যবাদ, অর্ডার হয়েছে!</h1>
        <p className="num mt-2 text-lg text-amber-deep">#{order.orderNumber}</p>
        <p className="mt-2 text-sm text-muted">আমাদের প্রতিনিধি শীঘ্রই কল করে অর্ডার কনফার্ম করবেন।</p>
        <Link href="/products" className="mt-5 inline-block rounded-xl bg-amber px-5 py-2.5 font-semibold text-white">
          আরও কেনাকাটা
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
              {items.map((i) => (
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
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-line-hard">
                          <button
                            type="button"
                            onClick={() =>
                              i.quantity <= 1 ? remove(i.productId, i.variantId) : setQuantity(i.productId, i.quantity - 1, i.variantId)
                            }
                            className="flex h-6 w-6 items-center justify-center text-xs font-bold text-ink"
                            aria-label="কমান"
                          >
                            −
                          </button>
                          <span className="num w-5 text-center text-xs font-semibold text-ink">{bn(i.quantity)}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(i.productId, i.quantity + 1, i.variantId)}
                            className="flex h-6 w-6 items-center justify-center text-xs font-bold text-leaf-deep"
                            aria-label="বাড়ান"
                          >
                            +
                          </button>
                        </div>
                        <button type="button" onClick={() => remove(i.productId, i.variantId)} className="font-sans text-xs text-muted underline">
                          সরান
                        </button>
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

          <div className="mb-3 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="কুপন কোড"
              className="flex-1 rounded-xl border border-dashed border-amber bg-bg px-3.5 py-2.5 uppercase text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setCouponMsg(coupon ? "কুপন কোড শীঘ্রই আসছে" : "কুপন কোড লিখুন")}
              className="rounded-xl bg-leaf px-4 font-semibold text-white"
            >
              প্রয়োগ
            </button>
          </div>
          {couponMsg && <p className="mb-2 text-xs text-muted">{couponMsg}</p>}

          <div className="border-t border-line pt-3">
            <div className="num mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-leaf">পণ্যের মূল দাম</span>
              <span className="font-sans font-semibold text-leaf">{bnTaka(grossTotal)}</span>
            </div>
            {itemSavings > 0 && (
              <div className="num mb-1 flex items-center justify-between text-sm text-danger">
                <span className="font-semibold">পণ্যে ছাড়{itemSavingsLabel ? `(${itemSavingsLabel})` : ""}</span>
                <span className="font-sans font-semibold">-{bnTaka(itemSavings)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="num mb-1 flex items-center justify-between text-sm text-danger">
                <span className="font-semibold">পরিমাণে ছাড়{savingsLabel ? ` (${savingsLabel})` : ""}</span>
                <span className="font-sans font-semibold">-{bnTaka(discountAmount)}</span>
              </div>
            )}
            {showDeliveryLine && (
              <div className="num mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-leaf">ডেলিভারি চার্জ</span>
                <span className="font-sans font-semibold text-ink">{deliveryCharge > 0 ? bnTaka(deliveryCharge) : "ফ্রি"}</span>
              </div>
            )}
            <div className="num mb-3 flex items-center justify-between border-t border-line pt-2 text-base font-semibold">
              <span>সর্বমোট</span>
              <span className="text-amber-deep font-sans">{bnTaka(finalTotal)}</span>
            </div>
          </div>

          {totalSavings > 0 && (
            <p className=" font-sans mb-3 rounded-lg bg-leaf-soft px-3 py-2 text-center text-sm font-semibold text-leaf-deep">
              এই অর্ডারে আপনি মোট {bnTaka(totalSavings)} সাশ্রয় করছেন
            </p>
          )}

          {error && <p className="mt-3 rounded-lg bg-danger-soft p-2.5 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="num mt-4 w-full rounded-xl bg-amber py-3.5 font-bold text-white disabled:opacity-50"
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
            পেমেন্ট: ক্যাশ অন ডেলিভারি, পণ্য হাতে পেয়ে টাকা দিন
          </p>
          <p className="mt-1.5 text-xs text-muted">
            ভাঙা, ভুল বা মেয়াদোত্তীর্ণ পণ্য এলে বদলে দেব ·{" "}
            <Link href="/policy" className="font-semibold text-leaf underline">
              রিটার্ন নীতি
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
