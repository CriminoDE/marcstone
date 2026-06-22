import React, { useEffect, useRef, useState } from "react";

// Burning-fuse turn timer. The rope burns down from full to empty; a flame sits on the
// burning tip with an ember glow, and the last 5 seconds go into a red "panic" flicker.
// Smooth: when endTimeMs (epoch) is given, the fuse burns CONTINUOUSLY via requestAnimationFrame
// instead of jumping once per server second. Falls back to the integer `remaining` prop otherwise.

interface FuseTimerProps {
  remaining: number; // seconds left (fallback / label source)
  total?: number; // full turn length in seconds
  active: boolean; // is it the local player's turn (drives emphasis)
  endTimeMs?: number; // epoch ms when the turn ends (enables smooth burn)
}

export function FuseTimer({ remaining, total = 30, active, endTimeMs }: FuseTimerProps) {
  // Continuous remaining (seconds, fractional) driven by rAF when we have an end time.
  const [frac, setFrac] = useState<number>(() => Math.max(0, Math.min(1, remaining / total)));
  const [secs, setSecs] = useState<number>(remaining);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!endTimeMs) {
      // No end time: just mirror the integer prop.
      setFrac(Math.max(0, Math.min(1, remaining / total)));
      setSecs(remaining);
      return;
    }
    const tick = () => {
      const leftMs = Math.max(0, endTimeMs - Date.now());
      setFrac(Math.max(0, Math.min(1, leftMs / (total * 1000))));
      setSecs(Math.ceil(leftMs / 1000));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [endTimeMs, total, remaining]);

  const pct = frac * 100;
  const panic = secs <= 5;
  // The flame breathes constantly (alive), and flares harder in panic.
  const flameScale = 1 + 0.12 * Math.sin(Date.now() / (panic ? 90 : 220));

  return (
    <div className="w-full flex items-center gap-3 px-1 select-none" aria-hidden>
      <span className={`font-display text-[10px] uppercase tracking-[0.2em] ${active ? "text-mg-bronze" : "text-mg-fog"}`}>
        {active ? "Dein Zug" : "Gegner"}
      </span>

      <div className="relative flex-1 h-3">
        {/* Burnt track */}
        <div className="absolute inset-0 rounded-full bg-mg-void border border-mg-stone overflow-hidden">
          {/* Remaining rope - no CSS transition; rAF drives it smoothly */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              width: `${pct}%`,
              background: panic
                ? "repeating-linear-gradient(90deg,#8E1B1B,#8E1B1B 5px,#C0392B 5px,#C0392B 10px)"
                : "repeating-linear-gradient(90deg,#6e521f,#6e521f 5px,#B0843B 5px,#B0843B 10px)",
              boxShadow: panic ? "0 0 10px rgba(224,49,49,0.6)" : "none",
            }}
          />
        </div>

        {/* Flame riding the burning tip - breathes every frame */}
        <div className="absolute -top-[9px]" style={{ left: `calc(${pct}% - 9px)` }}>
          <span
            className="block text-base leading-none"
            style={{
              transform: `scale(${flameScale})`,
              filter: `drop-shadow(0 0 ${panic ? 9 : 6}px ${panic ? "#E03131" : "#FF5A2D"})`,
            }}
          >
            🔥
          </span>
        </div>
      </div>

      <span
        className={`font-display font-black text-sm tabular-nums ${
          panic ? "text-mg-danger" : active ? "text-mg-frost-text" : "text-mg-fog"
        }`}
        style={panic ? { textShadow: "0 0 8px rgba(224,49,49,0.7)" } : undefined}
      >
        {secs}s
      </span>
    </div>
  );
}
