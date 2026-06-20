import React, { useEffect, useRef } from "react";

// Marcgard atmosphere layer: drifting snow + the occasional raven flying across,
// over a static aurora / fog / vignette built in CSS. One requestAnimationFrame loop,
// devicePixelRatio-aware, respects prefers-reduced-motion. Pointer-events: none so it
// never blocks the game underneath.

interface Flake { x: number; y: number; r: number; vy: number; drift: number; phase: number; alpha: number; }
interface Raven { x: number; y: number; vx: number; baseY: number; t: number; size: number; }

interface AtmosphereProps {
  // Fired when a raven spawns, so a sound layer can caw in time. Optional.
  onRaven?: () => void;
  // Wenn ein Held kurz vorm Tod steht: Schnee faerbt sich blutrot + wird zu Regen.
  bloodRain?: boolean;
}

export function Atmosphere({ onRaven, bloodRain = false }: AtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onRavenRef = useRef(onRaven);
  onRavenRef.current = onRaven;
  const bloodRef = useRef(bloodRain);
  bloodRef.current = bloodRain;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const flakes: Flake[] = [];
    const ravens: Raven[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed snow scaled to viewport area
    const flakeCount = Math.round(Math.min(220, (w * h) / 9000));
    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.25 + Math.random() * 0.7,
        drift: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.5,
      });
    }

    let frame = 0;
    let nextRaven = 700 + Math.random() * 900; // frames until next raven (~12-27s @60fps)
    let raf = 0;
    let redMix = 0; // 0 = Schnee weiss, 1 = Blutregen. Wird sanft hin-/weggeblendet.

    const spawnRaven = () => {
      const fromLeft = Math.random() < 0.5;
      const baseY = h * (0.12 + Math.random() * 0.35);
      ravens.push({
        x: fromLeft ? -60 : w + 60,
        baseY,
        y: baseY,
        vx: (fromLeft ? 1 : -1) * (1.6 + Math.random() * 1.2),
        t: Math.random() * Math.PI * 2,
        size: 22 + Math.random() * 12,
      });
      onRavenRef.current?.();
    };

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Sanfter Uebergang Schnee <-> Blutregen
      redMix += ((bloodRef.current ? 1 : 0) - redMix) * 0.025;
      if (redMix < 0.001) redMix = 0;

      // Flockenfarbe von Frost (#E8EDF4) nach Blut (#BE2D2D) interpolieren
      const cr = Math.round(232 + (190 - 232) * redMix);
      const cg = Math.round(237 + (45 - 237) * redMix);
      const cb = Math.round(244 + (45 - 244) * redMix);
      const dropColor = `rgb(${cr},${cg},${cb})`;
      const rain = redMix > 0.18;

      ctx.fillStyle = dropColor;
      ctx.strokeStyle = dropColor;
      for (const f of flakes) {
        f.phase += 0.01;
        // Blutregen faellt schneller + steiler (weniger Seitwaerts-Drift)
        f.y += f.vy * (1 + redMix * 1.7);
        f.x += Math.sin(f.phase) * f.drift * 0.5 * (1 - redMix * 0.75);
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5;
        if (f.x < -5) f.x = w + 5;
        ctx.globalAlpha = f.alpha;
        if (rain) {
          // Regen: kurzer fallender Strich statt Flocke
          const len = 3 + redMix * f.vy * 9;
          ctx.lineWidth = Math.max(0.8, f.r * 0.9);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.x, f.y + len);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Ravens
      if (--nextRaven <= 0) {
        spawnRaven();
        nextRaven = 1100 + Math.random() * 1400;
      }
      for (let i = ravens.length - 1; i >= 0; i--) {
        const rv = ravens[i];
        rv.t += 0.12;
        rv.x += rv.vx;
        rv.y = rv.baseY + Math.sin(rv.t) * 14;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.font = `${rv.size}px serif`;
        ctx.textBaseline = "middle";
        if (rv.vx < 0) { ctx.scale(-1, 1); ctx.fillText("🐦‍⬛", -rv.x, rv.y); }
        else ctx.fillText("🐦‍⬛", rv.x, rv.y);
        ctx.restore();
        if ((rv.vx > 0 && rv.x > w + 70) || (rv.vx < 0 && rv.x < -70)) ravens.splice(i, 1);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div className="mg-aurora" aria-hidden />
      <div className="mg-fog" aria-hidden />
      <div className="mg-blood-veil" data-active={bloodRain ? "1" : "0"} aria-hidden />
      <div className="mg-vignette" aria-hidden />
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}
      />
    </>
  );
}
