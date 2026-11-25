import { notFound } from "next/navigation";
import { BundleWith } from "@/components/bundle-with";
import { ProductDetailGrid } from "@/components/product-detail-grid";
import { Reviews } from "@/components/reviews";
import { TrackView } from "@/components/track-view";
import { getProduct, getProducts, getReviews } from "@/lib/store";
import { importCountry } from "@/components/product-deal-card";
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
      <ProductDetailGrid product={product} category={category} origin={origin} discount={discount} />

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
