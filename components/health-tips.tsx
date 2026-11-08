import type { HealthTip } from "@/lib/store";
import { CATEGORY_HUE } from "@/lib/product-art";
import { bn } from "@/lib/bn-digits";

const DEFAULT_HUE = "#1F7A3A";

function HealthTipCard({ tip }: { tip: HealthTip }) {
  const hue = (tip.category && CATEGORY_HUE[tip.category]) || DEFAULT_HUE;

  return (
    <div className="flex w-[220px] shrink-0 flex-col gap-2 overflow-hidden rounded-card border border-line bg-surface">
      <span className="block h-1" style={{ backgroundColor: hue }} />
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
        {tip.category && (
          <span
            className="w-fit rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: `${hue}22`, color: hue }}
          >
            {tip.category}
          </span>
        )}
        <b className="font-display line-clamp-3 flex-1 text-base leading-snug text-ink">{tip.title}</b>
        {tip.readMinutes !== null && (
          <span className="text-xs text-muted">{bn(tip.readMinutes)} মিনিটে পড়ুন</span>
        )}
      </div>
    </div>
  );
}

// "স্বাস্থ্য টিপস" — admin-entered article teasers (Settings → Health
// Tips). Empty means the section doesn't render — same honesty rule as
// Reviews/FlashDeal (no article page exists yet, just the teaser card).
export function HealthTips({ tips }: { tips: HealthTip[] }) {
  if (tips.length === 0) return null;

  return (
    <section id="health-tips" className="mt-5">
      <h2 className="mb-3 font-bold text-2xl">
        স্বাস্থ্য <span className="text-amber">টিপস</span>
      </h2>
      <div className=" flex gap-3 overflow-x-auto pb-3">
        {tips.map((t, i) => (
          <HealthTipCard key={i} tip={t} />
        ))}
      </div>
    </section>
  );
}
