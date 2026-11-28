import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BundleWith } from "@/components/bundle-with";
import { ProductDetailGrid } from "@/components/product-detail-grid";
import { Reviews } from "@/components/reviews";
import { TrackView } from "@/components/track-view";
import { getChannelConfig, getProduct, getProducts, getReviews } from "@/lib/store";
import { importCountry } from "@/components/product-deal-card";
import { COMPLEMENT } from "@/lib/quiz-data";
import { absoluteUrl, stripHtml } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug).catch(() => null);
  if (!product) return {};

  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription || (product.description ? stripHtml(product.description) : undefined);
  const url = absoluteUrl(`/product/${product.slug}`);
  const image = product.thumbnailUrl ?? undefined;

  return {
    title,
    description,
    keywords: product.focusKeywords?.length ? product.focusKeywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

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
  // Same request the root layout already makes for the footer/side menu/
  // floating widget — Next.js dedupes identical fetches within one render,
  // so this doesn't cost a second network round trip.
  const channel = await getChannelConfig().catch(() => null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ? stripHtml(product.description, 500) : undefined,
    image: product.images.length ? product.images : product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    url: absoluteUrl(`/product/${product.slug}`),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView slug={product.slug} productId={product.productId} />
      <ProductDetailGrid
        product={product}
        category={category}
        origin={origin}
        discount={discount}
        customerCarePhone={channel?.customerCarePhone ?? null}
      />

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
