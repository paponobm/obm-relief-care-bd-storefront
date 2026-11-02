import Link from "next/link";
import { ProductArt } from "./product-art";
import { formatTaka, type PublicProduct } from "@/lib/store";

export function ProductCard({ product }: { product: PublicProduct }) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-leaf-soft">
        {discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-amber px-1.5 py-0.5 text-xs font-semibold text-white">
            আমাদের পছন্দ
          </span>
        )}
        <ProductArt name={product.name} categoryName={product.category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink">{product.name}</p>
        {!product.inStock && <p className="text-xs font-semibold text-danger">স্টকে নেই</p>}
        <div className="num mt-auto flex items-baseline gap-2">
          <b className="font-display text-lg text-amber-deep">{formatTaka(product.price)}</b>
          {product.compareAtPrice ? <s className="text-xs text-muted">{formatTaka(product.compareAtPrice)}</s> : null}
        </div>
      </div>
    </Link>
  );
}
