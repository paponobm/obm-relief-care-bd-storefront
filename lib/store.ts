// export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

 const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://obm-central-commerce-hub-backend.onrender.com";



export const CHANNEL_SLUG = "relief-care-bd";

export const STORE_NAME = "Relief Care bd";

// Left blank on purpose — fill in before launch. The WhatsApp button hides
// itself rather than show a number that isn't real.
export const WHATSAPP_NUMBER = ""; // e.g. "8801XXXXXXXXX"
export const SOCIAL_LINKS: { name: string; url: string }[] = [];

export interface HeroSlide {
  image: string;
  title?: string;
  description?: string;
  coupon?: { label: string; code: string } | null;
}

export interface TrustBadge {
  text: string;
  icon: string;
}

export interface ComboTier {
  title: string;
  description: string;
}

export interface ComboBannerConfig {
  newBadge: boolean;
  title: string;
  description: string;
  tiers: ComboTier[];
}

export interface ChannelConfig {
  name: string;
  logoUrl: string | null;
  heroCoupon: { label: string; code: string } | null;
  heroSlides: HeroSlide[];
  trustBadges: TrustBadge[];
  comboBanners: ComboBannerConfig[];
}

export async function getChannelConfig(): Promise<ChannelConfig> {
  const res = await fetch(`${API_URL}/store/${CHANNEL_SLUG}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<ChannelConfig>;
}

export interface ProductSpecification {
  key: string;
  value: string;
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
  slogan: string | null;
  specifications: ProductSpecification[] | null;
  hasVariants: boolean;
  // Only present when hasVariants — the Flash Deal card's "৳min–৳max" and
  // its "২টি সাইজ · বাছুন"-style button label. variantOptionLabel is the
  // attribute name (e.g. "সাইজ") when the product's variants were all
  // generated from a single Step 1 option; null means either no variants,
  // variants added without that generator, or more than one attribute
  // combined — the button falls back to a generic "ভ্যারিয়েন্ট" label then.
  minPrice?: number;
  maxPrice?: number;
  variantCount?: number;
  variantOptionLabel?: string | null;
}

export interface FlashSaleConfig {
  enabled: boolean;
  endsAt: string | null;
  items: PublicProduct[];
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
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

// The backend's category list is global (not scoped per channel), but this
// channel's own subset is curated server-side (Settings → Badge & Category →
// categorySlugs) and this endpoint already returns just that subset.
export function getCategories(): Promise<PublicCategory[]> {
  return getJson<PublicCategory[]>("/categories");
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

// Admin-curated via Settings → Flash Sale (which products, what order, and
// the countdown deadline) — disabled or empty just means an empty/no-op
// section, never an error.
export function getFlashSale(): Promise<FlashSaleConfig> {
  return getJson<FlashSaleConfig>("/flash-sale");
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
