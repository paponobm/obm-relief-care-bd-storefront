"use client";

import { useEffect, useRef, useState } from "react";

// Local Bangladeshi numbers (e.g. "01020102012") are what Settings →
// Social & Contact stores — wa.me needs the international form with no
// leading 0 (e.g. "8801020102012"). Already-international input passes
// through untouched.
export function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}

// Quick-reply starters — tapping one opens WhatsApp with this text already
// filled in, so the visitor doesn't have to type the first message.
const QUICK_REPLIES = [
  "আমার অর্ডারের আপডেট জানতে চাই",
  "কোন পণ্যটা আমার জন্য ভালো হবে?",
  "আমি অর্ডার করতে চাই",
  "ডেলিভারি কতদিনে পাব?",
];

export function WhatsappWidget({
  storeName,
  logoUrl,
  customerCarePhone,
}: {
  storeName: string;
  logoUrl: string | null;
  customerCarePhone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!customerCarePhone) return null;
  const number = toWhatsappNumber(customerCarePhone);
  const waLink = (text?: string) =>
    `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(88vw,340px)] overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-black/5">
          <div className="flex items-center gap-2.5 bg-leaf-deep px-4 py-3 text-white">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small fixed-size chat avatar
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{storeName}</p>
              <p className="text-xs text-white/80">সাধারণত ৫ মিনিটের মধ্যে উত্তর দেই</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="বন্ধ করুন"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-3 p-3.5">
            <p className="rounded-xl rounded-tl-sm bg-leaf-soft px-3.5 py-2.5 text-sm text-ink">
              আসসালামু আলাইকুম! কোন সমস্যার জন্য পণ্য খুঁজছেন? নিচের যেকোনো একটা চাপুন, সরাসরি হোয়াটসঅ্যাপে কথা হবে।
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_REPLIES.map((text) => (
                <a
                  key={text}
                  href={waLink(text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-leaf px-3.5 py-2 text-left text-sm font-medium text-leaf-deep hover:bg-leaf-soft"
                >
                  {text}
                </a>
              ))}
            </div>
            <p className="num text-center text-xs text-muted">অথবা সরাসরি নম্বর: {customerCarePhone}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="উপরে যান"
        className="grid h-14 w-14 place-items-center rounded-full bg-leaf-deep text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="হোয়াটসঅ্যাপে কথা বলুন"
        className="grid h-14 w-14 place-items-center rounded-full bg-[#1FA855] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.666 4.523 1.82 6.377L4 29l7.823-1.77A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.57 17.03c-.28.79-1.38 1.46-2.27 1.65-.6.13-1.38.23-4.03-.86-3.38-1.4-5.56-4.83-5.73-5.05-.17-.23-1.37-1.82-1.37-3.47 0-1.65.86-2.46 1.17-2.79.3-.33.66-.41.88-.41.22 0 .44 0 .63.01.2.01.47-.08.74.56.28.66.94 2.3 1.02 2.47.08.17.13.37.03.6-.1.23-.15.37-.3.57-.15.2-.32.45-.46.6-.15.17-.31.35-.13.68.17.33.78 1.29 1.68 2.1 1.15 1.03 2.12 1.35 2.45 1.5.33.15.52.13.71-.08.2-.2.84-.98 1.06-1.32.22-.33.44-.28.74-.17.3.1 1.9.9 2.23 1.06.33.17.55.25.63.39.08.14.08.82-.2 1.61Z" />
        </svg>
      </button>
    </div>
  );
}
