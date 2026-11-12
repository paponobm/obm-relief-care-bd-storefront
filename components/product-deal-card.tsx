import Link from "next/link";
import { ProductArt } from "./product-art";
import { MiniAddToCart } from "./mini-add-to-cart";
import { QuickViewTrigger } from "./quick-view-trigger";
import { formatTaka, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

// formatTaka + bn together: the same grouped "৳1,234" formatting the rest
// of the storefront uses, with Bengali numerals on top — kept local to this
// component rather than changing formatTaka itself, which every other price
// on the site still renders in Latin digits.
export function bnTaka(value: number): string {
  return bn(formatTaka(value));
}

// Matches the admin's Origin dropdown (Settings → product page →
// Specifications / Key Features → Origin) — same English names and order,
// so every option there has a flag here. An unlisted/custom-typed value
// just shows as plain text with no flag rather than breaking.
export const COUNTRY_FLAGS: Record<string, string> = {
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

export function importCountry(product: PublicProduct): string | null {
  // "Origin" is the only key the admin page writes now; "Country"/"দেশ"/
  // "আমদানি" are kept so older, pre-redesign data still shows.
  const spec = product.specifications?.find((s) => /origin|country|import|দেশ|আমদানি/i.test(s.key));
  return spec?.value.trim() || null;
}

// The Flash Deal card's design, reused wherever products are listed in this
// style (Flash Deal's own horizontal row, and the homepage's সকল পণ্য grid)
// — callers control sizing via their own wrapper (a fixed-width shrink-0
// box for a horizontal row, or a plain grid cell).
export function ProductDealCard({ product }: { product: PublicProduct }) {
  // Calculated straight from these two numbers, whichever is bigger — not
  // gated on it being a "real" discount (compareAtPrice > price). Whatever
  // the admin put in Regular Price and Sell Price, that's what shows here.
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const country = importCountry(product);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-card border border-line bg-surface">
      <QuickViewTrigger product={product} className="relative block aspect-square w-full bg-leaf-soft">
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
      </QuickViewTrigger>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <QuickViewTrigger product={product} className="line-clamp-2 text-left text-sm font-semibold leading-snug text-ink">
          {product.name}
        </QuickViewTrigger>
        {product.slogan && <p className="line-clamp-1 text-xs text-muted mb-3">{product.slogan}</p>}

        {product.hasVariants ? (
          <div className="num mt-auto flex items-baseline gap-1">
            <b className="font-display font-bold text-base text-lg text-amber-deep">
              {bnTaka(product.minPrice ?? product.price)}
              {product.maxPrice !== undefined && product.maxPrice !== product.minPrice
                ? `–${bnTaka(product.maxPrice)}`
                : ""}
            </b>
          </div>
        ) : (
          <div className="num mt-auto flex items-baseline gap-2">
            <b className="font-display font-bold text-base text-lg text-amber-deep">{bnTaka(product.price)}</b>
            {product.compareAtPrice ? <s className="font-sans text-xs text-muted">{bnTaka(product.compareAtPrice)}</s> : null}
          </div>
        )}

        {product.hasVariants ? (
          // Outlined, not filled — deliberately distinct from the solid
          // green add-to-cart button (MiniAddToCart) below, since picking a
          // variant isn't a one-tap add.
          <Link
            href={`/product/${product.slug}`}
            className="block w-full rounded-lg border border-amber bg-transparent py-1.5 text-center text-md font-semibold text-leaf"
          >
            {product.variantOptionLabel
              ? `${bn(product.variantCount ?? 0)}টি ${product.variantOptionLabel}`
              : "ভ্যারিয়েন্ট"}{" "}
            · বাছুন
          </Link>
        ) : (
          <MiniAddToCart product={product} />
        )}
      </div>
    </div>
  );
}
