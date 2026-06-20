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

// EPISCHER Helden-Tod: dunkler Bildschirm-Puls + Schockwelle + Splitter + grosser Totenkopf.
// Wird ausgeloest, wenn ein Held auf 0 faellt (der entscheidende Schlag).
export function heroDeathExplosion(el: HTMLElement | null): void {
  if (reduceMotion()) {
    // Wenigstens ein kurzer Flash fuer Reduced-Motion.
    screenFlash(1);
    return;
  }
  const root = getRoot();
  const r = el ? el.getBoundingClientRect() : null;
  const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const cy = r ? r.top + r.height / 2 : window.innerHeight / 2;

  // 1) Dunkler, blutroter Vollbild-Puls
  const veil = document.createElement("div");
  veil.style.cssText =
    `position:absolute;inset:0;background:radial-gradient(120% 90% at ${cx}px ${cy}px, rgba(140,8,8,0.85), rgba(20,2,2,0.7) 55%, rgba(0,0,0,0.85));`;
  root.appendChild(veil);
  veil.animate([{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 0.85, offset: 0.6 }, { opacity: 0 }], { duration: 1600, easing: "ease-out" }).onfinish = () => veil.remove();

  // 2) Mehrere Schockwellen-Ringe
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("div");
    ring.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;` +
      `border:3px solid rgba(255,${90 - i * 20},${40},0.9);box-shadow:0 0 24px rgba(255,70,40,0.9);`;
    root.appendChild(ring);
    ring.animate(
      [{ transform: "scale(0.2)", opacity: 0.95 }, { transform: `scale(${7 + i * 2})`, opacity: 0 }],
      { duration: 900 + i * 220, easing: "cubic-bezier(.2,.7,.3,1)", delay: i * 120 }
    ).onfinish = () => ring.remove();
  }

  // 3) Splitter radial (Knochen/Glut)
  const N = 18;
  for (let i = 0; i < N; i++) {
    const sh = document.createElement("div");
    const ang = (Math.PI * 2 * i) / N + (i % 2 ? 0.3 : 0);
    const dist = 90 + (i % 4) * 40;
    const col = i % 2 ? "#ffd089" : "#ff4a2d";
    sh.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:4px;height:16px;margin:-8px 0 0 -2px;border-radius:2px;` +
      `background:linear-gradient(${col},#7a1010);box-shadow:0 0 10px ${col};`;
    root.appendChild(sh);
    sh.animate(
      [{ transform: `rotate(${ang}rad) translateY(0) scale(1)`, opacity: 1 }, { transform: `rotate(${ang}rad) translateY(-${dist}px) scale(0.3)`, opacity: 0 }],
      { duration: 700 + (i % 4) * 120, easing: "ease-out" }
    ).onfinish = () => sh.remove();
  }

  // 4) Grosser Totenkopf, der hochskaliert und vergeht
  const skull = document.createElement("div");
  skull.textContent = "💀";
  skull.style.cssText =
    `position:absolute;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);font-size:54px;` +
    `filter:drop-shadow(0 0 18px rgba(255,60,40,0.95));`;
  root.appendChild(skull);
  skull.animate(
    [
      { transform: "translate(-50%,-50%) scale(0.2) rotate(-12deg)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.5) rotate(0deg)", opacity: 1, offset: 0.3 },
      { transform: "translate(-50%,-90%) scale(1.7) rotate(6deg)", opacity: 1, offset: 0.7 },
      { transform: "translate(-50%,-130%) scale(1.3) rotate(10deg)", opacity: 0 },
    ],
    { duration: 1500, easing: "cubic-bezier(.2,.8,.3,1)" }
  ).onfinish = () => skull.remove();
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

