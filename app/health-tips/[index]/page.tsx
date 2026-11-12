import { notFound } from "next/navigation";
import { getHealthTips, getProducts } from "@/lib/store";
import { CATEGORY_HUE } from "@/lib/product-art";
import { ProductDealCard } from "@/components/product-deal-card";
import { bn } from "@/lib/bn-digits";

export const dynamic = "force-dynamic";

const DEFAULT_HUE = "#1F7A3A";

// Addressed by array index, same convention as the quiz's problems/subs —
// there's no separate slug field on these admin-curated tips.
export default async function HealthTipPage({ params }: { params: { index: string } }) {
  const tips = await getHealthTips().catch(() => []);
  const tip = tips[Number(params.index)];
  if (!tip) notFound();

  const hue = (tip.category && CATEGORY_HUE[tip.category]) || DEFAULT_HUE;

  // Specific, admin-picked products (Settings → Health Tips → Suggested
  // products) win when set; otherwise fall back to real products from the
  // tip's own category, same "এই সমস্যায় কাজে লাগবে" cross-sell this
  // storefront already does elsewhere (Flash Deal's own row) — never shown
  // when neither is set, rather than fabricating a generic/unrelated list.
  const related =
    tip.items.length > 0
      ? tip.items
      : tip.categoryId
        ? await getProducts({ categoryId: tip.categoryId, limit: 8 }).then((r) => r.items)
        : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-surface p-6 sm:p-8">
        {tip.category && (
          <span
            className="mb-3 inline-block w-fit rounded-md px-2.5 py-1 text-sm font-semibold"
            style={{ backgroundColor: `${hue}22`, color: hue }}
          >
            {tip.category}
          </span>
        )}
        <h1 className="font-display text-2xl leading-snug sm:text-3xl">{tip.title}</h1>
        {tip.description && <p className="mt-3 text-muted">{tip.description}</p>}

        {tip.points.length > 0 && (
          <ol className="mt-5 flex flex-col gap-3">
            {tip.points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-soft text-sm font-bold text-leaf-deep">
                  {bn(i + 1)}
                </span>
                <span className="pt-0.5 text-ink">{point}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-5 rounded-lg bg-amber-soft p-3 text-xs text-ink">
          এই লেখা সাধারণ তথ্যের জন্য, চিকিৎসকের পরামর্শের বিকল্প নয়।
        </p>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-2xl">
            এই সমস্যায় <span className="text-leaf">কাজে লাগবে</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {related.map((p) => (
              <div key={p.productId} className="w-[168px] shrink-0 sm:w-[200px]">
                <ProductDealCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
