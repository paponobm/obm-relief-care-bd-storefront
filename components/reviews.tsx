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
    <div className="flex w-[260px] shrink-0 flex-col gap-2 rounded-card border border-line bg-surface p-4">
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
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="font-display mb-3 font-bold text-2xl">
        কাস্টমারদের <span className="text-amber">অভিজ্ঞতা</span>
      </h2>
      <div className="scrollbar-visible flex gap-3 overflow-x-auto pb-3">
        {reviews.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </section>
  );
}
