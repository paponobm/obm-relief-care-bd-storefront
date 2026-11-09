import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { BundleWith } from "@/components/bundle-with";
import { ProductGallery } from "@/components/product-gallery";
import { Reviews } from "@/components/reviews";
import { TrackView } from "@/components/track-view";
import { getProduct, getProducts, getReviews } from "@/lib/store";
import { bn } from "@/lib/bn-digits";
import { bnTaka, COUNTRY_FLAGS, importCountry } from "@/components/product-deal-card";
import { COMPLEMENT } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug).catch(() => null);
  if (!product) notFound();

  // `category` is only the admin's "primary" pick and can be null even when
  // the product is tagged via the multi-category picker — `categories`
  // always has the full set, so this is the one name that's actually safe
  // to show/key off of.
  const category = product.category ?? product.categories?.[0] ?? null;

  const relatedSlugs = (category && COMPLEMENT[category.name]) || [];
  const related = relatedSlugs.length
    ? await getProducts({ limit: 50 }).then((r) =>
        r.items.filter((p) => relatedSlugs.includes(p.slug) && p.slug !== product.slug).slice(0, 3),
      )
    : [];

  const reviews = await getReviews()
    .then((all) => all.filter((r) => r.product?.slug === product.slug))
    .catch(() => []);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
  const origin = importCountry(product);

  return (
    <div className="flex flex-col gap-6">
      <TrackView slug={product.slug} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ProductGallery product={product} categoryName={category?.name ?? null} discount={discount} />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="w-fit rounded-md bg-leaf-soft px-2 py-0.5 text-sm font-semibold text-leaf-deep">
                {category.name}
              </span>
            )}
            {origin && (
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-amber-soft px-2 py-0.5 text-sm font-semibold text-amber-deep">
                {COUNTRY_FLAGS[origin] ? `${COUNTRY_FLAGS[origin]} ` : ""}
                {origin}-এ তৈরি
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl leading-tight">{product.name}</h1>
          {/* A variant product's real price depends on which variant is
              picked, so AddToCart (below) owns that display reactively —
              this static block would just show a meaningless base price. */}
          {!product.hasVariants && (
            <div className="num flex items-baseline gap-2">
              <b className="font-display text-2xl text-amber-deep">{bnTaka(product.price)}</b>
              {product.compareAtPrice ? (
                <>
                  <s className="text-sm text-muted">{bnTaka(product.compareAtPrice)}</s>
                  {discount > 0 && (
                    <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-deep">
                      {bn(discount)}% ছাড়
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}
          {product.slogan && <p className="text-base text-muted">{product.slogan}</p>}
          <AddToCart product={product} />
        </div>
      </div>

      <BundleWith product={product} related={related} />

      {product.description && (
        <div
          className="rich-content text-sm text-muted"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      )}

      <Reviews reviews={reviews} />
    </div>
  );
}
