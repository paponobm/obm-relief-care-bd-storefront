"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE_ADDRESS, STORE_HOURS, STORE_NAME, type SocialLink } from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { PLATFORM_META } from "./side-menu";

export function Footer({
  customerCarePhone,
  socialLinks,
}: {
  customerCarePhone: string | null;
  socialLinks: SocialLink[];
}) {
  // Checkout's own delivery-info/order-summary cards already fill the page
  // — the footer's address/links/newsletter block underneath just adds
  // scroll without helping someone mid-checkout.
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    if (!customerCarePhone) return;
    try {
      await navigator.clipboard.writeText(customerCarePhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to fall back to here.
    }
  }

  if (pathname === "/checkout") return null;

  return (
    <footer className="mt-5 border-t border-line bg-custom-dark-green ">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 text-sm sm:grid-cols-3 xl:px-8">
        <div className="flex flex-col gap-2">
          <b className="font-display text-amber font-bold text-2xl ">{STORE_NAME}</b>
          <p className="text-white">
            ব্যথা, চুলকানি, সর্দি, ত্বক ও পরিবারের যত্নের আসল পণ্য এক জায়গায়। পণ্য হাতে পেয়ে টাকা দিন, সারা
            বাংলাদেশে হোম ডেলিভারি।
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <b className="font-display text-2xl text-amber font-bold ">যোগাযোগ</b>
          {customerCarePhone && (
            <div className="flex flex-col gap-1.5">
              <small className="text-xs text-white/60">কল বা হোয়াটসঅ্যাপ</small>
              <div className="flex items-center gap-2">
                <b className="num font-display text-xl text-white">{customerCarePhone}</b>
                <button
                  type="button"
                  onClick={copyPhone}
                  className="shrink-0 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                >
                  {copied ? "কপি হয়েছে" : "কপি"}
                </button>
              </div>
            </div>
          )}
          <span className="text-white">
            প্রতিদিন {STORE_HOURS} · {STORE_ADDRESS}
          </span>
          {socialLinks.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_META[s.platform].color }} />
                  {PLATFORM_META[s.platform].label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <b className="font-display text-2xl text-amber font-bold ">তথ্য</b>
          <Link href="/track" className="text-white hover:text-amber-deep">
            অর্ডার ট্র্যাক করুন
          </Link>
          <Link href="/policy" className="text-white   hover:text-amber-deep">
            ডেলিভারি ও রিটার্ন নীতি
          </Link>
          <Link href="/quiz" className="text-white  hover:text-amber-deep">
            কোন পণ্য নেবেন? কুইজ
          </Link>
          <Link href="/#health-tips" className="text-white hover:text-amber-deep">
            স্বাস্থ্য টিপস
          </Link>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-white xl:px-8">
        © {bn(new Date().getFullYear())} {STORE_NAME}
      </div>
    </footer>
  );
}
