"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/products?search=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 xl:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf text-sm font-bold text-white">RC</span>
          <span className="font-display text-lg leading-none text-leaf-deep">
            Relief Care <span className="text-amber">bd</span>
          </span>
        </Link>

        <form onSubmit={onSearch} className="order-3 min-w-0 flex-1 basis-full sm:order-none sm:basis-auto lg:max-w-md">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="পণ্য বা সমস্যা লিখে খুঁজুন"
            className="w-full rounded-full border border-line bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-leaf"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href="/checkout"
            className="flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white"
          >
            কার্ট
            {count > 0 && (
              <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-leaf-deep px-1.5 text-xs">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="scrollbar-none mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-2.5 text-sm xl:px-8">
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
      </nav>
    </header>
  );
}
