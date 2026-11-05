import { productArtSvg } from "@/lib/product-art";

export function ProductArt({
  name,
  categoryName,
  thumbnailUrl,
  className,
}: {
  name: string;
  categoryName: string | null;
  thumbnailUrl?: string | null;
  className?: string;
}) {
  if (thumbnailUrl) {
    // absolute inset-0, not h-full/w-full alone: a plain `height: 100%` on
    // an <img> doesn't reliably resolve against a parent sized by
    // `aspect-square`/`aspect-ratio` — the browser falls back to the
    // image's own intrinsic ratio instead, so a non-square photo (e.g.
    // 900×1200) stretched the card taller than its square siblings.
    // Absolute positioning against the (relative) parent's box doesn't
    // have that problem. Callers without a relative/aspect-ratio parent
    // (checkout, quiz — fixed h-12 w-12 boxes) pass their own className.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnailUrl} alt={name} className={className ?? "absolute inset-0 h-full w-full object-cover"} />;
  }
  return (
    <div
      className={className ?? "h-full w-full"}
      dangerouslySetInnerHTML={{ __html: productArtSvg(name, categoryName) }}
    />
  );
}
