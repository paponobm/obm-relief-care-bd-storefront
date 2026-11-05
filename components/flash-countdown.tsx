"use client";

import { useEffect, useState } from "react";
import { bn } from "@/lib/bn-digits";

function timeLeft(endsAt: string): { h: number; m: number; s: number } | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

// Ticks client-side from the admin-set deadline (Settings → Flash Sale) —
// never shows once it's passed, so a stale/unmaintained countdown doesn't
// linger at 00:00:00.
export function FlashCountdown({ endsAt }: { endsAt: string }) {
  // Starts null on both server and client — computing the real value during
  // SSR would bake in that instant's seconds, which almost never matches by
  // the time the client hydrates a moment later (a classic clock/countdown
  // hydration mismatch). Filling it in from useEffect, after mount, avoids
  // that entirely at the cost of one tick's delay before it first appears.
  const [left, setLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    setLeft(timeLeft(endsAt));
    const id = setInterval(() => setLeft(timeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!left) return null;

  return (
    <span className="num flex items-center gap-0.5 text-md font-semibold text-danger font-mono">
      <span className="rounded bg-danger px-2.5 py-0.5 text-white">{bn(pad(left.h))}</span>:
      <span className="rounded bg-danger px-2.5 py-0.5 text-white">{bn(pad(left.m))}</span>:
      <span className="rounded bg-danger px-2.5 py-0.5 text-white">{bn(pad(left.s))}</span>
    </span>
  );
}
