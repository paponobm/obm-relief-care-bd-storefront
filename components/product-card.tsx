import Link from "next/link";
import { ProductArt } from "./product-art";
import { formatTaka, type PublicProduct } from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { bnTaka, COUNTRY_FLAGS, importCountry } from "./product-deal-card";
import { MiniAddToCart } from "./mini-add-to-cart";

export function ProductCard({ product }: { product: PublicProduct }) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
const country = importCountry(product);
  return (
    // <Link
    //   href={`/product/${product.slug}`}
    //   className="flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-shadow hover:shadow-md"
    // >
    //   <div className="relative aspect-square w-full bg-leaf-soft">
    //     {discount > 0 && (
    //       <span className="absolute left-2 top-2 z-10 rounded-md bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
    //         -{discount}%
    //       </span>
    //     )}
    //     {product.isFeatured && (
    //       <span className="absolute right-2 top-2 z-10 rounded-md bg-amber px-1.5 py-0.5 text-xs font-semibold text-white">
    //         আমাদের পছন্দ
    //       </span>
    //     )}
    //     <ProductArt name={product.name} categoryName={product.category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
    //   </div>
    //   <div className="flex flex-1 flex-col gap-1.5 p-3">
    //     <p className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink">{product.name}</p>
    //     {!product.inStock && <p className="text-xs font-semibold text-danger">স্টকে নেই</p>}
    //     <div className="num mt-auto flex items-baseline gap-2">
    //       <b className="font-display text-lg text-amber-deep">{formatTaka(product.price)}</b>
    //       {product.compareAtPrice ? <s className="text-xs text-muted">{formatTaka(product.compareAtPrice)}</s> : null}
    //     </div>
    //   </div>
    // </Link>
    
    <div className="flex h-full w-full flex-col overflow-hidden rounded-card border border-line bg-surface">
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
            {product.compareAtPrice ? <s className="font-sans text-xs text-muted">{bnTaka(product.compareAtPrice)}</s> : null}
          </div>
        )}

        {product.hasVariants ? (
          // Outlined, not filled — deliberately distinct from the solid
          // green add-to-cart button (MiniAddToCart) below, since picking a
          // variant isn't a one-tap add.
          <Link
            href={`/product/${product.slug}`}
            className="block w-full rounded-lg border border-leaf bg-transparent py-1.5 text-center text-md font-semibold text-leaf"
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