// ============================================================
//  Rundenstart-Schwerter
// ============================================================
// Gekreuzte Schwerter fliegen rein, blitzen auf, halten kurz, faden weg.
// Gold = mein Zug, Blutrot = Gegner am Zug.
export function roundStartFlare(label: string, mine: boolean): void {
  if (reduceMotion()) return;
  const root = getRoot();
  const accent = mine ? "#E6B358" : "#C0392B";

  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;";
  root.appendChild(wrap);

  const band = document.createElement("div");
  band.style.cssText =
    "position:absolute;left:0;right:0;top:50%;height:120px;transform:translateY(-50%);" +
    "background:linear-gradient(90deg,transparent,rgba(0,0,0,0.62) 18%,rgba(0,0,0,0.62) 82%,transparent);";
  wrap.appendChild(band);

  const swords = document.createElement("div");
  swords.textContent = "⚔️"; // crossed swords
  swords.style.cssText =
    `position:relative;font-size:64px;line-height:1;filter:drop-shadow(0 0 14px ${accent});`;
  wrap.appendChild(swords);

  const clash = document.createElement("div");
  clash.style.cssText =
    `position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;` +
    `border-radius:50%;background:radial-gradient(circle,#fff,${accent} 60%,transparent);`;
  wrap.appendChild(clash);

  const text = document.createElement("div");
  text.textContent = label;
  text.style.cssText =
    `position:absolute;top:calc(50% + 54px);left:50%;transform:translateX(-50%);` +
    `font-family:'Cinzel',serif;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;` +
    `font-size:20px;color:${accent};text-shadow:0 2px 10px rgba(0,0,0,0.92);white-space:nowrap;`;
  wrap.appendChild(text);

  const dur = 1400;
  band.animate(
    [
      { opacity: 0, transform: "translateY(-50%) scaleX(0.6)" },
      { opacity: 1, transform: "translateY(-50%) scaleX(1)", offset: 0.2 },
      { opacity: 1, offset: 0.7 },
      { opacity: 0 },
    ],
    { duration: dur, easing: "ease-out" }
  );
  swords.animate(
    [
      { opacity: 0, transform: "scale(0.2) rotate(-40deg)" },
      { opacity: 1, transform: "scale(1.28) rotate(0deg)", offset: 0.22 },
      { opacity: 1, transform: "scale(1) rotate(0deg)", offset: 0.34 },
      { opacity: 1, transform: "scale(1) rotate(0deg)", offset: 0.72 },
      { opacity: 0, transform: "scale(1.12) rotate(8deg)" },
    ],
    { duration: dur, easing: "cubic-bezier(.2,.9,.2,1)" }
  );
  clash.animate(
    [
      { opacity: 0, transform: "scale(0.2)" },
      { opacity: 0, transform: "scale(0.2)", offset: 0.2 },
      { opacity: 1, transform: "scale(1)", offset: 0.28 },
      { opacity: 0, transform: "scale(2.6)", offset: 0.5 },
      { opacity: 0 },
    ],
    { duration: dur, easing: "ease-out" }
  );
  const ta = text.animate(
    [
      { opacity: 0, transform: "translateX(-50%) translateY(8px)" },
      { opacity: 1, transform: "translateX(-50%) translateY(0)", offset: 0.3 },
      { opacity: 1, offset: 0.72 },
      { opacity: 0 },
    ],
    { duration: dur, easing: "ease-out" }
  );
  ta.onfinish = () => wrap.remove();
}

// ============================================================
//  Element-Zauber-VFX
// ============================================================
export type SpellElement = "fire" | "frost" | "arcane" | "holy" | "heal" | "shadow";

interface ElementDef {
  colors: string[];
  rune: string;
  motion: "rise" | "riseSoft" | "orbit" | "drift";
}

const ELEMENTS: Record<SpellElement, ElementDef> = {
  fire: { colors: ["#ffd089", "#ff7a2d", "#ff3b2d"], rune: "#ff5a2d", motion: "rise" },
  frost: { colors: ["#bfeaff", "#7fd0ff", "#e8f6ff"], rune: "#5fa8d6", motion: "drift" },
  arcane: { colors: ["#d9a7ff", "#a05bff", "#7f3bff"], rune: "#a05bff", motion: "orbit" },
  holy: { colors: ["#ffe9a8", "#ffd060", "#fff4cf"], rune: "#e6b358", motion: "riseSoft" },
  heal: { colors: ["#b8ffb0", "#5fe06b", "#d9ffd0"], rune: "#5fe06b", motion: "riseSoft" },
  shadow: { colors: ["#b48cff", "#6b2db0", "#3a0e4a"], rune: "#9b1bbf", motion: "drift" },
};

