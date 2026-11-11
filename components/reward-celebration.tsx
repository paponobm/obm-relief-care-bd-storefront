"use client";

import { useMemo } from "react";

const CONFETTI_COLORS = [
  "#1FA855",
  "#ea580c",
  "#f15a24",
  "#facc15",
  "#38bdf8",
  "#f472b6",
  "#a855f7",
  "#ef4444",
  "#22d3ee",
  "#fb923c",
];

// A one-shot confetti burst + message toast — purely decorative (pointer
// events pass through, nothing here is interactive), shown by the checkout
// page for a few seconds the moment a real spend-more reward (Settings →
// Other Settings → Spend-more rewards) is actually earned. The parent owns
// how long it stays mounted; this component just renders the animation
// while it exists.
export function RewardCelebration({ message }: { message: string }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => {
        const isCircle = i % 3 === 0;
        const size = isCircle ? 7 + Math.random() * 6 : 6 + Math.random() * 6;
        return {
          id: i,
          left: Math.random() * 100,
          // Pieces scatter sideways before falling, not just straight down —
          // this is the "blast" (vs. a plain, uniform rain of confetti).
          drift: Math.round((Math.random() - 0.5) * 70),
          delay: Math.random() * 0.5,
          duration: 2.2 + Math.random() * 1.8,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          rotate: Math.random() * 360,
          spin: 540 + Math.random() * 720,
          isCircle,
          width: size,
          height: isCircle ? size : size * 1.7,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes reward-confetti-fall {
          0% { transform: translate(0, -10vh) rotate(0deg); opacity: 1; }
          22% { transform: translate(var(--drift), 8vh) rotate(calc(var(--spin) * 0.3)); opacity: 1; }
          100% { transform: translate(var(--drift), 112vh) rotate(var(--spin)); opacity: 0.95; }
        }
        @keyframes reward-flash-burst {
          0% { transform: translate(-50%, -50%) scale(0.25); opacity: 0.9; }
          45% { transform: translate(-50%, -50%) scale(1.8); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
        }
        @keyframes reward-celebration-pop {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          12% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          85% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: "absolute",
              top: 0,
              left: `${p.left}%`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? "50%" : 2,
              "--drift": `${p.drift}vw`,
              "--spin": `${p.spin}deg`,
              transform: `rotate(${p.rotate}deg)`,
              animation: `reward-confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-64 w-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(241,90,36,0.25) 45%, rgba(241,90,36,0) 70%)",
          animation: "reward-flash-burst 1.1s ease-out forwards",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 w-[min(92%,420px)] rounded-xl border border-leaf bg-surface px-4 py-3 text-center shadow-2xl"
        style={{ animation: "reward-celebration-pop 5s ease-in-out forwards" }}
      >
        <p className="font-display text-base font-bold text-leaf-deep">🎉 {message}</p>
      </div>
    </div>
  );
}
