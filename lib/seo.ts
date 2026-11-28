// The public domain this storefront is actually deployed at — needed to
// build absolute URLs for metadataBase/canonical/sitemap/robots. Set
// NEXT_PUBLIC_SITE_URL before launch; falls back to the local dev port so
// nothing crashes while that isn't configured yet.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// Product descriptions are admin-authored rich HTML — strip tags/entities
// down to plain text for <meta description>, OG description, and JSON-LD,
// none of which should ever contain markup.
export function stripHtml(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}