function runeCircle(cx: number, cy: number, color: string): void {
  const root = getRoot();
  const size = 122;
  const ring = document.createElement("div");
  ring.style.cssText =
    `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;` +
    `margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;border:2px solid ${color};` +
    `box-shadow:0 0 22px ${color}, inset 0 0 18px ${color};`;
  root.appendChild(ring);
  const ra = ring.animate(
    [
      { opacity: 0, transform: "scale(0.4) rotate(0deg)" },
      { opacity: 0.95, transform: "scale(1) rotate(60deg)", offset: 0.3 },
      { opacity: 0.8, transform: "scale(1.05) rotate(140deg)", offset: 0.7 },
      { opacity: 0, transform: "scale(1.2) rotate(200deg)" },
    ],
    { duration: 780, easing: "ease-out" }
  );
  ra.onfinish = () => ring.remove();

  // Pentagramm-Sigille
  const star = document.createElement("div");
  const ss = size * 0.78;
  star.style.cssText =
    `position:absolute;left:${cx}px;top:${cy}px;width:${ss}px;height:${ss}px;` +
    `margin:${-ss / 2}px 0 0 ${-ss / 2}px;background:${color};` +
    `clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);` +
    `filter:drop-shadow(0 0 10px ${color});mix-blend-mode:screen;`;
  root.appendChild(star);
  const sa = star.animate(
    [
      { opacity: 0, transform: "scale(0.5) rotate(0deg)" },
      { opacity: 0.85, transform: "scale(1) rotate(-40deg)", offset: 0.35 },
      { opacity: 0.5, transform: "scale(1.02) rotate(-90deg)", offset: 0.7 },
      { opacity: 0, transform: "scale(1.1) rotate(-140deg)" },
    ],
    { duration: 780, easing: "ease-out" }
  );
  sa.onfinish = () => star.remove();
}

