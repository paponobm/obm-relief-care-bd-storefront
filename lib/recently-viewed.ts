const KEY = "relief-care-recently-viewed";
const MAX_STORED = 20;

function readSlugs(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// Per-viewer only — lives in this browser's localStorage, never sent
// anywhere. Most-recent-first, de-duped.
export function addRecentlyViewed(slug: string): void {
  try {
    const next = [slug, ...readSlugs().filter((s) => s !== slug)].slice(0, MAX_STORED);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private window / blocked storage — recently-viewed just won't persist.
  }
}

export function getRecentlyViewedSlugs(limit: number): string[] {
  return readSlugs().slice(0, limit);
}
