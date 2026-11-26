"use client";

import { useEffect, useState } from "react";
import { createCallRequest, STORE_HOURS } from "@/lib/store";
import { toWhatsappNumber } from "./whatsapp-widget";

// Same 11-digit BD mobile number rule and input-masking approach as the
// checkout form (app/checkout/checkout-client.tsx) — digits only, capped at
// 11 characters as they're typed, validated against this shape on submit.
const PHONE_RE = /^01\d{9}$/;

// "ফ্রি কল-পরামর্শ নিন" card's own popup (see HelpCards) — same overlay/
// close-button shell as QuizModal, wrapping a two-step flow of its own:
// the request form, then (on success) a confirmation screen with the
// generated request code and a WhatsApp fallback for anyone who doesn't
// want to wait for the call.
export function CallRequestModal({
  onClose,
  storeName,
  customerCarePhone,
}: {
  onClose: () => void;
  storeName: string;
  customerCarePhone: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requestCode: string } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !problem.trim()) return;
    if (!PHONE_RE.test(phone)) {
      setError("১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createCallRequest({ name: name.trim(), phone: phone.trim(), problem: problem.trim() });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "অনুরোধ পাঠানো যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      aria-hidden
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="ফ্রি কল-পরামর্শ"
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-card bg-surface p-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-bg text-lg text-ink"
        >
          ×
        </button>

        {result ? (
          <div className="flex flex-col items-center gap-4 pt-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-xl">অনুরোধ পেয়েছি, {name.trim()}!</h2>
              <p className="mt-1 text-sm text-muted">
                আমাদের প্রতিনিধি শীঘ্রই {phone.trim()} নম্বরে কল করবেন।
              </p>
            </div>

            <div className="w-full rounded-xl bg-leaf-soft p-4 text-center">
              <p className="text-xs text-muted">যে নম্বর থেকে কল আসবে, সেভ করে রাখুন</p>
              <p className="num mt-1 font-display text-2xl font-bold text-leaf-deep">
                {customerCarePhone || "01XXX-XXXXXX"}
              </p>
              <p className="mt-1 text-xs text-muted">{storeName}</p>
            </div>

            <p className="text-xs text-muted">
              অনুরোধ নম্বর {result.requestCode} · কল আসবে {STORE_HOURS}র মধ্যে
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-amber py-3 font-semibold text-white"
            >
              ঠিক আছে
            </button>

            {customerCarePhone && (
              <a
                href={`https://wa.me/${toWhatsappNumber(customerCarePhone)}?text=${encodeURIComponent(
                  `আমি একটা কল-পরামর্শের অনুরোধ পাঠিয়েছি (${result.requestCode}), অপেক্ষা না করে এখনই কথা বলতে চাই।`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-leaf py-2.5 text-sm font-semibold text-leaf-deep"
              >
                অপেক্ষা না করে হোয়াটসঅ্যাপে লিখুন
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
              </span>
              <div>
                <h2 className="font-display text-xl text-amber-deep">ফ্রি কল-পরামর্শ</h2>
                <p className="text-sm text-muted">অভিজ্ঞ প্রতিনিধি নিজে কল করে আপনার সমস্যা শুনবেন</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-bg p-3 text-center text-xs text-muted">
              {["সমস্যা লিখুন", "আমরা কল করব", "পছন্দ হলে অর্ডার"].map((step, i) => (
                <div key={step}>
                  <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-leaf text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-leaf"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="01XXXXXXXXX"
                  className="num w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-leaf"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">আপনার সমস্যা লিখুন *</label>
                <textarea
                  required
                  rows={3}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full rounded-xl border border-leaf bg-bg px-3 py-2.5 text-ink outline-none focus:border-leaf"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber py-3 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "পাঠানো হচ্ছে…" : "কল করার অনুরোধ পাঠান"}
              </button>
            </form>

            <ul className="mt-4 flex flex-col gap-1 text-xs text-muted">
              <li>✓ কোনো চার্জ নেই, কেনার বাধ্যবাধকতাও নেই</li>
              <li>✓ কল করা হয় {STORE_HOURS}র মধ্যে</li>
              <li>! গুরুতর বা জরুরি লক্ষণে সরাসরি ডাক্তার দেখান</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
