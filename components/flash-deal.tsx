import Link from "next/link";
import { ProductArt } from "./product-art";
import { MiniAddToCart } from "./mini-add-to-cart";
import { FlashCountdown } from "./flash-countdown";
import { formatTaka, type FlashSaleConfig, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

// formatTaka + bn together: the same grouped "৳1,234" formatting the rest
// of the storefront uses, with Bengali numerals on top — kept local to this
// component rather than changing formatTaka itself, which every other price
// on the site still renders in Latin digits.
function bnTaka(value: number): string {
  return bn(formatTaka(value));
}

// Matches the admin's Origin dropdown (Settings → product page →
// Specifications / Key Features → Origin) — same English names and order,
// so every option there has a flag here. An unlisted/custom-typed value
// just shows as plain text with no flag rather than breaking.
const COUNTRY_FLAGS: Record<string, string> = {
  Bangladesh: "🇧🇩",
  India: "🇮🇳",
  Thailand: "🇹🇭",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  Malaysia: "🇲🇾",
  USA: "🇺🇸",
  UK: "🇬🇧",
  Germany: "🇩🇪",
  Japan: "🇯🇵",
  Pakistan: "🇵🇰",
  "Sri Lanka": "🇱🇰",
};

function importCountry(product: PublicProduct): string | null {
  // "Origin" is the only key the admin page writes now; "Country"/"দেশ"/
  // "আমদানি" are kept so older, pre-redesign data still shows.
  const spec = product.specifications?.find((s) => /origin|country|import|দেশ|আমদানি/i.test(s.key));
  return spec?.value.trim() || null;
}

function FlashDealCard({ product }: { product: PublicProduct }) {
  // Calculated straight from these two numbers, whichever is bigger — not
  // gated on it being a "real" discount (compareAtPrice > price). Whatever
  // the admin put in Regular Price and Sell Price, that's what shows here.
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const country = importCountry(product);

  return (
    <div className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-card border border-line bg-surface sm:w-[200px]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square w-full bg-leaf-soft">
        {discount !== 0 && (
          <span className="num absolute left-2 top-2 z-10 rounded-md bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
            -{bn(Math.abs(discount))}%
          </span>
        )}
        {country && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-amber px-1.5 py-0.5 text-xs font-semibold text-white">
            {COUNTRY_FLAGS[country] ? `${COUNTRY_FLAGS[country]} ` : ""}
            {country}
          </span>
        )}
        <ProductArt name={product.name} categoryName={product.category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {product.name}
        </Link>
        {product.slogan && <p className="line-clamp-1 text-xs text-muted mb-3">{product.slogan}</p>}

        {product.hasVariants ? (
          <div className="num mt-auto flex items-baseline gap-1">
            <b className="font-display font-bold text-base text-lg text-orange-600">
              {bnTaka(product.minPrice ?? product.price)}
              {product.maxPrice !== undefined && product.maxPrice !== product.minPrice
                ? `–${bnTaka(product.maxPrice)}`
                : ""}
            </b>
          </div>
        ) : (
          <div className="num mt-auto flex items-baseline gap-2">
            <b className="font-display font-bold text-base text-lg text-orange-600">{bnTaka(product.price)}</b>
            {product.compareAtPrice ? <s className="text-xs text-muted">{bnTaka(product.compareAtPrice)}</s> : null}
          </div>
        )}

        {product.hasVariants ? (
          <Link
            href={`/product/${product.slug}`}
            className="block w-full rounded-lg bg-leaf py-2 text-center text-xs font-semibold text-white"
          >
            বাছুন
          </Link>
        ) : (
          <MiniAddToCart product={product} />
        )}
      </div>
    </div>
  );
}

// The homepage's horizontally-scrolling deal strip — admin-curated product
// selection + order + optional countdown (Settings → Flash Sale). Disabled
// or empty just renders nothing, same honesty rule as ComboBanner/TrustStrip.
export function FlashDeal({ config }: { config: FlashSaleConfig }) {
  if (!config.enabled || config.items.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="relative mb-3 flex items-baseline">
        <h2 className="font-display font-bold  text-2xl">
          ফ্ল্যাশ <span className="text-danger">ডিল</span>
        </h2>
        {config.endsAt && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FlashCountdown endsAt={config.endsAt} />
          </div>
        )}
        <Link href="/products" className="ml-auto font-semibold text-leaf">
          সব অফার দেখুন →
        </Link>
      </div>
      <div className="scrollbar-visible flex gap-3 overflow-x-auto pb-3">
        {config.items.map((p) => (
          <FlashDealCard key={p.productId} product={p} />
        ))}
      </div>
    </section>
  );
}
