// Combat visual FX - bewusst KOMPLETT von React entkoppelt.
//
// Warum kein React/CSS-Klassen-Toggle: React rekonziliert className + children
// bei jedem Re-Render und wuerde injizierte Effekt-Knoten oder Klassen sofort
// wieder entfernen. Deshalb:
//   - Partikel/Zahlen/Bildschirm-Flash landen in EINER fixen Overlay-Ebene, die
//     direkt an document.body haengt (React fasst sie nie an).
//   - Das Wackeln laeuft per Web Animations API (element.animate) direkt auf dem
//     echten Knoten. WAAPI animiert die transform-Property unabhaengig vom
//     inline-style/className und ueberlebt React-Re-Renders.
//
// Alles respektiert prefers-reduced-motion und raeumt sich selbst auf.

let fxRoot: HTMLDivElement | null = null;

function getRoot(): HTMLDivElement {
  if (fxRoot && document.body.contains(fxRoot)) return fxRoot;
  const el = document.createElement("div");
  el.id = "mg-fx-root";
  // z-45: ueber dem Brett, unter den Modals (z-50).
  el.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:45;overflow:hidden;";
  document.body.appendChild(el);
  fxRoot = el;
  return el;
}

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// --- Schnelles Wackeln direkt auf dem Element (ueberlebt Re-Render) ---
export function shakeElement(el: HTMLElement | null, big = false): void {
  if (!el || reduceMotion()) return;
  const amp = big ? 9 : 5;
  el.animate(
    [
      { transform: "translate(0,0) rotate(0deg)" },
      { transform: `translate(${-amp}px, ${amp * 0.4}px) rotate(-2deg)` },
      { transform: `translate(${amp}px, ${-amp * 0.3}px) rotate(2deg)` },
      { transform: `translate(${-amp * 0.6}px, 0) rotate(-1deg)` },
      { transform: `translate(${amp * 0.4}px, 0) rotate(1deg)` },
      { transform: "translate(0,0) rotate(0deg)" },
    ],
    { duration: big ? 440 : 320, easing: "ease-out" }
  );
}

function redVeilOver(r: DOMRect): void {
  const root = getRoot();
  const d = document.createElement("div");
  d.style.cssText =
    `position:absolute;left:${r.left}px;top:${r.top}px;` +
    `width:${r.width}px;height:${r.height}px;border-radius:12px;` +
    `background:radial-gradient(circle at 50% 50%, rgba(255,46,46,0.6), rgba(170,18,18,0.18) 70%, transparent);` +
    `mix-blend-mode:screen;`;
  root.appendChild(d);
  const a = d.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 0 }],
    { duration: 430, easing: "ease-out" }
  );
  a.onfinish = () => d.remove();
}

function floatNumber(r: DOMRect, text: string, color: string): void {
  const root = getRoot();
  const n = document.createElement("div");
  n.textContent = text;
  const size = Math.min(36, 16 + r.width * 0.16);
  n.style.cssText =
    `position:absolute;left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.28}px;` +
    `transform:translate(-50%,-50%);font-family:'Cinzel',serif;font-weight:900;` +
    `font-size:${size}px;color:${color};` +
    `text-shadow:0 2px 6px rgba(0,0,0,0.95),0 0 12px rgba(255,40,40,0.7);` +
    `will-change:transform,opacity;`;
  root.appendChild(n);
  const a = n.animate(
    [
      { transform: "translate(-50%,-50%) scale(0.5)", opacity: 0 },
      { transform: "translate(-50%,-95%) scale(1.18)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%,-165%) scale(1)", opacity: 0 },
    ],
    { duration: 900, easing: "cubic-bezier(.2,.8,.3,1)" }
  );
  a.onfinish = () => n.remove();
}

