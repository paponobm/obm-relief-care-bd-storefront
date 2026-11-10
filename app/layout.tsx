import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsappWidget } from "@/components/whatsapp-widget";
import { getCategories, getChannelConfig, STORE_NAME } from "@/lib/store";

export const metadata: Metadata = {
  title: STORE_NAME,
  description: `Shop at ${STORE_NAME} — ব্যথা, চুলকানি, সর্দি থেকে দ্রুত আরামের আসল পণ্য`,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Falls back to the hardcoded name + no logo if the API is briefly
  // unreachable — a layout-level fetch failure would otherwise take down
  // every page, not just one route.
  const channel = await getChannelConfig().catch(() => ({
    name: STORE_NAME,
    logoUrl: null,
    heroCoupon: null,
    heroSlides: [],
    trustBadges: [],
    comboBanners: [],
    customerCarePhone: null,
    socialLinks: [],
    minimumOrderAmount: null,
    spendingRewards: [],
    quantityDiscounts: [],
  }));
  const categories = await getCategories().catch(() => []);

  return (
    <html lang="bn">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ThemeProvider>
          <CartProvider quantityDiscounts={channel.quantityDiscounts}>
            <Header channel={channel} categories={categories} />
            <main className="mx-auto max-w-7xl px-4 py-6 xl:px-8">{children}</main>
            <Footer />
            <WhatsappWidget />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