function emitParticles(cx: number, cy: number, def: ElementDef): void {
  const root = getRoot();
  const N = 16;
  for (let i = 0; i < N; i++) {
    const p = document.createElement("div");
    const col = def.colors[i % def.colors.length];
    const sz = 4 + (i % 3) * 3;
    p.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;` +
      `margin:${-sz / 2}px 0 0 ${-sz / 2}px;border-radius:50%;background:${col};box-shadow:0 0 8px ${col};`;
    root.appendChild(p);

    let kf: Keyframe[];
    if (def.motion === "rise") {
      const dx = (Math.random() * 2 - 1) * 40;
      kf = [
        { transform: "translate(0px,0px) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px,-${60 + Math.random() * 50}px) scale(0.2)`, opacity: 0 },
      ];
    } else if (def.motion === "riseSoft") {
      const dx = (Math.random() * 2 - 1) * 26;
      kf = [
        { transform: "translate(0px,10px) scale(0.6)", opacity: 0 },
        { transform: `translate(${dx * 0.5}px,-10px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px,-${50 + Math.random() * 40}px) scale(0.3)`, opacity: 0 },
      ];
    } else if (def.motion === "orbit") {
      const ang = (Math.PI * 2 * i) / N;
      const rad = 20 + Math.random() * 34;
      kf = [
        { transform: `rotate(${ang}rad) translateX(0px) scale(1)`, opacity: 1 },
        { transform: `rotate(${ang + 1.6}rad) translateX(${rad}px) scale(0.2)`, opacity: 0 },
      ];
    } else {
      const ang = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 42;
      kf = [
        { transform: "translate(0px,0px) scale(1)", opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(0.2)`, opacity: 0 },
      ];
    }
    const a = p.animate(kf, { duration: 560 + Math.random() * 360, easing: "ease-out" });
    a.onfinish = () => p.remove();
  }
}

// Goetter-Wuerfel: ein Wuerfel taumelt in der Mitte und ploppt weg (rein kosmetisch).
export function diceRoll(): void {
  if (reduceMotion()) return;
  const root = getRoot();
  const d = document.createElement("div");
  d.textContent = "🎲";
  d.style.cssText =
    "position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);" +
    "font-size:80px;filter:drop-shadow(0 0 22px rgba(230,179,88,0.95));";
  root.appendChild(d);
  const a = d.animate(
    [
      { transform: "translate(-50%,-50%) scale(0.2) rotate(0deg)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.35) rotate(360deg)", opacity: 1, offset: 0.4 },
      { transform: "translate(-50%,-50%) scale(1) rotate(680deg)", opacity: 1, offset: 0.72 },
      { transform: "translate(-50%,-50%) scale(0.85) rotate(720deg)", opacity: 0 },
    ],
    { duration: 900, easing: "cubic-bezier(.3,.8,.3,1)" }
  );
  a.onfinish = () => d.remove();
}

// ============================================================
//  SIEG-ZEITLUPEN-KINO (Finisher-Replay)
// ============================================================
// Spielt den entscheidenden Schlag gross + in Zeitlupe nach: die Karte praesentiert
// sich tanzend in der Mitte, holt aus, schlaegt/feuert in Slow-Mo auf das Helden-
// Wappen des Opfers, riesige Schadenszahl, dann epische Todes-Explosion + Boom.
// Komplett selbst-aufraeumend, gibt ein Promise zurueck (resolved am Ende).

export interface FinisherCinematicData {
  actorName: string;
  victimName: string;
  kind: "attack" | "spell" | "power";
  name: string;
  emoji: string;
  damage: number;
  cardType?: "minion" | "spell";
  attack?: number;
  element: SpellElement;
}

function cssFont(weight: number, size: number, serif = true): string {
  return `font-family:${serif ? "'Cinzel',serif" : "'Spectral',serif"};font-weight:${weight};font-size:${size}px;`;
}

// Baut die grosse Praesentations-Karte (Diener-Koerper oder Zauber-Sigille).
function buildFinisherCard(data: FinisherCinematicData): HTMLElement {
  const def = ELEMENTS[data.element] || ELEMENTS.arcane;
  const isMinion = data.cardType === "minion" || data.kind === "attack";
  const accent = data.kind === "attack" ? "#e7c98a" : def.rune;
  const glow = data.kind === "attack" ? "#c0392b" : def.colors[1];

  const card = document.createElement("div");
  card.style.cssText =
    `position:absolute;left:50%;top:38%;width:188px;height:268px;margin:-134px 0 0 -94px;` +
    `border-radius:16px;border:2px solid ${accent};` +
    `background:linear-gradient(160deg, rgba(28,24,20,0.97), rgba(10,8,7,0.99));` +
    `box-shadow:0 0 46px ${glow}, 0 0 90px ${glow}55, inset 0 0 26px rgba(0,0,0,0.7);` +
    `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;` +
    `will-change:transform,opacity;overflow:hidden;`;

  // Aura-Schimmer hinter dem Emoji
  const aura = document.createElement("div");
  aura.style.cssText =
    `position:absolute;left:50%;top:42%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;` +
    `background:radial-gradient(circle, ${glow}66, transparent 68%);filter:blur(4px);`;
  card.appendChild(aura);

  const icon = document.createElement("div");
  icon.textContent = data.emoji || (isMinion ? "⚔️" : "✨");
  icon.style.cssText = `position:relative;font-size:96px;line-height:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.8));`;
  card.appendChild(icon);

  const nameEl = document.createElement("div");
  nameEl.textContent = data.name;
  nameEl.style.cssText =
    `position:relative;${cssFont(900, 17)}color:#f3e9d6;text-align:center;padding:0 10px;` +
    `text-shadow:0 2px 6px rgba(0,0,0,0.95);letter-spacing:0.04em;line-height:1.1;`;
  card.appendChild(nameEl);

  const kindLabel = document.createElement("div");
  kindLabel.textContent = data.kind === "attack" ? "TÖDLICHER ANGRIFF" : data.kind === "power" ? "HELDENKRAFT" : "ZAUBER";
  kindLabel.style.cssText =
    `position:relative;${cssFont(700, 10)}color:${accent};letter-spacing:0.22em;text-transform:uppercase;opacity:0.9;`;
  card.appendChild(kindLabel);

  // Angriffs-Badge nur beim Diener-Angriff
  if (data.kind === "attack" && typeof data.attack === "number") {
    const badge = document.createElement("div");
    badge.textContent = `⚔ ${data.attack}`;
    badge.style.cssText =
      `position:absolute;left:10px;bottom:10px;${cssFont(900, 18)}color:#ffd089;` +
      `text-shadow:0 2px 5px rgba(0,0,0,0.95);`;
    card.appendChild(badge);
  }

  // Glanz-Sweep
  const shine = document.createElement("div");
  shine.style.cssText =
    `position:absolute;top:-40%;left:-60%;width:60%;height:180%;transform:rotate(20deg);` +
    `background:linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);`;
  card.appendChild(shine);
  shine.animate(
    [{ transform: "translateX(0) rotate(20deg)" }, { transform: "translateX(360%) rotate(20deg)" }],
    { duration: 900, delay: 650, easing: "ease-in-out" }
  );

  return card;
}

