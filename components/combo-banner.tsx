import Link from "next/link";
import type { ComboBannerConfig } from "@/lib/store";

// Matches the original design's .cb-banner / .cb-b-txt / .cb-b-tiers /
// .cb-b-go (colors, radii) — content is fully admin-controlled (Settings →
// Home Page Combo), no hardcoded fallback: unset means it doesn't render.
// The combo builder itself isn't built yet, so this links to a "coming
// soon" page rather than faking the interactive flow.
function ComboBannerCard({ config }: { config: ComboBannerConfig }) {
  return (
    <Link
      href="/combo"
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-[20px] border-[1.5px] border-amber bg-amber-soft p-[18px] text-left text-ink"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[60px] -right-10 h-[170px] w-[170px] rounded-full border-[22px] border-amber opacity-[0.18]"
      />

      <span className="relative flex flex-col gap-0.5">
        {config.newBadge && (
          <span className="w-fit rounded-md bg-danger px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
            নতুন
          </span>
        )}
        <b className="font-display text-2xl leading-[1.15] text-amber-deep">{config.title}</b>
        <span className="text-sm text-muted">{config.description}</span>
      </span>

      {config.tiers.length > 0 && (
        <span className="num relative grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-1.5">
          {config.tiers.map((tier, i) => (
            <span key={i} className="flex flex-col rounded-xl bg-surface p-2 text-xs leading-[1.3] text-muted">
              <b className="font-display text-base text-ink">{tier.title}</b>
              {/* Each admin-entered line (split on \n) renders as its own
                  line — a plain {tier.description} would collapse them. */}
              {tier.description.split("\n").map((line, li) => (
                <span key={li}>{line}</span>
              ))}
            </span>
          ))}
        </span>
      )}

      <span className="relative mt-auto rounded-xl bg-amber p-[11px] text-center font-bold text-white">
        কম্বো বানানো শুরু করুন →
      </span>
    </Link>
  );
}

// One combo (today) renders full-width exactly as before; two combos sit
// side by side from `sm:` up and stack on mobile — layout only changes once
// there's actually a second one to show.
export function ComboBanner({ configs }: { configs: ComboBannerConfig[] }) {
  if (configs.length === 0) return null;
  if (configs.length === 1) {
    return (
      <div className="mt-[22px]">
        <ComboBannerCard config={configs[0]} />
      </div>
    );
  }
  return (
    <div className="mt-[22px] grid grid-cols-1 gap-3 sm:grid-cols-2">
      {configs.map((config, i) => (
        <ComboBannerCard key={i} config={config} />
      ))}
    </div>
  );
}
