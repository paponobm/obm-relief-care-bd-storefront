"use client";

import { useEffect, useState } from "react";
import { CouponPill } from "./coupon-pill";
import type { HeroSlide } from "@/lib/store";

// Every hero title — the default one and any slide's own — gets the same
// treatment: its last two words in amber, everything before that in white.
function TitleText({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return <span className="text-amber">{text}</span>;
  const rest = words.slice(0, -2).join(" ");
  const highlight = words.slice(-2).join(" ");
  return (
    <>
      {rest} <span className="text-amber">{highlight}</span>
    </>
  );
}

export function HeroBanner({
  defaultTitle,
  defaultDescription,
  defaultCoupon,
  slides,
}: {
  defaultTitle: string;
  defaultDescription: string;
  defaultCoupon: { label: string; code: string } | null;
  slides: HeroSlide[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Each slide can override title/description/coupon independently — any
  // field it leaves unset falls back to the storefront's default.
  const active = slides[index] as HeroSlide | undefined;
  const title = active?.title || defaultTitle;
  const description = active?.description || defaultDescription;
  const coupon = active ? (active.coupon ?? defaultCoupon) : defaultCoupon;

  return (
    <section className="relative flex h-[260px] flex-col justify-center overflow-hidden rounded-card bg-[var(--hero-bg)] p-7 text-white sm:h-[320px] lg:h-[320px] lg:p-9">
      {slides.length > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded slideshow image
              <img key={s.image + i} src={s.image} alt="" className="h-full w-full shrink-0 object-cover" />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/35" />
        </div>
      )}

      <span
        aria-hidden
        className="pointer-events-none absolute -right-[60px] -top-[60px] z-[5] h-60 w-60 rounded-full border-[28px] border-[color-mix(in_srgb,var(--amber)_55%,transparent)]"
        style={{ borderLeftColor: "transparent", borderBottomColor: "transparent" }}
      />

      <h1 className="font-display relative z-10 max-w-[16ch] font-bold text-2xl leading-tight sm:text-4xl">
        <TitleText text={title} />
      </h1>
      <p className="relative z-10 mt-2 max-w-[44ch] opacity-90">{description}</p>
      {coupon && (
        <div className="relative z-10 mt-4">
          <CouponPill label={coupon.label} code={coupon.code} />
        </div>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.image + i}
              type="button"
              aria-label={`স্লাইড ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