export function playFinisherCinematic(
  data: FinisherCinematicData,
  opts: { onImpact?: () => void } = {}
): Promise<void> {
  return new Promise<void>((resolve) => {
    const root = getRoot();
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;inset:0;z-index:4;pointer-events:none;";
    root.appendChild(wrap);

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)); };
    const cleanup = () => { timers.forEach(clearTimeout); wrap.remove(); resolve(); };

    // Verdunkelung
    const veil = document.createElement("div");
    veil.style.cssText = "position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 45%, rgba(6,5,8,0.78), rgba(0,0,0,0.92));";
    wrap.appendChild(veil);
    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out", fill: "forwards" });

    // Reduced-Motion: Kurzfassung
    if (reduceMotion()) {
      const card = buildFinisherCard(data);
      wrap.appendChild(card);
      at(700, () => { opts.onImpact?.(); screenFlash(1); });
      at(1900, cleanup);
      return;
    }

    // Opfer-Wappen unten
    const plate = document.createElement("div");
    plate.style.cssText =
      `position:absolute;left:50%;top:80%;transform:translate(-50%,-50%);` +
      `display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0;`;
    const plateSkull = document.createElement("div");
    plateSkull.textContent = "🛡️";
    plateSkull.style.cssText = "font-size:54px;filter:drop-shadow(0 0 14px rgba(0,0,0,0.8));";
    const plateName = document.createElement("div");
    plateName.textContent = data.victimName;
    plateName.style.cssText = `${cssFont(900, 20)}color:#cdd3da;letter-spacing:0.08em;text-shadow:0 2px 8px rgba(0,0,0,0.9);`;
    plate.appendChild(plateSkull);
    plate.appendChild(plateName);
    wrap.appendChild(plate);
    plate.animate([{ opacity: 0, transform: "translate(-50%,-30%)" }, { opacity: 1, transform: "translate(-50%,-50%)" }], { duration: 500, delay: 200, easing: "ease-out", fill: "forwards" });

    // Karte herein + praesentieren
    const card = buildFinisherCard(data);
    wrap.appendChild(card);
    card.animate(
      [
        { transform: "translateY(120px) scale(0.4) rotate(-14deg)", opacity: 0 },
        { transform: "translateY(-10px) scale(1.12) rotate(3deg)", opacity: 1, offset: 0.35 },
        { transform: "translateY(0px) scale(1) rotate(0deg)", opacity: 1, offset: 0.5 },
        { transform: "translateY(-8px) scale(1.02) rotate(-1.5deg)", opacity: 1, offset: 0.74 }, // sanftes Schweben
        { transform: "translateY(0px) scale(1) rotate(1deg)", opacity: 1, offset: 1 },
      ],
      { duration: 1500, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
    );

    const STRIKE = 1700; // ab hier Slow-Mo-Schlag

    // Ausholen + Stoss/Feuer in Zeitlupe
    at(STRIKE, () => {
      const cardRect = card.getBoundingClientRect();
      const plateRect = plate.getBoundingClientRect();
      const cx = cardRect.left + cardRect.width / 2;
      const cy = cardRect.top + cardRect.height / 2;
      const px = plateRect.left + plateRect.width / 2;
      const py = plateRect.top + plateRect.height / 2;

      if (data.kind === "attack") {
        // Diener stoesst in Zeitlupe nach unten zum Wappen
        const dx = px - cx;
        const dy = py - cy;
        card.animate(
          [
            { transform: "translate(0,0) scale(1) rotate(1deg)" },
            { transform: `translate(${-dx * 0.12}px, ${-dy * 0.12}px) scale(1.06) rotate(-6deg)`, offset: 0.34 }, // Ausholen
            { transform: `translate(${dx * 0.62}px, ${dy * 0.62}px) scale(1.18) rotate(8deg)`, offset: 0.92 }, // langsamer Stoss
            { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(1.14) rotate(6deg)`, offset: 1 },
          ],
          { duration: 1150, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" }
        );
      } else {
        // Zauber/Heldenkraft: grosses Geschoss zieht in Zeitlupe von der Karte zum Wappen
        const proj = document.createElement("div");
        const def = ELEMENTS[data.element] || ELEMENTS.arcane;
        proj.textContent = data.emoji || "✨";
        proj.style.cssText =
          `position:absolute;left:${cx}px;top:${cy + 60}px;transform:translate(-50%,-50%);font-size:46px;` +
          `filter:drop-shadow(0 0 18px ${def.colors[0]});`;
        wrap.appendChild(proj);
        const a = proj.animate(
          [
            { left: `${cx}px`, top: `${cy + 60}px`, opacity: 0, transform: "translate(-50%,-50%) scale(0.5) rotate(0deg)" },
            { opacity: 1, offset: 0.2 },
            { left: `${px}px`, top: `${py}px`, opacity: 1, transform: "translate(-50%,-50%) scale(1.3) rotate(540deg)" },
          ],
          { duration: 1050, easing: "cubic-bezier(.5,.1,.6,1)", fill: "forwards" }
        );
        a.onfinish = () => proj.remove();
      }
    });

    // Aufprall: Burst + Schadenszahl + Boom-Sound
    const IMPACT = STRIKE + 1080;
    at(IMPACT, () => {
      const plateRect = plate.getBoundingClientRect();
      const px = plateRect.left + plateRect.width / 2;
      const py = plateRect.top + plateRect.height / 2;
      spellCast(px, py, data.element);
      impactBurst(px, py);
      shakeElement(plate, true);
      opts.onImpact?.();

      // Riesige Schadenszahl
      const dmg = document.createElement("div");
      dmg.textContent = `-${data.damage}`;
      dmg.style.cssText =
        `position:absolute;left:${px}px;top:${py - 30}px;transform:translate(-50%,-50%);` +
        `${cssFont(900, 88)}color:#ff5a4a;text-shadow:0 4px 16px rgba(0,0,0,0.95),0 0 28px rgba(255,40,40,0.9);will-change:transform,opacity;`;
      wrap.appendChild(dmg);
      const da = dmg.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.3)", opacity: 0 },
          { transform: "translate(-50%,-70%) scale(1.25)", opacity: 1, offset: 0.3 },
          { transform: "translate(-50%,-120%) scale(1.05)", opacity: 0 },
        ],
        { duration: 1300, easing: "cubic-bezier(.2,.8,.3,1)" }
      );
      da.onfinish = () => dmg.remove();
    });

    // Tod: Wappen zerschellt + epische Explosion + Titel
    const DEATH = IMPACT + 220;
    at(DEATH, () => {
      heroDeathExplosion(plate);
      plate.animate(
        [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(-50%,-30%) scale(0.6) rotate(12deg)", opacity: 0 }],
        { duration: 700, easing: "ease-in", fill: "forwards" }
      );
      plateSkull.textContent = "💀";
      // Karte abrauchen
      card.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translateY(-20px) scale(0.92)" }],
        { duration: 700, easing: "ease-in", fill: "forwards" }
      );

      const title = document.createElement("div");
      title.textContent = "VERNICHTET";
      title.style.cssText =
        `position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);` +
        `${cssFont(900, 64)}color:#fff;letter-spacing:0.12em;` +
        `text-shadow:0 0 24px rgba(255,40,40,0.95),0 4px 18px rgba(0,0,0,0.95);will-change:transform,opacity;`;
      wrap.appendChild(title);
      title.animate(
        [
          { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: 0.25 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: 0.78 },
          { transform: "translate(-50%,-50%) scale(1.04)", opacity: 0 },
        ],
        { duration: 1500, easing: "cubic-bezier(.2,.8,.3,1)" }
      );
    });

    // Abblende + Ende
    const END = DEATH + 1500;
    at(END - 450, () => {
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: "ease-in", fill: "forwards" });
    });
    at(END, cleanup);
  });
}