function impactBurst(cx: number, cy: number): void {
  const root = getRoot();

  // Expandierender Schock-Ring
  const ring = document.createElement("div");
  ring.style.cssText =
    `position:absolute;left:${cx}px;top:${cy}px;width:22px;height:22px;` +
    `margin:-11px 0 0 -11px;border-radius:50%;border:2px solid rgba(255,120,60,0.9);` +
    `box-shadow:0 0 16px rgba(255,90,45,0.85);`;
  root.appendChild(ring);
  const ra = ring.animate(
    [
      { transform: "scale(0.3)", opacity: 0.95 },
      { transform: "scale(3.4)", opacity: 0 },
    ],
    { duration: 440, easing: "ease-out" }
  );
  ra.onfinish = () => ring.remove();

  // Funken-Splitter radial
  const N = 8;
  for (let i = 0; i < N; i++) {
    const sh = document.createElement("div");
    const ang = (Math.PI * 2 * i) / N + (i % 2 ? 0.35 : 0);
    const dist = 26 + (i % 3) * 11;
    sh.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:3px;height:10px;` +
      `margin:-5px 0 0 -1.5px;border-radius:2px;` +
      `background:linear-gradient(#ffd089,#ff5a2d);box-shadow:0 0 7px rgba(255,90,45,0.85);`;
    root.appendChild(sh);
    const sa = sh.animate(
      [
        { transform: `rotate(${ang}rad) translateY(0) scale(1)`, opacity: 1 },
        { transform: `rotate(${ang}rad) translateY(-${dist}px) scale(0.35)`, opacity: 0 },
      ],
      { duration: 380 + (i % 3) * 70, easing: "ease-out" }
    );
    sa.onfinish = () => sh.remove();
  }
}

// Volltreffer auf eine Figur / einen Helden: Wackeln + roter Flash + Zahl + Funken.
export function flashDamage(
  el: HTMLElement | null,
  amount: number,
  opts: { big?: boolean } = {}
): void {
  if (!el) return;
  shakeElement(el, opts.big);
  if (reduceMotion()) return;
  const r = el.getBoundingClientRect();
  redVeilOver(r);
  if (amount > 0) floatNumber(r, `-${amount}`, "#ff6b6b");
  impactBurst(r.left + r.width / 2, r.top + r.height / 2);
}

// Figur stirbt: dunkler Blut-Rauch-Stoss an der letzten Position.
export function deathPoof(cx: number, cy: number): void {
  if (reduceMotion()) return;
  const root = getRoot();
  const puff = document.createElement("div");
  puff.style.cssText =
    `position:absolute;left:${cx}px;top:${cy}px;width:64px;height:64px;` +
    `margin:-32px 0 0 -32px;border-radius:50%;` +
    `background:radial-gradient(circle, rgba(40,8,8,0.9), rgba(90,18,18,0.35) 60%, transparent 76%);`;
  root.appendChild(puff);
  const a = puff.animate(
    [
      { transform: "scale(0.4)", opacity: 0.95 },
      { transform: "scale(1.7)", opacity: 0 },
    ],
    { duration: 540, easing: "ease-out" }
  );
  a.onfinish = () => puff.remove();
  impactBurst(cx, cy);
}

// Voller roter Bildschirm-Flash, wenn der eigene Held getroffen wird.
export function screenFlash(strength = 1): void {
  if (reduceMotion()) return;
  const s = Math.max(0.25, Math.min(1, strength));
  const root = getRoot();
  const d = document.createElement("div");
  d.style.cssText =
    `position:absolute;inset:0;` +
    `background:radial-gradient(125% 100% at 50% 50%, transparent 28%, rgba(176,12,12,${0.55 * s}) 100%);`;
  root.appendChild(d);
  const a = d.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }],
    { duration: 520, easing: "ease-out" }
  );
  a.onfinish = () => d.remove();
}

// Angreifer-Lunge: die Figur holt aus, stoesst zum Ziel und federt zurueck.
export function lungeAttack(
  attackerEl: HTMLElement | null,
  targetEl: HTMLElement | null
): void {
  if (!attackerEl || !targetEl || reduceMotion()) return;
  const a = attackerEl.getBoundingClientRect();
  const t = targetEl.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (a.left + a.width / 2);
  const dy = t.top + t.height / 2 - (a.top + a.height / 2);
  // Nur ~62% der Strecke fliegen, sonst ueberdeckt der Angreifer das Ziel komplett.
  const fx = dx * 0.62;
  const fy = dy * 0.62;

  const prevZ = attackerEl.style.zIndex;
  attackerEl.style.zIndex = "60";
  const anim = attackerEl.animate(
    [
      { transform: "translate(0px,0px) scale(1)" },
      { transform: `translate(${-dx * 0.1}px, ${-dy * 0.1}px) scale(1.05)`, offset: 0.18 }, // Ausholen
      { transform: `translate(${fx}px, ${fy}px) scale(1.13)`, offset: 0.42 }, // Stoss
      { transform: `translate(${fx * 0.88}px, ${fy * 0.88}px) scale(1.1)`, offset: 0.5 },
      { transform: "translate(0px,0px) scale(1)", offset: 1 }, // zurueck
    ],
    { duration: 460, easing: "cubic-bezier(.5,0,.3,1)" }
  );
  const restore = () => {
    attackerEl.style.zIndex = prevZ;
  };
  anim.onfinish = restore;
  anim.oncancel = restore;
}
