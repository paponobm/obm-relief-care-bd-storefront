"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductArt } from "./product-art";
import { bnTaka, COUNTRY_FLAGS, importCountry } from "./product-deal-card";
import { useCart } from "@/lib/cart";
import { bn, bnToNumber } from "@/lib/bn-digits";
import type { ComboTier, PublicCategory, PublicProduct } from "@/lib/store";

const PERSONAS = ["নিজের জন্য", "পরিবারের জন্য", "বাবা-মায়ের জন্য", "শিশুর জন্য"];
// Combo/kit bundles aren't buildable from inside the builder — picking a
// combo to put in a combo doesn't make sense, same exclusion the reference
// design makes.
const EXCLUDED_CATEGORY_SLUGS = ["combo-offers", "solution-kits"];

const STORAGE_KEY = "relief-care-combo";
const FOR_KEY = "relief-care-combo-for";

interface ComboLine {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
}

// A product with variants is flattened into one pickable row per variant
// (its own id/label/price) instead of a single "বাছুন" redirect — each row
// is directly addable, same as a simple product.
interface GridEntry {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  slug: string;
  name: string;
  slogan: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  origin: string | null;
}

function sameLine(a: { productId: string; variantId?: string }, b: { productId: string; variantId?: string }): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}

function readCombo(): ComboLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ComboBuilder({
  tiers,
  categories,
  products,
}: {
  tiers: ComboTier[];
  categories: PublicCategory[];
  products: PublicProduct[];
}) {
  const cart = useCart();
  const router = useRouter();
  const [combo, setCombo] = useState<ComboLine[]>([]);
  const [comboFor, setComboFor] = useState(PERSONAS[1]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Own, separate selection (not the live cart) — this is how the reference
  // keeps "what's in the combo so far" distinct from whatever else is
  // already sitting in the cart, so the progress bar below only counts
  // what's actually meant for this combo.
  useEffect(() => {
    setCombo(readCombo());
    try {
      const savedFor = localStorage.getItem(FOR_KEY);
      if (savedFor && PERSONAS.includes(savedFor)) setComboFor(savedFor);
    } catch {
      // ignore
    }
  }, []);

  // Persisted directly inside each mutator (same reasoning as lib/cart.tsx)
  // rather than via a `useEffect([combo])` watcher — that pattern races the
  // load effect above on mount, briefly overwriting a saved combo with "[]"
  // before the load's setCombo has flushed.
  function persistCombo(next: ComboLine[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — combo still works for this page view
    }
  }
  function updateComboFor(next: string) {
    setComboFor(next);
    try {
      localStorage.setItem(FOR_KEY, next);
    } catch {
      // ignore
    }
  }

  const excludedIds = useMemo(
    () => new Set(categories.filter((c) => EXCLUDED_CATEGORY_SLUGS.includes(c.slug)).map((c) => c.id)),
    [categories],
  );
  const pickableCategories = useMemo(() => categories.filter((c) => !excludedIds.has(c.id)), [categories, excludedIds]);
  const pickableProducts = useMemo(
    () => products.filter((p) => !p.category || !excludedIds.has(p.category.id)),
    [products, excludedIds],
  );
  const productById = useMemo(() => new Map(products.map((p) => [p.productId, p])), [products]);

  const gridEntries = useMemo<GridEntry[]>(
    () =>
      pickableProducts.flatMap((p) => {
        const origin = importCountry(p);
        const base = {
          productId: p.productId,
          slug: p.slug,
          name: p.name,
          slogan: p.slogan,
          categoryId: p.category?.id ?? null,
          categoryName: p.category?.name ?? null,
          origin,
        };
        if (p.hasVariants && p.variants && p.variants.length > 0) {
          return p.variants.map((v) => ({
            ...base,
            variantId: v.id,
            variantLabel: v.label ?? undefined,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            imageUrl: v.imageUrl ?? p.thumbnailUrl,
          }));
        }
        return [{ ...base, price: p.price, compareAtPrice: p.compareAtPrice, imageUrl: p.thumbnailUrl }];
      }),
    [pickableProducts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gridEntries.filter(
      (e) =>
        (!categoryId || e.categoryId === categoryId) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          (e.slogan ?? "").toLowerCase().includes(q) ||
          (e.categoryName ?? "").toLowerCase().includes(q)),
    );
  }, [gridEntries, categoryId, search]);

  function inc(e: GridEntry) {
    setCombo((prev) => {
      const existing = prev.find((x) => sameLine(x, e));
      const next = existing
        ? prev.map((x) => (sameLine(x, e) ? { ...x, quantity: x.quantity + 1 } : x))
        : [
            ...prev,
            {
              productId: e.productId,
              variantId: e.variantId,
              variantLabel: e.variantLabel,
              slug: e.slug,
              name: e.name,
              image: e.imageUrl,
              price: e.price,
              quantity: 1,
            },
          ];
      persistCombo(next);
      return next;
    });
  }
  function dec(productId: string, variantId?: string) {
    setCombo((prev) => {
      const next = prev.flatMap((x) =>
        sameLine(x, { productId, variantId }) ? (x.quantity <= 1 ? [] : [{ ...x, quantity: x.quantity - 1 }]) : [x],
      );
      persistCombo(next);
      return next;
    });
  }

  const subtotal = combo.reduce((a, x) => a + x.price * x.quantity, 0);
  const count = combo.reduce((a, x) => a + x.quantity, 0);

  const parsedTiers = useMemo(() => tiers.map((t) => ({ ...t, amount: bnToNumber(t.title) })), [tiers]);
  const maxAmount = parsedTiers.length ? parsedTiers[parsedTiers.length - 1].amount : 0;
  const currentTier = [...parsedTiers].reverse().find((t) => subtotal >= t.amount) ?? null;
  const nextTier = parsedTiers.find((t) => subtotal < t.amount) ?? null;

  // Items already sitting in the real cart (from browsing elsewhere) that
  // could count toward this combo — excludes other combos/kits, same rule
  // as the picker grid above.
  const movable = cart.items.filter((x) => {
    const p = productById.get(x.productId);
    return !p?.category || !excludedIds.has(p.category.id);
  });

  function moveFromCart() {
    setCombo((prev) => {
      const next = [...prev];
      for (const item of movable) {
        const idx = next.findIndex((x) => sameLine(x, item));
        if (idx >= 0) next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        else
          next.push({
            productId: item.productId,
            variantId: item.variantId,
            variantLabel: item.variantLabel,
            slug: item.slug,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
          });
      }
      persistCombo(next);
      return next;
    });
    movable.forEach((item) => cart.remove(item.productId, item.variantId));
  }

  function confirmCombo() {
    combo.forEach((item) =>
      cart.add(
        {
          productId: item.productId,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          slug: item.slug,
          name: item.name,
          image: item.image,
          price: item.price,
        },
        item.quantity,
      ),
    );
    setCombo([]);
    persistCombo([]);
    router.push("/checkout");
  }

  const progressMsg = !count
    ? "পণ্য যোগ করে কম্বো শুরু করুন"
    : nextTier
      ? `আর ${bnTaka(nextTier.amount - subtotal)} যোগ করলে ${nextTier.description.split("\n")[0]}`
      : currentTier
        ? `সর্বোচ্চ সুবিধা পাচ্ছেন: ${currentTier.description.split("\n")[0]}`
        : null;

  return (
    <div className={count > 0 ? "pb-28" : ""}>
      <div className="flex flex-col gap-5">
        <Link href="/" className="w-fit text-base font-semibold text-leaf">
          ← হোমে ফিরুন
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold text-bold">নিজের কম্বো বানান</h1>
          <p className="text-base text-muted">পরিবার বা নিজের জন্য যেকোনো পণ্য বেছে নিন। কম্বো যত বড়, সুবিধা তত বেশি।</p>
        </div>

        {parsedTiers.length > 0 && (
          <div className="num grid grid-cols-3 gap-2">
            {parsedTiers.map((t, i) => {
              const reached = subtotal >= t.amount;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-1 rounded-xl border p-3 ${reached ? "border-leaf bg-leaf-soft" : "border-line bg-surface"}`}
                >
                  <span className="text-sm text-muted">ধাপ {bn(i + 1)}</span>
                  <b className="font-display text-2xl text-ink">{bnTaka(t.amount)}+</b>
                  <ul className="flex flex-col text-sm text-muted">
                    {t.description.split("\n").map((line, li) => (
                      <li key={li}>{line}</li>
                    ))}
                  </ul>
                  {reached && <span className="text-sm font-semibold text-leaf-deep">✓ পাচ্ছেন</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm sm:text-base font-semibold text-ink">কম্বোটা কার জন্য?</span>
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => updateComboFor(f)}
                className={`rounded-full border px-3.5 py-1.5 text-sm sm:text-base font-medium ${
                  comboFor === f ? "border-leaf bg-leaf text-white" : "border-line text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {movable.length > 0 && (
          <button
            type="button"
            onClick={moveFromCart}
            className="num w-full rounded-xl border border-dashed border-leaf bg-leaf-soft py-2.5 text-base font-semibold text-leaf-deep"
          >
            কার্টে থাকা {bn(movable.length)}টি পণ্য কম্বোতে নিন →
          </button>
        )}

        <div className="flex flex-col gap-3">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কম্বোতে যোগ করতে পণ্য খুঁজুন"
              className="w-full rounded-full border border-line bg-bg py-2.5 pl-10 pr-4 text-base text-ink outline-none focus:border-leaf"
            />
          </div>
          <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm sm:text-base font-medium ${
                !categoryId ? "border-leaf bg-leaf text-white" : "border-line text-ink"
              }`}
            >
              সব
            </button>
            {pickableCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm sm:text-base font-medium ${
                  categoryId === c.id ? "border-leaf bg-leaf text-white" : "border-line text-ink"
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-card bg-surface p-8 text-center text-base text-muted">এই নামে পণ্য পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const line = combo.find((x) => sameLine(x, e));
              const key = `${e.productId}:${e.variantId ?? ""}`;
              return (
                <div key={key} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2">
                  <Link href={`/product/${e.slug}`} className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-leaf-soft">
                    <ProductArt name={e.name} categoryName={e.categoryName} thumbnailUrl={e.imageUrl} />
                  </Link>
                  <Link href={`/product/${e.slug}`} className="min-w-0 flex-1">
                    <b className="line-clamp-2 block text-base font-semibold leading-snug text-ink">{e.name}</b>
                    {e.variantLabel && (
                      <span className="mt-0.5 inline-block rounded-md bg-leaf-soft px-1.5 py-0.5 text-xs font-semibold text-leaf-deep">
                        {e.variantLabel}
                      </span>
                    )}
                    {(e.origin || e.slogan) && (
                      <small className="block truncate text-sm text-muted">
                        {e.origin && (
                          <>
                            {COUNTRY_FLAGS[e.origin] ? `${COUNTRY_FLAGS[e.origin]} ` : ""}
                            {e.origin}
                            {e.slogan ? " · " : ""}
                          </>
                        )}
                        {e.slogan}
                      </small>
                    )}
                    <span className="num mt-0.5 flex items-baseline gap-1.5">
                      <b className="text-base font-semibold text-amber-deep">{bnTaka(e.price)}</b>
                      {e.compareAtPrice && e.compareAtPrice > e.price && (
                        <s className="text-sm text-muted">{bnTaka(e.compareAtPrice)}</s>
                      )}
                    </span>
                  </Link>
                  {line ? (
                    <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-leaf">
                      <button
                        type="button"
                        onClick={() => dec(e.productId, e.variantId)}
                        className="h-9 w-9 bg-leaf-soft text-base font-bold text-leaf-deep"
                        aria-label="কমান"
                      >
                        −
                      </button>
                      <span className="num w-7 text-center text-base font-semibold font-sans">{bn(line.quantity)}</span>
                      <button
                        type="button"
                        onClick={() => inc(e)}
                        className="h-9 w-9 bg-leaf-soft text-base font-bold text-leaf-deep"
                        aria-label="বাড়ান"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inc(e)}
                      aria-label={`${e.name} কম্বোতে যোগ করুন`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-leaf text-xl font-bold text-leaf"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 xl:px-8">
            {maxAmount > 0 && (
              <div className="relative">
                <div className="relative h-1.5 rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-leaf to-amber"
                    style={{ width: `${Math.min(100, (subtotal / maxAmount) * 100)}%` }}
                  />
                  {parsedTiers.map((t, i) => (
                    <span
                      key={i}
                      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                        subtotal >= t.amount ? "border-leaf bg-leaf" : "border-line bg-surface"
                      }`}
                      style={{ left: `${Math.min(100, (t.amount / maxAmount) * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="num relative mt-1.5 h-4 text-sm text-muted">
                  {parsedTiers.map((t, i) => (
                    <span key={i} className="absolute -translate-x-1/2 font-sans" style={{ left: `${Math.min(100, (t.amount / maxAmount) * 100)}%` }}>
                      {bnTaka(t.amount)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="num min-w-0 flex-1">
                <b className="block text-base font-semibold text-ink font-sans">
                  {bn(count)}টি পণ্য · {bnTaka(subtotal)}
                </b>
                {progressMsg && <small className="block truncate text-sm text-muted font-sans">{progressMsg}</small>}
              </div>
              <button type="button" onClick={confirmCombo} className="shrink-0 rounded-xl bg-amber px-5 py-2.5 text-base font-bold text-white">
                কার্টে নিন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