// Zauber-Aufruf an einer Position: roter Runenkreis + Pentagramm + Element-Partikel.
export function spellCast(cx: number, cy: number, element: SpellElement): void {
  if (reduceMotion()) return;
  const def = ELEMENTS[element] || ELEMENTS.arcane;
  runeCircle(cx, cy, def.rune);
  emitParticles(cx, cy, def);
}

// Fliegendes Projektil von Quelle zu Ziel (Komet/Geschoss, Pfeil-Variante fuer
// Held-Schuesse). Beim Aufprall loest es den Zauber-Effekt (Runenkreis+Partikel) aus.
export function castProjectile(
  fromEl: HTMLElement | null,
  toEl: HTMLElement | null,
  element: SpellElement,
  arrow = false
): void {
  const at = toEl ? toEl.getBoundingClientRect() : null;
  // Fallback: ohne saubere Quelle/Ziel direkt den Effekt am Ziel zeigen.
  if (reduceMotion() || !fromEl || !toEl || !at) {
    if (at) spellCast(at.left + at.width / 2, at.top + at.height / 2, element);
    return;
  }
  const af = fromEl.getBoundingClientRect();
  const x0 = af.left + af.width / 2;
  const y0 = af.top + af.height / 2;
  const x1 = at.left + at.width / 2;
  const y1 = at.top + at.height / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);

  const def = ELEMENTS[element] || ELEMENTS.arcane;
  const head = arrow ? "#efe6cf" : def.colors[0];
  const tail = arrow ? "#8a8470" : def.colors[1];
  const len = arrow ? 36 : 26;
  const thick = arrow ? 3 : 9;

  const root = getRoot();
  const p = document.createElement("div");
  p.style.cssText =
    `position:absolute;left:${x0}px;top:${y0}px;width:${len}px;height:${thick}px;` +
    `margin:${-thick / 2}px 0 0 ${-len / 2}px;border-radius:${thick}px;` +
    `background:linear-gradient(90deg, transparent, ${tail} 42%, ${head});` +
    `box-shadow:0 0 12px ${head};`;
  root.appendChild(p);

  const dur = Math.max(220, Math.min(520, dist * 0.85));
  const anim = p.animate(
    [
      { transform: `rotate(${ang}rad) translateX(0px)`, opacity: 0.4 },
      { transform: `rotate(${ang}rad) translateX(${dist * 0.12}px)`, opacity: 1, offset: 0.12 },
      { transform: `rotate(${ang}rad) translateX(${dist}px)`, opacity: 1 },
    ],
    { duration: dur, easing: "cubic-bezier(.4,0,.7,1)" }
  );
  anim.onfinish = () => {
    p.remove();
    spellCast(x1, y1, element);
  };
  anim.oncancel = () => p.remove();
}
