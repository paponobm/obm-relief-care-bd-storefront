"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatTaka, placeOrder, saveCheckoutLead, type CreatedOrder } from "@/lib/store";
import { ProductArt } from "@/components/product-art";

const PHONE_RE = /^01\d{9}$/;

export default function CheckoutPage() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();
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
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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
          <div className="mb-3 flex flex-col gap-2.5">
            {items.map((i) => (
              <div key={i.productId} className="grid grid-cols-[48px_1fr_auto] items-center gap-2.5 text-sm">
                <div className="h-12 w-12 overflow-hidden rounded-lg">
                  <ProductArt
                    name={i.name}
                    categoryName={null}
                    thumbnailUrl={i.image}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="line-clamp-1 font-medium">{i.name}</div>
                  <div className="num flex items-center gap-2 text-xs text-muted">
                    {formatTaka(i.price)} ×
                    <button type="button" onClick={() => setQuantity(i.productId, i.quantity - 1)} className="px-1">
                      −
                    </button>
                    {i.quantity}
                    <button type="button" onClick={() => setQuantity(i.productId, i.quantity + 1)} className="px-1">
                      +
                    </button>
                    <button type="button" onClick={() => remove(i.productId)} className="underline">
                      সরান
                    </button>
                  </div>
                </div>
                <b className="num">{formatTaka(i.price * i.quantity)}</b>
              </div>
            ))}
          </div>
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

        <div className="num flex justify-between border-t border-line pt-3 text-base font-semibold">
          <span>সাবটোটাল</span>
          <span>{formatTaka(subtotal)}</span>
        </div>

        {error && <p className="mt-3 rounded-lg bg-danger-soft p-2.5 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="num mt-4 w-full rounded-xl bg-amber py-3.5 font-bold text-white disabled:opacity-50"
        >
          {submitting ? "অর্ডার হচ্ছে…" : `অর্ডার কনফার্ম করুন · ${formatTaka(subtotal)}`}
        </button>
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-bg p-2.5 text-xs text-muted">
          পেমেন্ট: ক্যাশ অন ডেলিভারি, পণ্য হাতে পেয়ে টাকা দিন
        </p>
      </div>
    </form>
  );
}
