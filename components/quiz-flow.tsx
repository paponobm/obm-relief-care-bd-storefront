"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { getQuiz, type PublicProduct, type QuizConfig } from "@/lib/store";
import { ProductArt } from "@/components/product-art";
import { bnTaka } from "@/components/product-deal-card";

const EMPTY_QUIZ: QuizConfig = { problems: [] };

// The 3-question symptom-matcher's actual steps/logic — shared by the plain
// /quiz page (app/quiz/page.tsx) and the quiz modal (quiz-modal.tsx) opened
// from the "কোনটা নেবেন বুঝছেন না?" card, so both stay in sync with one
// implementation instead of two copies drifting apart. Categories,
// sub-categories and their product matches are admin-curated (Settings →
// Badge & Category → Problem) and resolved server-side — this component
// never fabricates a match, same as every other admin-curated list in this
// storefront. Problems/subs are addressed by array index ("0", "1:2") since
// they're freeform admin content now, not fixed string keys.
export function QuizFlow({ onFinish }: { onFinish?: () => void } = {}) {
  const [quiz, setQuiz] = useState<QuizConfig>(EMPTY_QUIZ);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const { items: cartItems, add } = useCart();

  useEffect(() => {
    getQuiz()
      .then(setQuiz)
      .catch(() => setQuiz(EMPTY_QUIZ))
      .finally(() => setLoaded(true));
  }, []);

  function toggle(arr: string[], setArr: (v: string[]) => void, v: string) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  function addToCartFrom(p: PublicProduct) {
    add({ productId: p.productId, slug: p.slug, name: p.name, image: p.thumbnailUrl, price: p.price }, 1);
  }

  // Reads the real cart, not a locally-remembered "last clicked" slug — a
  // product added via এখনই কিনুন's bulk add, or already in the cart from
  // anywhere else on the site, still correctly shows "কার্টে আছে" here
  // instead of falsely offering to add it again.
  function isInCart(productId: string) {
    return cartItems.some((i) => i.productId === productId);
  }

  const missingSubFor = problems.find((pk) => !subs.some((s) => s.startsWith(pk + ":")));

  const groups = subs.map((key) => {
    const [pi, si] = key.split(":").map(Number);
    const sub = quiz.problems[pi].subs[si];
    return { title: sub.label, items: sub.items };
  });

  function reset() {
    setStep(0);
    setProblems([]);
    setSubs([]);
  }

  // "এখনই কিনুন" — adds every recommended product shown above that isn't
  // already in the cart (same silent bulk-add + open-cart-drawer pattern as
  // ComboBuilder.confirmCombo), then opens the cart drawer right here
  // instead of jumping straight to checkout. Skipping items already added
  // (e.g. via that item's own "কার্টে নিন" button) matters — without this,
  // this button would silently double the quantity of anything the
  // customer already picked, on top of what they meant to add.
  function addAllToCart() {
    groups.forEach((g) => {
      g.items.slice(0, 2).forEach((p) => {
        if (isInCart(p.productId)) return;
        add({ productId: p.productId, slug: p.slug, name: p.name, image: p.thumbnailUrl, price: p.price }, 1, {
          silent: true,
        });
      });
    });
    window.dispatchEvent(new Event("relief-care:open-cart"));
    onFinish?.();
  }

  if (loaded && quiz.problems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-card bg-surface p-5 text-center text-sm text-muted">
        এই মুহূর্তে কোনো প্রশ্ন সেট করা নেই।
      </div>
    );
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
            {quiz.problems.map((q, pi) => {
              const key = String(pi);
              return (
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
                  <span className="text-xs text-muted">{q.description}</span>
                </button>
              );
            })}
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
          {problems.map((pk) => {
            const problem = quiz.problems[Number(pk)];
            return (
              <div key={pk} className="rounded-card bg-surface p-5">
                <h3 className="font-display mb-2 text-lg">{problem.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {problem.subs.map((sub, si) => {
                    const key = `${pk}:${si}`;
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
            );
          })}
          <button
            type="button"
            disabled={!!missingSubFor}
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-leaf py-3 font-semibold text-white disabled:opacity-40"
          >
            {missingSubFor ? `${quiz.problems[Number(missingSubFor)].label} থেকে একটা বাছাই করুন` : "পরবর্তী →"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setStep(1)} className="w-fit text-sm font-semibold text-leaf">
            ← আগের ধাপ
          </button>
          <h1 className="font-display text-xl">আপনার জন্য সাজেশন</h1>

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
                        <ProductArt
                          name={p.name}
                          categoryName={p.category?.name ?? null}
                          thumbnailUrl={p.thumbnailUrl}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-amber-deep">{idx === 0 ? "সবচেয়ে উপযুক্ত" : "বিকল্প"}</span>
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="num text-xs text-amber-deep">{bnTaka(p.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCartFrom(p)}
                        className="rounded-lg bg-leaf px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {isInCart(p.productId) ? "কার্টে আছে" : "কার্টে নিন"}
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
            <button
              type="button"
              onClick={addAllToCart}
              className="flex-1 rounded-xl bg-amber py-3 text-center font-semibold text-white"
            >
              এখনই কিনুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
