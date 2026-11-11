"use client";

import { useEffect, useState } from "react";

interface ToastEntry {
  id: number;
  message: string;
}

// Mounted once (see layout.tsx) — listens for lib/cart.tsx's "relief-care:
// toast" event (fired by add()/remove(), and by a couple of call sites that
// collapse several of those into one toast for one user action) so any
// add/remove to the cart anywhere in the app gets the same quiet
// confirmation, without threading a toast prop through every call site.
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const message = (e as CustomEvent<string>).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    }
    window.addEventListener("relief-care:toast", onToast);
    return () => window.removeEventListener("relief-care:toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[110] flex flex-col items-center gap-2 px-4">
      <style>{`
        @keyframes relief-care-toast-pop {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg"
          style={{ animation: "relief-care-toast-pop 0.2s ease-out" }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
