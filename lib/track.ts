import { API_URL, CHANNEL_SLUG } from "./store";

// Deliberately simple, fire-and-forget event log — not an attempt at
// rebuilding Google Analytics (see the backend's AnalyticsEvent schema
// comment). Every call here is wrapped so a network hiccup or an ad
// blocker swallowing this request never affects the actual page.

const SESSION_KEY = "relief-care-analytics-session";
const UTM_KEY = "relief-care-analytics-utm";

// crypto.randomUUID() only exists in secure contexts (HTTPS, or localhost)
// — this storefront is also served over plain HTTP, where it's undefined,
// which previously threw here and silently killed every tracking call
// before fetch() ever ran (see send()'s own catch-all below).
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Anonymous, per-browser — never tied to a real Customer record. Lets
// "unique visitors" be counted as distinct ids, not just raw page views.
function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode) — a fresh id per call still lets
    // this page's own events through, just without cross-page dedup.
    return randomId();
  }
}

// Captured once, on whichever page a visitor actually lands on (an ad
// usually links straight to a product, not the homepage) — persisted for
// the rest of the visit so a later page view/add-to-cart still carries the
// same source, not an empty one once the visitor has clicked past the
// tagged landing page itself.
function getUtm(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    };
    if (fromUrl.utmSource) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const stored = sessionStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

interface TrackPayload {
  type: "PAGE_VIEW" | "PRODUCT_VIEW" | "SEARCH" | "ADD_TO_CART";
  path: string;
  productId?: string;
  searchQuery?: string;
}

function send(payload: TrackPayload) {
  try {
    fetch(`${API_URL}/store/${CHANNEL_SLUG}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
        referrer: document.referrer || undefined,
        ...getUtm(),
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Never let a tracking failure affect the actual page.
  }
}

export function trackPageView(path: string) {
  send({ type: "PAGE_VIEW", path });
}

export function trackProductView(path: string, productId: string) {
  send({ type: "PRODUCT_VIEW", path, productId });
}

export function trackSearch(path: string, query: string) {
  if (!query.trim()) return;
  send({ type: "SEARCH", path, searchQuery: query.trim() });
}

export function trackAddToCart(path: string, productId: string) {
  send({ type: "ADD_TO_CART", path, productId });
}
