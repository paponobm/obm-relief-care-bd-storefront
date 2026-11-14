"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Review } from "@/lib/store";

// A handful of distinct avatar colors, picked deterministically from the
// customer's name so the same person always gets the same color without
// storing one.
const AVATAR_COLORS = ["bg-leaf", "bg-amber", "bg-[#2F7FB8]", "bg-[#C2457A]", "bg-[#7A4FB5]"];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      data-review-card
      className="flex w-[260px] shrink-0 flex-col gap-2 rounded-card border-2 border-leaf bg-surface p-4 transition-transform duration-300 ease-out will-change-transform"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(review.customerName)}`}
        >
          {review.customerName.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate text-sm text-ink">{review.customerName}</b>
          {review.location && <span className="block truncate text-xs text-muted">{review.location}</span>}
        </span>
      </div>
      <span className="text-amber" aria-label={`${review.rating} out of 5 stars`}>
        {"★".repeat(review.rating)}
        <span className="text-line">{"★".repeat(5 - review.rating)}</span>
      </span>
      <p className="line-clamp-4 flex-1 text-sm text-muted">{review.text}</p>
      {review.product && (
        <Link href={`/product/${review.product.slug}`} className="text-xs font-semibold text-leaf-deep">
          {review.product.name} →
        </Link>
      )}
    </div>
  );
}

// "কাস্টমারদের অভিজ্ঞতা" — admin-entered testimonials (Settings → Review).
// Empty means the section doesn't render — same honesty rule as
// ComboBanner/FlashDeal (no fabricated sample reviews are ever shipped).
//
// The row auto-scrolls right-to-left on a loop (pausing while the visitor's
// pointer is over it, or while they're dragging it themselves — never
// fighting a manual scroll), and whichever card is nearest the row's own
// center is scaled up, shrinking back down as it drifts away from center —
// a coverflow-style "zoom in the middle" effect, continuous rather than a
// hard snap.
export function Reviews({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Reviews are duplicated once so the auto-scroll can loop seamlessly —
  // resetting scrollLeft back to 0 the instant the first copy scrolls fully
  // past, with an identical copy already sitting right there to continue
  // into, rather than a visible jump back to the start.
  const looped = reviews.length > 1 ? [...reviews, ...reviews] : reviews;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reviews.length <= 1) return;

    function applyCenterScale() {
      if (!track) return;
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      const cards = track.querySelectorAll<HTMLElement>("[data-review-card]");
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const distance = Math.abs(cardCenter - center);
        // 1 right at center, fading linearly down to 1 (no zoom) by the
        // time a card is 1.5 card-widths away — never scales down below
        // the resting size, only ever up, toward the middle.
        const falloff = Math.min(1, distance / (r.width * 1.5));
        const scale = 1 + 0.12 * (1 - falloff);
        card.style.transform = `scale(${scale})`;
      });
    }

    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyCenterScale);
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    applyCenterScale();

    // Slides from `from` to `from + delta` over SLIDE_MS, eased — slower and
    // more deliberate than the browser's own (very quick, fixed-speed)
    // scrollBy("smooth"), which is what made this feel abrupt before.
    const SLIDE_MS = 1400;
    function easeInOutQuad(t: number) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    let slideRaf = 0;
    function slideBy(delta: number) {
      if (!track) return;
      const from = track.scrollLeft;
      const start = performance.now();
      function tick(now: number) {
        if (!track) return;
        const t = Math.min(1, (now - start) / SLIDE_MS);
        track.scrollLeft = from + delta * easeInOutQuad(t);
        if (t < 1) slideRaf = requestAnimationFrame(tick);
      }
      slideRaf = requestAnimationFrame(tick);
    }

    // Auto-advance — one card at a time, every 5s, sliding slowly (not a
    // hard jump) so the newly-centered card eases up to its zoomed size as
    // it settles in — pausing under the pointer/touch or mid manual-drag so
    // it never tugs the row away from someone actively scrolling it
    // themselves.
    let stepsTaken = 0;
    const timer = window.setInterval(() => {
      if (!track || pausedRef.current) return;
      const cards = track.querySelectorAll<HTMLElement>("[data-review-card]");
      const first = cards[0];
      const second = cards[1];
      // The real per-card advance (card width + the row's own gap), read
      // from the live layout rather than assumed, so this still lines up
      // exactly regardless of screen size.
      const cardStep = first && second ? second.offsetLeft - first.offsetLeft : 0;
      if (!cardStep) return;
      stepsTaken += 1;
      slideBy(cardStep);
      // Once a full set has scrolled past, the duplicated second copy sits
      // in exactly the same positions the first one started in — so this
      // snaps back once the slide lands, invisibly, instead of ever
      // animating across the seam.
      if (stepsTaken >= reviews.length) {
        stepsTaken = 0;
        window.setTimeout(() => {
          if (track) track.scrollLeft -= track.scrollWidth / 2;
        }, SLIDE_MS + 50);
      }
    }, 5000);

    function pause() {
      pausedRef.current = true;
    }
    function resume() {
      pausedRef.current = false;
    }
    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume);

    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerenter", pause);
      track.removeEventListener("pointerleave", resume);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("pointerup", resume);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(slideRaf);
      window.clearInterval(timer);
    };
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <section id="customer-reviews" className="mt-5">
      <h2 className="mb-3 font-bold text-2xl">
        কাস্টমারদের <span className="text-amber">অভিজ্ঞতা</span>
      </h2>
      <div ref={trackRef} className="scrollbar-none flex gap-3 overflow-x-auto px-6 pb-3 pt-2">
        {looped.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </section>
  );
}
