"use client";

import { useState } from "react";
import Link from "next/link";
import { STORE_HOURS, WHATSAPP_NUMBER, type ChannelConfig, type PublicCategory, type SocialPlatform } from "@/lib/store";
import { bn } from "@/lib/bn-digits";

const PLATFORM_META: Record<SocialPlatform, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  youtube: { label: "YouTube", color: "#FF0000" },
  tiktok: { label: "TikTok", color: "#25F4EE" },
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  website: { label: "ওয়েবসাইট", color: "#1F7A3A" },
};

function QuickIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: bg }}>
      {children}
    </span>
  );
}

function MenuRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm font-semibold leading-tight text-ink">{title}</b>
        <small className="block text-xs text-muted">{subtitle}</small>
      </span>
      {href && <span className="text-muted">›</span>}
    </>
  );
  const rowClass = "flex w-full items-center gap-3 border-b border-line py-2.5 text-left last:border-b-0";
  if (!href) return <div className={`${rowClass} cursor-default`}>{inner}</div>;
  return (
    <Link href={href} onClick={onClick} className={rowClass}>
      {inner}
    </Link>
  );
}

function CategoryIcon({ category }: { category: PublicCategory }) {
  if (category.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded category image
    return <img src={category.imageUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />;
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-leaf-soft text-sm font-bold text-leaf">
      {category.name.charAt(0)}
    </span>
  );
}

export function SideMenu({
  open,
  onClose,
  channel,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  channel: ChannelConfig;
  categories: PublicCategory[];
}) {
  const [tab, setTab] = useState<"menu" | "categories">("menu");
  const [copied, setCopied] = useState(false);
  const combo = channel.comboBanners[0];

  async function copyPhone() {
    if (!channel.customerCarePhone) return;
    try {
      await navigator.clipboard.writeText(channel.customerCarePhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to fall back to here.
    }
  }

  return ( //font-bold block text-xl leading-none text-leaf-deep
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-label="মেনু"
        className={`fixed left-0 top-0 z-[80] flex h-full w-[min(340px,88%)] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2.5 bg-[#155C2B] px-3.5 py-3.5 text-white">
          {channel.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo
            <img src={channel.logoUrl} alt={channel.name} className="h-11 w-11 shrink-0 rounded-full bg-white object-contain p-0.5" />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-base font-bold text-leaf-deep">
              {channel.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <b className="font-display block text-lg leading-tight text-white">
              Relief Care <span className="text-[#FFC069]">bd</span>
            </b>
            {/* Static for now — real account/auth isn't built yet. */}
            <small className="block text-xs opacity-85">VIP কাস্টমার · VIP-0908-262</small>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-lg"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-line px-3.5">
          {([
            ["menu", "মেনু"],
            ["categories", "ক্যাটাগরি"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px flex-1 border-b-2 py-2.5 text-sm font-semibold ${
                tab === key ? "border-leaf text-leaf-deep" : "border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3.5">
          {tab === "menu" ? (
            <div className="flex flex-col gap-3">
              {combo && (
                <Link
                  href="/combo"
                  onClick={onClose}
                  className="flex flex-col gap-0.5 rounded-xl border border-amber bg-amber-soft px-3.5 py-3"
                >
                  <b className="font-display text-base text-amber-deep">{combo.title}</b>
                  <span className="num text-xs text-muted">{combo.description}</span>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/#flash-deal"
                  onClick={onClose}
                  className="flex flex-col items-start gap-2 rounded-xl border border-line bg-bg p-3 text-sm font-semibold text-ink"
                >
                  <QuickIcon bg="#D9442F">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                      <path d="M19 5 5 19" />
                      <circle cx="7" cy="7" r="2.2" />
                      <circle cx="17" cy="17" r="2.2" />
                    </svg>
                  </QuickIcon>
                  অফার পণ্য
                </Link>
                <Link
                  href="/track"
                  onClick={onClose}
                  className="flex flex-col items-start gap-2 rounded-xl border border-line bg-bg p-3 text-sm font-semibold text-ink"
                >
                  <QuickIcon bg="#F08A12">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.2" />
                    </svg>
                  </QuickIcon>
                  অর্ডার ট্র্যাকিং
                </Link>
                <Link
                  href="/quiz"
                  onClick={onClose}
                  className="flex flex-col items-start gap-2 rounded-xl border border-line bg-bg p-3 text-sm font-semibold text-ink"
                >
                  <QuickIcon bg="#1F7A3A">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
                    </svg>
                  </QuickIcon>
                  কোনটা নেবেন?
                </Link>
                <Link
                  href="/#customer-reviews"
                  onClick={onClose}
                  className="flex flex-col items-start gap-2 rounded-xl border border-line bg-bg p-3 text-sm font-semibold text-ink"
                >
                  <QuickIcon bg="#2F7FB8">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                    </svg>
                  </QuickIcon>
                  কাস্টমার রিভিউ
                </Link>
              </div>

              <h4 className="mt-1 text-xs font-semibold tracking-wide text-muted">তথ্য ও সহায়তা</h4>
              <div className="flex flex-col">
                <MenuRow
                  iconBg="var(--amber-soft)"
                  iconColor="var(--amber-deep)"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
                    </svg>
                  }
                  title="ফ্রি কল-পরামর্শ"
                  subtitle="প্রতিনিধি কল করে পণ্য বাছাই করে দেবেন"
                />
                <MenuRow
                  iconBg="var(--leaf-soft)"
                  iconColor="var(--leaf)"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
                      <path d="M8 7h6M8 11h6" />
                    </svg>
                  }
                  title="স্বাস্থ্য টিপস"
                  subtitle="সমস্যা বুঝে সঠিক যত্ন"
                  href="/#health-tips"
                  onClick={onClose}
                />
                <MenuRow
                  iconBg="var(--leaf-soft)"
                  iconColor="var(--leaf)"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  }
                  title="ডেলিভারি ও রিটার্ন নীতি"
                  subtitle="ভাঙা বা ভুল পণ্য বদলে দেই"
                  href="/policy"
                  onClick={onClose}
                />
              </div>

              {channel.customerCarePhone && (
                <div className="mt-1 flex flex-col gap-1 rounded-2xl bg-leaf-soft p-3.5">
                  <small className="text-xs text-muted">কাস্টমার কেয়ার</small>
                  <b className="num font-display text-2xl text-leaf-deep">{channel.customerCarePhone}</b>
                  <small className="text-xs text-muted">প্রতিদিন {STORE_HOURS}</small>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {WHATSAPP_NUMBER && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-leaf py-2 text-center text-sm font-semibold text-leaf-deep"
                      >
                        হোয়াটসঅ্যাপ
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={copyPhone}
                      className="rounded-lg border border-leaf py-2 text-center text-sm font-semibold text-leaf-deep"
                    >
                      {copied ? "কপি হয়েছে" : "নম্বর কপি"}
                    </button>
                  </div>
                </div>
              )}

              {channel.socialLinks.length > 0 && (
                <>
                  <h4 className="mt-1 text-xs font-semibold tracking-wide text-muted">আমাদের ফলো করুন</h4>
                  <div className="flex flex-wrap gap-2">
                    {channel.socialLinks.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_META[s.platform].color }} />
                        {PLATFORM_META[s.platform].label}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {categories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">এখনো কোনো ক্যাটাগরি যোগ করা হয়নি।</p>
              ) : (
                categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                  >
                    <CategoryIcon category={c} />
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm font-semibold leading-tight text-ink">{c.name}</b>
                      {c.slogan && <small className="block truncate text-xs text-muted">{c.slogan}</small>}
                    </span>
                    <span className="num rounded-full bg-bg px-2.5 py-0.5 text-xs text-muted">{bn(c.productCount)}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
