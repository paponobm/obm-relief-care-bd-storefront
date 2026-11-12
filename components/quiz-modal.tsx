"use client";

import { useEffect } from "react";
import { QuizFlow } from "./quiz-flow";

// The "কোনটা নেবেন বুঝছেন না?" card's own popup — same overlay/close-button
// pattern as QuickViewModal, just wrapping the shared QuizFlow instead of a
// product preview. Local to HelpCards (open/close state lives there), not a
// window-event-driven singleton like QuickViewModal, since only one trigger
// opens it.
export function QuizModal({ onClose }: { onClose: () => void }) {
  // Background stays put behind the modal while it's open, same reasoning
  // as QuickViewModal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      aria-hidden
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="কোনটা নেবেন বুঝছেন না?"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card bg-surface p-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-bg text-lg text-ink"
        >
          ×
        </button>

        <QuizFlow onFinish={onClose} />
      </div>
    </div>
  );
}
