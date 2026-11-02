export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
export const CHANNEL_SLUG = "relief-care-bd";

export const STORE_NAME = "Relief Care bd";

// Left blank on purpose — fill in before launch. The WhatsApp button hides
// itself rather than show a number that isn't real.
export const WHATSAPP_NUMBER = ""; // e.g. "8801XXXXXXXXX"
export const SOCIAL_LINKS: { name: string; url: string }[] = [];

export interface ChannelConfig {
  name: string;
  logoUrl: string | null;
  heroCoupon: { label: string; code: string } | null;
}

export async function getChannelConfig(): Promise<ChannelConfig> {
  const res = await fetch(`${API_URL}/store/${CHANNEL_SLUG}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<ChannelConfig>;
}

export interface PublicProduct {
  productId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  isFeatured: boolean;
  thumbnailUrl: string | null;
  images: string[];
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  inStock: boolean;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface ProductPage {
  items: PublicProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/store/${CHANNEL_SLUG}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

// The backend's category list is global (not scoped per channel), so it can
// include other storefronts' categories too. RELIEF_CATEGORY_SLUGS below is
// this storefront's own known set — see getCategories().
export const RELIEF_CATEGORY_SLUGS = [
  "solution-kits",
  "pain-relief",
  "skin-care",
  "cold-flu",
  "oral-care",
  "hair-care",
  "foot-care",
  "baby-mother-care",
  "herbal-wellness",
  "combo-offers",
] as const;

export async function getCategories(): Promise<PublicCategory[]> {
  const all = await getJson<PublicCategory[]>("/categories");
  const known = new Set<string>(RELIEF_CATEGORY_SLUGS);
  return all.filter((c) => known.has(c.slug));
}

export function getProducts(
  params: {
    featured?: boolean;
    limit?: number;
    page?: number;
    categoryId?: string;
    search?: string;
  } = {},
) {
  const qs = new URLSearchParams();
  if (params.featured !== undefined) qs.set("featured", String(params.featured));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  return getJson<ProductPage>(`/products${suffix}`);
}

export function getProduct(slug: string) {
  return getJson<PublicProduct>(`/products/${slug}`);
}

export async function placeOrder(payload: {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}): Promise<CreatedOrder> {
  const res = await fetch(`${API_URL}/store/${CHANNEL_SLUG}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Order failed"));
  }
  return body as CreatedOrder;
}

// Saves an unfinished checkout so it shows as Incomplete in the admin.
// Failure is silent on purpose: the customer's order is not affected.
export async function saveCheckoutLead(payload: {
  customerPhone: string;
  customerName?: string;
  shippingAddress?: string;
  items: { productId: string; quantity: number }[];
}): Promise<void> {
  await fetch(`${API_URL}/store/${CHANNEL_SLUG}/checkout-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

export function formatTaka(value: number): string {
  return `৳${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}
