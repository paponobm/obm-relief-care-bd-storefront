"use client";

import { useState } from "react";

export function CouponPill({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable — the code is still visible to copy by hand
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="relative z-10 inline-flex items-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-[#FFC069] bg-white/10 px-3 py-2">
      <span className="text-sm">{label}</span>
      <code className="font-display text-lg font-extrabold tracking-wider text-[#FFC069]">{code}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-lg bg-[#FFC069] px-2.5 py-1 text-xs font-semibold text-[#3A2400]"
      >
        {copied ? "কপি হয়েছে" : "কপি"}
      </button>
    </div>
  );
}
