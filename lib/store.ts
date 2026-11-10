// export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

 const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://obm-central-commerce-hub-backend.onrender.com";



export const CHANNEL_SLUG = "relief-care-bd";

export const STORE_NAME = "Relief Care bd";

// Left blank on purpose — fill in before launch. The WhatsApp button hides
// itself rather than show a number that isn't real.
export const WHATSAPP_NUMBER = ""; // e.g. "8801XXXXXXXXX"

// Footer placeholders — generic, non-committal text until the real
// operating details are supplied; edit before launch.
export const STORE_HOURS = "সকাল ৯টা থেকে রাত ১০টা";
export const STORE_ADDRESS = "ঢাকা, বাংলাদেশ";

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

// Fixed platform palette — keep in sync with the backend's
// SOCIAL_LINK_PLATFORMS (social-link.dto.ts).
export type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok" | "whatsapp" | "website";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface ChannelConfig {
  name: string;
  logoUrl: string | null;
  heroCoupon: { label: string; code: string } | null;
  heroSlides: HeroSlide[];
  trustBadges: TrustBadge[];
  comboBanners: ComboBannerConfig[];
  customerCarePhone: string | null;
  socialLinks: SocialLink[];
  // The cart drawer's minimum-order nudge/gate (taka) — Settings → Other
  // Settings. null means no minimum, same as every other omitted-config
  // fallback on this page.
  minimumOrderAmount: number | null;
  // The cart drawer's stacked spend-more nudges (e.g. ৳1,300 → "ফ্রি
  // ডেলিভারি", ৳2,000 → "১০% ছাড়") — Settings → Other Settings. Shown lowest
  // amount first. `description` is just display text; `discountPercent` is
  // the one real part — the backend applies it (highest-amount qualifying
  // tier wins) when the order is actually created. Empty means nothing shows.
  spendingRewards: SpendingReward[];
  // The product page's buy-box quantity tiers (e.g. 2 → 5% off, 3 → 10%
  // off) — Settings → Other Settings. Shown lowest quantity first;
  // quantity 1 is always the free baseline tile and isn't listed here.
  // `discountPercent` is real — applied per line item when the order is
  // actually created. Empty means every buy-box only shows the single
  // quantity-1 tile.
  quantityDiscounts: QuantityDiscount[];
}

export interface SpendingReward {
  amount: number;
  description: string;
  discountPercent?: number;
}

export interface QuantityDiscount {
  quantity: number;
  discountPercent: number;
  description?: string;
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
  // The product's primary category — null when it was only tagged via the
  // admin's multi-category picker and never given a primary one. `categories`
  // (below) always has the full set either way, so callers that need a
  // category name to show should fall back to categories[0] rather than
  // treating `category: null` as "no category."
  category: { id: string; name: string } | null;
  categories: { id: string; name: string }[];
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
  // The actual pickable list, same gate as minPrice/maxPrice — each
  // variant's own id/price/compareAtPrice, for a real variant picker
  // (product page, combo builder) rather than just the summary range.
  variants?: ProductVariantOption[];
}

export interface ProductVariantOption {
  id: string;
  label: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  inStock: boolean;
  isDefault: boolean;
}

export interface FlashSaleConfig {
  enabled: boolean;
  endsAt: string | null;
  items: PublicProduct[];
}

export interface Review {
  customerName: string;
  location: string | null;
  rating: number;
  text: string;
  // null when not linked, or when the linked product is no longer
  // published/active on this channel.
  product: { name: string; slug: string } | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  slogan: string | null;
  productCount: number;
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

// Admin-curated via Settings → Review — empty means the section doesn't
// render (no sample testimonials are ever shipped).
export function getReviews(): Promise<Review[]> {
  return getJson<Review[]>("/reviews");
}

export interface HealthTip {
  title: string;
  // null when not linked, or when the linked category is no longer
  // published on this channel.
  category: string | null;
  readMinutes: number | null;
}

// Admin-curated via Settings → Health Tips — empty means the section
// doesn't render.
export function getHealthTips(): Promise<HealthTip[]> {
  return getJson<HealthTip[]>("/health-tips");
}

export async function placeOrder(payload: {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  notes?: string;
  items: { productId: string; variantId?: string; quantity: number }[];
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
