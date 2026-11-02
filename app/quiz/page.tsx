"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatTaka, getProducts, type PublicProduct } from "@/lib/store";
import { QUIZ, KIT_MATCHES } from "@/lib/quiz-data";
import { ProductArt } from "@/components/product-art";

export default function QuizPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [step, setStep] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const { add } = useCart();
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  useEffect(() => {
    getProducts({ limit: 100 }).then((r) => setProducts(r.items));
  }, []);

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  function toggle(arr: string[], setArr: (v: string[]) => void, v: string) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  function addToCartFrom(p: PublicProduct) {
    add({ productId: p.productId, slug: p.slug, name: p.name, image: p.thumbnailUrl, price: p.price }, 1);
    setAddedSlug(p.slug);
  }

  const missingSubFor = problems.find((pk) => !subs.some((s) => s.startsWith(pk + ":")));

  const groups = subs.map((key) => {
    const [pk, sk] = key.split(":");
    const sub = QUIZ[pk].subs[sk];
    const items = sub.slugs.map((s) => bySlug.get(s)).filter((p): p is PublicProduct => Boolean(p));
    return { title: sub.label, items };
  });

  const matchedKits = KIT_MATCHES.filter((k) => k.match.some((m) => subs.includes(m)))
    .map((k) => bySlug.get(k.slug))
    .filter((p): p is PublicProduct => Boolean(p));

  function reset() {
    setStep(0);
    setProblems([]);
    setSubs([]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-leaf" : "bg-black/10"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="rounded-card bg-surface p-5">
          <h1 className="font-display text-xl">কী কী সমস্যা?</h1>
          <p className="mb-3 mt-1 text-sm text-muted">একাধিক বাছাই করতে পারেন</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(QUIZ).map(([key, q]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(problems, setProblems, key)}
                aria-pressed={problems.includes(key)}
                className={`rounded-xl border p-3 text-left ${
                  problems.includes(key) ? "border-leaf bg-leaf-soft" : "border-line"
                }`}
              >
                <b className="block text-sm">{q.label}</b>
                <span className="text-xs text-muted">{q.desc}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={problems.length === 0}
            onClick={() => setStep(1)}
            className="mt-4 w-full rounded-xl bg-leaf py-3 font-semibold text-white disabled:opacity-40"
          >
            {problems.length ? `পরবর্তী · ${problems.length}টা বাছাই করা` : "অন্তত একটা বাছাই করুন"}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setStep(0)} className="w-fit text-sm font-semibold text-leaf">
            ← আগের ধাপ
          </button>
          {problems.map((pk) => (
            <div key={pk} className="rounded-card bg-surface p-5">
              <h3 className="font-display mb-2 text-lg">{QUIZ[pk].label}</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(QUIZ[pk].subs).map(([sk, sub]) => {
                  const key = `${pk}:${sk}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(subs, setSubs, key)}
                      aria-pressed={subs.includes(key)}
                      className={`rounded-xl border p-3 text-left text-sm font-medium ${
                        subs.includes(key) ? "border-leaf bg-leaf-soft" : "border-line"
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={!!missingSubFor}
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-leaf py-3 font-semibold text-white disabled:opacity-40"
          >
            {missingSubFor ? `${QUIZ[missingSubFor].label} থেকে একটা বাছাই করুন` : "পরবর্তী →"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setStep(1)} className="w-fit text-sm font-semibold text-leaf">
            ← আগের ধাপ
          </button>
          <h1 className="font-display text-xl">আপনার জন্য সাজেশন</h1>

          {matchedKits.map((kit) => (
            <div key={kit.productId} className="rounded-card border border-dashed border-[#7A4FB5] bg-[#7A4FB50D] p-4">
              <span className="text-xs font-bold text-[#7A4FB5]">পুরো সমাধান চাইলে</span>
              <b className="font-display block text-base">{kit.name}</b>
              <p className="text-xs text-muted">{kit.description}</p>
              <div className="num mt-2 flex items-center justify-between">
                <b className="text-amber-deep">{formatTaka(kit.price)}</b>
                <div className="flex gap-2">
                  <Link href={`/product/${kit.slug}`} className="rounded-lg border border-leaf px-3 py-1.5 text-sm font-semibold text-leaf">
                    দেখুন
                  </Link>
                  <button
                    type="button"
                    onClick={() => addToCartFrom(kit)}
                    className="rounded-lg bg-leaf px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    {addedSlug === kit.slug ? "কার্টে আছে" : "কার্টে নিন"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {groups.map((g, i) => (
            <div key={i} className="rounded-card bg-surface p-4">
              <h4 className="font-display mb-2 text-base">{g.title}</h4>
              {g.items.length === 0 ? (
                <p className="text-sm text-muted">এখনো পণ্য যোগ করা হয়নি।</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {g.items.slice(0, 2).map((p, idx) => (
                    <div key={p.productId} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl bg-bg p-2">
                      <div className="h-12 w-12 overflow-hidden rounded-lg">
                        <ProductArt name={p.name} categoryName={p.category?.name ?? null} thumbnailUrl={p.thumbnailUrl} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-amber-deep">{idx === 0 ? "সবচেয়ে উপযুক্ত" : "বিকল্প"}</span>
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="num text-xs text-amber-deep">{formatTaka(p.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCartFrom(p)}
                        className="rounded-lg bg-leaf px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {addedSlug === p.slug ? "কার্টে আছে" : "কার্টে নিন"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <p className="rounded-card bg-amber-soft p-3 text-xs text-ink">
            এই পরামর্শ সাধারণ তথ্যের ভিত্তিতে। সমস্যা গুরুতর হলে বা ২ সপ্তাহে না কমলে ডাক্তার দেখান।
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="flex-1 rounded-xl border border-line py-3 font-semibold">
              আবার শুরু করুন
            </button>
            <Link href="/checkout" className="flex-1 rounded-xl bg-amber py-3 text-center font-semibold text-white">
              কার্ট দেখুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
