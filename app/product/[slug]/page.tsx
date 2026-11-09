import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { TrackView } from "@/components/track-view";
import { formatTaka, getProduct, getProducts } from "@/lib/store";
import { COMPLEMENT } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug).catch(() => null);
  if (!product) notFound();

  const relatedSlugs = (product.category && COMPLEMENT[product.category.name]) || [];
  const related = relatedSlugs.length
    ? await getProducts({ limit: 50 }).then((r) =>
        r.items.filter((p) => relatedSlugs.includes(p.slug) && p.slug !== product.slug).slice(0, 4),
      )
    : [];

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <TrackView slug={product.slug} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-card bg-leaf-soft">
          <ProductArt name={product.name} categoryName={product.category?.name ?? null} thumbnailUrl={product.thumbnailUrl} />
        </div>
        <div className="flex flex-col gap-3">
          {product.category && (
            <span className="w-fit rounded-md bg-leaf-soft px-2 py-0.5 text-xs font-semibold text-leaf-deep">
              {product.category.name}
            </span>
          )}
          <h1 className="font-display text-2xl leading-tight">{product.name}</h1>
          {/* A variant product's real price depends on which variant is
              picked, so AddToCart (below) owns that display reactively —
              this static block would just show a meaningless base price. */}
          {!product.hasVariants && (
            <div className="num flex items-baseline gap-2">
              <b className="font-display text-2xl text-amber-deep">{formatTaka(product.price)}</b>
              {product.compareAtPrice ? (
                <>
                  <s className="text-sm text-muted">{formatTaka(product.compareAtPrice)}</s>
                  {discount > 0 && (
                    <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                      {discount}% ছাড়
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}
          {product.description && (
            <div
              className="rich-content text-sm text-muted"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
          <AddToCart product={product} />
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
            <li>১০০% আসল, সিল করা প্যাকেট</li>
            <li>ক্যাশ অন ডেলিভারি</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg">এর সাথে মানানসই</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
