import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { Header } from "@/components/header";
import { WhatsappWidget } from "@/components/whatsapp-widget";
import { STORE_NAME } from "@/lib/store";

export const metadata: Metadata = {
  title: STORE_NAME,
  description: `Shop at ${STORE_NAME} — ব্যথা, চুলকানি, সর্দি থেকে দ্রুত আরামের আসল পণ্য`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-6 xl:px-8">{children}</main>
            <WhatsappWidget />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
