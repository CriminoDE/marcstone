import React, { useRef, useState } from "react";

interface EndTurnButtonProps {
  timeRemaining: number;
  onEndTurn: () => void;
}

// Hold-to-confirm end-turn button.
// You must press and hold; a bar fills up, and only when it completes does the turn end.
// This kills accidental turn-ends from a stray tap. Works with mouse and touch (pointer events).
const HOLD_MS = 550;

export function EndTurnButton({ timeRemaining, onEndTurn }: EndTurnButtonProps) {
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const urgent = timeRemaining <= 10;

  const startHold = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      setHolding(false);
      holdTimer.current = null;
      onEndTurn();
    }, HOLD_MS);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    e?.stopPropagation();
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  };

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      style={{ touchAction: "none" }}
      className={`relative overflow-hidden select-none px-6 py-3 font-bold font-sans text-xs tracking-wider uppercase rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 ${
        urgent
          ? "bg-red-500 hover:bg-red-400 text-white animate-pulse"
          : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 shadow-emerald-950/20"
      }`}
    >
      {/* Fill bar that grows while holding. When released it snaps back fast. */}
      <span
        className="absolute left-0 top-0 bottom-0 bg-white/30 pointer-events-none"
        style={{
          width: holding ? "100%" : "0%",
          transition: holding ? `width ${HOLD_MS}ms linear` : "width 120ms ease-out",
        }}
      />
      <span className="relative z-10">{holding ? "🛡️ Halten…" : "🛡️ Zug beenden"}</span>
      <span
        className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-mono ${
          urgent ? "bg-white/20" : "bg-black/20"
        }`}
      >
        {timeRemaining}s
      </span>
    </button>
  );
}
