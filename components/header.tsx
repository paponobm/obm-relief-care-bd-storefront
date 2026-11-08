"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { ChannelConfig, PublicCategory } from "@/lib/store";
import { ThemeToggle } from "./theme-toggle";
import { SideMenu } from "./side-menu";

export function Header({ channel, categories }: { channel: ChannelConfig; categories: PublicCategory[] }) {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/products?search=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <header className="sticky mt-2 top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 xl:px-8">
        <div className="flex shrink-0 items-center gap-3 lg:flex-1">
          <button
            type="button"
            aria-label="মেনু"
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg text-ink"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <path d="M4 7h16M4 12h10M4 17h16" />
            </svg>
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {channel.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo
              <img src={channel.logoUrl} alt={channel.name} className="h-10 w-10 rounded-full  object-contain p-0.5" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf text-base font-bold text-white">
                {channel.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="leading-tight">
              <span className="font-bold block text-xl leading-none text-leaf-deep">
                Relief Care <span className="text-amber">bd</span>
              </span>
              <span className="hidden sm:block mt-1 block text-xs tracking-wide text-muted">আরামের বিশ্বস্ত ঠিকানা</span>
            </span>
          </Link>
        </div>

        <form onSubmit={onSearch} className="order-3 min-w-0 basis-full lg:order-none lg:basis-auto lg:w-full lg:max-w-md">
          <div className="relative">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="পণ্য বা সমস্যা লিখে খুঁজুন (যেমন: দাদ, ব্যথা)"
              className="w-full rounded-full border border-line bg-bg py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-leaf"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:flex-1 lg:justify-end">
          <ThemeToggle />
          <Link
            href="/checkout"
            className="flex items-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-semibold text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            কার্ট
            {count > 0 && (
              <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-leaf-deep px-1.5 text-xs font-bold text-[var(--cta-text)]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {/* <nav className="scrollbar-none mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-2.5 text-sm xl:px-8">
        <Link href="/" className="shrink-0 rounded-full border border-line px-3 py-1 font-medium text-ink">
          হোম
        </Link>
        <Link href="/products" className="shrink-0 rounded-full border border-line px-3 py-1 font-medium text-ink">
          সব পণ্য
        </Link>
        <Link href="/quiz" className="shrink-0 rounded-full border border-leaf bg-leaf-soft px-3 py-1 font-medium text-leaf-deep">
          কোনটা নেবেন? কুইজ
        </Link>
        <Link href="/track" className="shrink-0 rounded-full border border-line px-3 py-1 font-medium text-ink">
          অর্ডার ট্র্যাকিং
        </Link>
      </nav> */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} channel={channel} categories={categories} />
    </header>
  );
}
