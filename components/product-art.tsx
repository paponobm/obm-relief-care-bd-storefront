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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnailUrl} alt={name} className={className ?? "h-full w-full object-cover"} />;
  }
  return (
    <div
      className={className ?? "h-full w-full"}
      dangerouslySetInnerHTML={{ __html: productArtSvg(name, categoryName) }}
    />
  );
}
