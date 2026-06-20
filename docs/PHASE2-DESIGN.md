# Marcgard Phase 2 — Design & Build-Plan

Reskin von generischem Slate/Amber zu dunkel-nordischem Look (Schnee, Raben, Fenrir, Kriegstrommeln, Seher-Tarot). Stack: React 19 + Vite + TS + Tailwind 4. Projekt: `/Users/hhaev/Krimi/marcstone/`.

Drei Stimmungen tragen das Brett: **das Kalte** (Frost/Nacht, Default), **das Heisse** (Blut/Glut, Aktion+Gefahr), **das Heilige** (Bronze/Runen, Wertigkeit).

---

## 1. Design-System (final, keine Auswahl offen)

### 1.1 Palette (Tailwind-4 `@theme`-Tokens)

| Token | HEX | Einsatz |
|---|---|---|
| `--color-mg-void` | `#0A0C10` | Tiefster Hintergrund, Karten-Art-Fenster |
| `--color-mg-night` | `#10141C` | Haupt-App-Hintergrund |
| `--color-mg-slate` | `#1B212C` | Panel-Flächen, Spielbrett |
| `--color-mg-slate-raised` | `#252D3A` | Erhöhte Karten/Buttons, Hover |
| `--color-mg-stone` | `#3A4452` | Stein-Rahmen, Borders, Trenner |
| `--color-mg-stone-light` | `#586272` | Stein-Highlight-Kante (fake-3D oben/links) |
| `--color-mg-fog` | `#9AA6B6` | Sekundär-Text, gedämpfte Labels |
| `--color-mg-frost-text` | `#E8EDF4` | Primär-Text (kaltweiss) |
| `--color-mg-blood` | `#8E1B1B` | Blut-Rot Basis (Marc-Karten, Angriff, Damage) |
| `--color-mg-blood-bright` | `#C0392B` | Blut-Rot hell (Hover rote Elemente) |
| `--color-mg-ember` | `#FF5A2D` | Glut-Orange (Zündschnur-Funke, Crit, Marc-Glow) |
| `--color-mg-bronze` | `#B0843B` | Bronze/Gold (Runen-Rahmen, Mana, Wert-Zahlen) |
| `--color-mg-bronze-bright` | `#E6B358` | Bronze-Highlight (aktive Auswahl) |
| `--color-mg-frost` | `#5FA8D6` | Frost-Blau (Schnee, Eis, Seher/Magie) |
| `--color-mg-frost-deep` | `#2E5E8A` | Tiefes Eis-Blau (Magie-Glow-Schatten) |
| `--color-mg-rune-glow` | `#7FE3C0` | Mystisches Runen-Türkis (aktive Runen, Seher-Energie) |
| `--color-mg-danger` | `#E03131` | Reine Gefahr (niedrige HP, Timer-Endphase) |
| `--color-mg-poison` | `#6BBF59` | Gift/Fluch-Status (Marcs Fluch) |

**Entscheidungs-Faustregeln (verbindlich):**
- Default = kalt (Schiefer + Frost). Rot/Glut nur bei Aktion, Gefahr, Marc-Karten. Das macht rote Momente teuer und dramatisch.
- Bronze/Gold NUR für Wertigkeit (Mana, Werte, Runen-Rahmen, legendär). Nie als Flächenfarbe (kein alter Amber-Look). Sparsam = wertvoll.
- Marc-Karten brechen die Regel bewusst: glühen blut-rot + ember im Ruhezustand, fühlen sich „falsch mächtig" an.

### 1.2 Fonts (final entschieden)

**Cinzel** (Display/Titel) + **Pirata One** (nur Marc/Fluch) + **Spectral** (Body). Drei Fonts, klare Hierarchie. Cinzel statt MedievalSharp, weil Henrys Brief „modern, schick, krass" ist — Cinzel ist edel-gemeisselt, MedievalSharp zu roh.

```css
/* index.css, ganz oben */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Pirata+One&family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
```
```css
@theme {
  --font-display: "Cinzel", ui-serif, Georgia, serif;
  --font-rune: "Pirata One", "Cinzel", serif;
  --font-body: "Spectral", ui-serif, Georgia, serif;
}
```
- `font-display`: Logo, Karten-Namen, Panel-Headlines, Timer-Zahlen, Werte.
- `font-rune`: NUR Marc-Karten-Namen + Boss/Fluch-Momente.
- `font-body`: Default auf `body`, Chat, Tooltips, Mechanik-Text.

### 1.3 UI-Bausteine (Leitprinzip: gemeisselt + schwer, nicht flach)

Fake-3D über Doppel-Border (helle Kante oben/links, Schatten unten/rechts), nicht über billigen `box-shadow`-Blur.

**Panel:**
```
bg-mg-slate border border-mg-stone rounded-md
shadow-[inset_0_1px_0_rgba(88,98,114,0.4),inset_0_-2px_6px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.5)]
```
Header in `font-display text-mg-bronze` mit Runen-Trenner darunter. Optional rote Knotwork-Ecken (Cartoon-Pack) als `absolute` in den 4 Ecken.

**Karte (Tarot-Hochformat 2:3):**
```
aspect-[2/3] rounded-lg bg-gradient-to-b from-mg-slate-raised to-mg-slate
border-2 border-mg-stone
shadow-[inset_0_0_0_1px_rgba(176,132,59,0.25),0_6px_16px_rgba(0,0,0,0.7)]
hover:border-mg-bronze hover:-translate-y-1 transition
```
- Art-Fenster: Emoji auf `bg-mg-void rounded` mit Innen-Schatten (sitzt „in" der Karte).
- Name unten: `font-display text-mg-frost-text` auf schmalem Stein-Band.
- Werte: Mana oben-links Bronze-Kreis, Angriff unten-links (Blut-Rot), HP unten-rechts (Frost-Text auf rotem Schild). Zahlen in `font-display`.
- Rarität-Glow: normal kein Glow; selten `ring-mg-frost/40`; Marc `ring-2 ring-mg-ember shadow-[0_0_24px_rgba(255,90,45,0.5)]` + Puls.

**Marc-Karte (Spezial):**
```
border-mg-blood bg-gradient-to-b from-[#2A0E0E] to-mg-void
font-rune text-mg-ember
shadow-[0_0_30px_rgba(192,57,43,0.55)]
animate-[marcPulse_2.4s_ease-in-out_infinite]
```

**Buttons:**
- *Primär (End Turn) — geschmiedetes Bronze:*
```
font-display uppercase tracking-wider bg-gradient-to-b from-mg-bronze-bright to-mg-bronze
text-mg-void border border-[#7a5a26] rounded
shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_0_#6e521f,0_6px_10px_rgba(0,0,0,0.6)]
active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_0_#6e521f]
```
- *Angriff — Blut-Eisen:*
```
bg-gradient-to-b from-mg-blood-bright to-mg-blood text-mg-frost-text border border-[#5a1010]
shadow-[0_0_14px_rgba(192,57,43,0.45),inset_0_1px_0_rgba(255,120,90,0.3)]
hover:from-mg-ember hover:shadow-[0_0_22px_rgba(255,90,45,0.7)]
```
- *Sekundär (Ghost) — kalter Stein:*
```
bg-mg-slate-raised text-mg-fog border border-mg-stone
hover:border-mg-stone-light hover:text-mg-frost-text
```

**Trenner:** dünne Bronze-Linie + Stein-Glyph mittig (kein simples `<hr>`).

**Status-Icons:** `mask-image`-Pattern für Ein-Datei-pro-Glyph, Farbe per `bg-*`-Klasse je Zustand:
```jsx
<span className="inline-block w-6 h-6 bg-mg-bronze"
  style={{ WebkitMaskImage:`url(/assets/glyphs/flame.png)`, WebkitMaskSize:'contain', maskImage:`url(/assets/glyphs/flame.png)` }} />
```

---

## 2. Asset-Map

Library: `/Users/hhaev/Krimi/Crimino.library/`. Stein-Pack ist monochrom-grau → per CSS `filter`/`mask`-Tint einfärben. Cartoon-Pack ist schon blut-rot → fast direkt nutzbar. Beim programmatischen Einlesen `License Agreement.txt` (ext == txt) rausfiltern.

### 2.1 Spiel-Icons (Stein-Pack `M48VKWHATT8OR`)

| Keyword | Item-ID | filePath | Hinweis |
|---|---|---|---|
| Angriff | `M48VKXGOCNGR4` | `…/M48VKXGOCNGR4.info/111.png` | Schwert. Default-Angriff. |
| Angriff (böser) | `M48VKXGLOJZHG` | `…/M48VKXGLOJZHG.info/046.png` | Langschwert, schärfer. |
| Tod | `M48VKXGO8K472` | `…/M48VKXGO8K472.info/197.png` | Totenkopf + Knochen. Top-Match. |
| Zauber | `M48VKXGOUJ0BS` | `…/M48VKXGOUJ0BS.info/198.png` | Blitz/Energie-Bolt. |
| Zauber (Feuer) | `M48VKXGPIHTM2` | `…/M48VKXGPIHTM2.info/199.png` | Flamme, auch Feuer-Effekt. |
| Ansturm | `M48VKXGOX4VJJ` | `…/M48VKXGOX4VJJ.info/104.png` | Stachel-Schwert = Tempo. |
| Ansturm (alt) | `M48VKXGOK5FSZ` | `…/M48VKXGOK5FSZ.info/106.png` | Blut-tropfende Klinge. |
| Spott | `M48VKXGLZINU5` | `…/M48VKXGLZINU5.info/048.png` | Mjölnir-Hammer = „halte stand". Bester Annäherungswert (kein Schild im Pack). |

(Pfad-Prefix überall: `/Users/hhaev/Krimi/Crimino.library/images/`)

### 2.2 Runentafeln (Rune-Pack `M48VKWGZQ88TZ`) — für HUD-Symbole, die im Stein-Pack fehlen

Stein-Pack hat KEIN Herz/Schild/Mana-Kristall. Entscheidung: dafür Runentafeln nehmen, eingefärbt über Glow-Variante — sauberer als ein erzwungenes Stein-Icon.

| Keyword | Item-ID | filePath | Logik |
|---|---|---|---|
| Mana | `M48VKXGREHHIE` | `…/M48VKXGREHHIE.info/Z,X,Y,-R Ice Rune.png` | Ice-Rune (blauer Glow) = arkane Energie. |
| Gottesschild | `M48VKXGRAA7VC` | `…/M48VKXGRAA7VC.info/Z,X,Y,-R Gold Rune.png` | Gold-Glow = geweiht/göttlich. |
| Leben | Eigenes Herz-Emoji ❤ behalten | — | Schwächstes Pack-Match (Biohazard wirkt falsch). Emoji schlägt erzwungenes Icon. |

### 2.3 Logo + Trenner

**Logo „MARCGARD":** Runen-Buchstaben in **Gold-Variante** (warmer, edler Glow) zu Wort legen, „Marc"-Akzente (Marcs Fluch, Zorn des Marc) in **Fire-Variante**. Jeder Buchstabe hat PNG + PSD (`Z,X,Y,-R Gold Rune` = `M48VKXGRAA7VC`, `W Gold Rune` = `M48VKXGRBDDY6` etc.). Für das Logo die PSDs in Photoshop/AE nebeneinandersetzen, einmal als `/assets/logo/marcgard.png` (transparent) exportieren — nicht zur Laufzeit 8 Einzel-Glyphen zusammenbauen.

**Trenner:**
- Stein-Kachel `M48VKXGOTFIWZ` → `…/107.info/107.png` — horizontaler Divider.
- Knotwork (Cartoon, blut-rot): Triskele `M48VKXGL0ZXIY` (`/50.png`), Knoten-Set `M48VKXGLQZJS6` (`/49.png`) — Ornament-Trenner zwischen Panels + Ecken-Akzente + Karten-Rückseite.

### 2.4 Asset-Workflow

1. Schlüssel-Assets gezielt kopieren (nicht alle 350) nach `marcstone/public/assets/`:
   - `assets/glyphs/` — die 8 Stein-Icons aus 2.1 (umbenannt zu sprechenden Namen: `attack.png`, `death.png`, `spell.png`, `flame.png`, `charge.png`, `taunt.png`).
   - `assets/runes/` — Ice/Gold-Runentafel + Logo.
   - `assets/ornaments/` — Knotwork-Triskele + Knoten-Set + Stein-Kachel-Trenner.
2. Stein-Glyphen bleiben grau-PNG → im Spiel via `mask-image` + `bg-*` eingefärbt (kein Re-Export nötig, beste Theming-Kontrolle pro Zustand: Frost-Icon `bg-mg-frost`, Fluch `bg-mg-blood`).
3. Cartoon-Knotwork direkt als `<img>` (schon rot), optional `opacity-[0.08]` als Wasserzeichen hinter Panels.

### 2.5 Sounds (alle lokal als MP3 bündeln, nicht zur Laufzeit fetchen)

Entscheidung: **nur Pixabay-Files** nehmen → keine Attribution nötig, keine CC-BY-Falle. Alles nach `marcstone/public/audio/`.

| Slot | Datei/URL | Lizenz |
|---|---|---|
| Hintergrundmusik (Loop) | Dark Fantasy Ambient (Dungeon Synth), DeusLower — https://pixabay.com/music/ambient-dark-fantasy-ambient-dungeon-synth-248213/ | Pixabay, keine Nennung |
| Kriegstrommel (Loop, bei niedrigem Timer hochfahren) | Horde War Drums loop 130bpm — https://pixabay.com/sound-effects/horde-war-drums-loop-130bpm-342956/ | Pixabay |
| Wasser-Ambiente (Loop) | Water Stream / River Flow Loop — https://pixabay.com/sound-effects/water-stream-river-flow-loop-111889/ | Pixabay |
| Rabe (on-demand bei Raben-Spawn) | Crow/Raven-Sammlung — https://pixabay.com/sound-effects/search/crow%20raven/ | Pixabay |
| Wolf/Fenrir (on-demand, seltenes Event) | Wolf howl 6310 — https://pixabay.com/sound-effects/wolf-howl-6310/ | Pixabay |

Trotzdem `CREDITS.md` im Repo anlegen + jede Datei eintragen (Quelle + Lizenz), Hygiene. Reine Pixabay-Auswahl = keine In-Game-Nennung nötig.

---

## 3. Atmosphäre / Effekte

Alles in EINER Komponente `<Atmosphere />` kapseln, `position:fixed; pointer-events:none`. EIN `requestAnimationFrame`-Loop für alle Canvas-Partikel (Schnee + Raben), `prefers-reduced-motion` respektieren, Canvas auf `devicePixelRatio` skalieren (Retina-Mac sonst matschig).

**Z-Index-Reihenfolge (hinten → vorn):** Hintergrund (Aurora) → Nebel → Vignette → Spielbrett/Karten → Schnee+Raben-Canvas → Zündschnur-Timer-UI.

### 3.1 Schnee — `<canvas>`, 1 Loop
200 Flocken, `ctx.globalAlpha` für Tiefe, Seitwärts-Drift über `sin`. (Code-Vorlage aus Recherche, direkt übernehmbar.) Alternative tsparticles `@tsparticles/preset-snow` nur falls Eigenbau zickt — aber Eigenbau bevorzugt, weil das Canvas eh für Raben gebraucht wird.

### 3.2 Raben — Emoji/Sprite im selben Canvas-Loop, getriggert
Nicht dauerhaft. Spawn alle 20-40 Sek ODER bei „Marc"-Karte gespielt. Diagonal über den Screen, Auf/Ab per `sin` (Flügelschlag-Gefühl), beim Spawn `playSound('raven')`. Erst Emoji `🐦‍⬛`, später 3-4-Frame-Sprite-Sheet (schwarze Silhouette, transparent) für echtes Flügelschlagen.

### 3.3 Nebel + Vignette — reines CSS/SVG, null JS-Last
Zwei fixed Layer. Vignette = `radial-gradient` dunkle Ränder. Nebel = zwei weiche Gradient-Wolken, `animation: fogDrift 40s infinite alternate`. SVG-`feTurbulence`-Noise als späteres Upgrade, erst Gradient bauen.

### 3.4 Brennende Zündschnur-Timer — SVG-Pfad + `stroke-dashoffset`
Der saubere Weg, kein fertiges Paket existiert (Eigenbau):
- Zündschnur = SVG-`<path>`, Länge per `getTotalLength()`, `stroke-dasharray` = Gesamtlänge, `stroke-dashoffset` über Restzeit hochzählen → Linie „verschwindet" von vorne.
- Flamme = Element auf `path.getPointAtLength()`, sitzt exakt auf dem schrumpfenden Punkt.
- Glüh-Asche = zweiter `<path>`, `stroke:#FF5A2D`, `filter: drop-shadow(0 0 6px var(--color-mg-ember))`, kurzes wanderndes dash-Segment.
- Funken = kurzlebige Canvas-Partikel am Flammenpunkt.
- Letzte ~15%: `.panic`-Klasse → schnelleres Flackern, Funke wechselt zu `mg-danger`, Screen-Vignette pulst rot, Kriegstrommel-Gain hoch. `width`/`progress` aus dem bestehenden Server-Timer.

### 3.5 Komponenten-Wahl (genutzt vs. selbst)

| Effekt | Quelle | Entscheidung |
|---|---|---|
| Menü-Hintergrund | 21st.dev **Aurora Waves** (https://21st.dev/community/components/ruixenui/aurora-waves/default) | Nutzen — Nordlicht, CSS-only, kein WebGL. Auf kaltes Blau/Violett/Grün stellen. |
| Schnee | Eigenbau-Canvas (siehe 3.1) | Eigenbau, da Canvas eh da. tsparticles-Snow nur Fallback. |
| Karten-Tilt | **Aceternity 3D Card Effect** (https://ui.aceternity.com) | Nutzen — echtes Z-Layering, bester Tarot-Tilt. Gratis/MIT. |
| Karten-Flip (Ziehen) | 21st.dev **Card Flip** Kategorie | Nutzen für Draw-Animation. |
| Buttons-Glow | **Magic UI ShimmerButton + BorderBeam** (https://magicui.design) | Nutzen — Gold/Eisblau, MIT, copy-paste. |
| Marc-Karten-Glow | 21st.dev **Fancy Card** | Nutzen — blutrot/golden Rarität. |
| Hover-Spotlight | 21st.dev **Spotlight Background** | Optional — hebt gehoverte Karte aus dem Dunkel. |
| Fluch-Overlay | 21st.dev **Bloodline** | Nutzen bei Fluch-Karte ausspielen. |
| Nebel/Vignette/Raben/Zündschnur | Eigenbau (3.2-3.4) | 21st.dev deckt diese NICHT ab. |
| Audio | **howler.js** ODER Web Audio API direkt | Web Audio mit `GainNode` pro Kategorie (Musik/Ambiente/FX) — der bestehende `src/utils/audio.ts` wird ausgebaut, kein howler nötig. |

Audio-Regeln: Loops `loop=true`, FX on-demand. Autoplay-Sperre → Audio erst nach erstem User-Klick („Spiel starten"). Trommel-Gain bei < 5 Sek via `gain.gain.linearRampToValueAtTime()` hochziehen (koppelt an `.panic` aus 3.4).

---

## 4. Implementierungs-Reihenfolge

Reihenfolge bewusst: erst Tokens+Fonts (alles andere hängt dran), dann globale Atmosphäre (sofortiger „weg-vom-KI-Grau"-Effekt), dann Lobby, dann Brett/Karten, zuletzt Sound+Effekt-Feinschliff.

**Schritt 1 — Design-Tokens + Fonts**
Datei: `src/index.css`
- `@import` Google Fonts (1.2) ganz oben.
- `@theme`-Block mit allen Farb-Tokens (1.1) + Font-Tokens.
- `body` auf `bg-mg-night text-mg-frost-text font-body` setzen.
- `@keyframes marcPulse`, `fogDrift`, `snow` definieren.
- Build prüfen: `npm run dev` läuft, Klassen `bg-mg-night` etc. greifen.

**Schritt 2 — Assets bereitstellen**
- Eagle-Items aus Abschnitt 2 nach `public/assets/{glyphs,runes,ornaments,logo}/` kopieren (umbenennen wie 2.4).
- Sounds (2.5) nach `public/audio/` laden.
- `CREDITS.md` im Repo-Root anlegen.

**Schritt 3 — Globale Atmosphäre**
Neue Datei: `src/components/Atmosphere.tsx` (Schnee+Raben-Canvas, Nebel, Vignette, Aurora-Wrapper).
Datei: `src/App.tsx` — `<Atmosphere />` als erstes Kind im Root rendern, hinter dem Spiel-Layer (z-index). `prefers-reduced-motion`-Guard.

**Schritt 4 — Lobby reskinnen**
Datei: `src/components/Lobby.tsx`
- Aurora-Hintergrund (21st.dev) einsetzen.
- Logo `assets/logo/marcgard.png` + Untertitel `font-display`.
- Buttons → ShimmerButton (Gold) + Ghost-Stein-Variante.
- Panels nach 1.3-Stil, Knotwork-Ecken.

**Schritt 5 — Spielbrett (App-Layout)**
Datei: `src/App.tsx`
- Board-Flächen `bg-mg-slate` Panel-Stil, Stein-Borders.
- HUD: Mana = Ice-Rune, Leben = Herz-Emoji (rot), `font-display`-Zahlen.
- Chat-Panel: Datei `src/components/ChatPanel.tsx` → `font-body`, Stein-Panel, Knotwork-Sektion-Marker.
- Held-Anzeige: Datei `src/components/HeroState.tsx` → Frost/Blut-HP-Schild.

**Schritt 6 — Karten**
Datei: `src/components/CardItem.tsx`
- Tarot-Form (1.3): Rahmen-Layer, Art-Fenster, Stein-Band-Name.
- Status-Icons via `mask-image` aus `assets/glyphs/` (Angriff/Tod/Zauber/Ansturm/Spott), Farbe je Effekt-Typ.
- 3D-Tilt (Aceternity) auf Hand-Karten.
- Rarität-Glow-Logik (normal/selten/Marc).
- Marc-Karten: `font-rune`, Ember-Glow, `marcPulse`, Bloodline-Overlay-Trigger beim Ausspielen.
- Card-Flip-Animation beim Ziehen.

**Schritt 7 — End-Turn-Button + Timer**
Datei: `src/components/EndTurnButton.tsx` → Bronze-Schmiede-Button (1.3).
Neue Datei: `src/components/FuseTimer.tsx` — SVG-Zündschnur (3.4), an bestehenden Timer-Wert gekoppelt, `.panic`-Phase.

**Schritt 8 — Sound-Layer**
Datei: `src/utils/audio.ts` (existiert, ausbauen)
- Web Audio `GainNode` pro Kategorie (Musik/Ambiente/FX).
- Loops: Musik + Wasser + Trommel. On-demand: `playSound('raven')`, `playSound('wolf')`.
- Init nach erstem User-Klick (Autoplay-Sperre).
- Trommel-Gain-Ramp an Timer-`.panic` koppeln.
- Raben-Spawn (Atmosphere) + Raben-SFX koppeln; Wolf bei seltenem Event.

**Schritt 9 — Feinschliff**
- Marc-Karte spielen → Raben-Schwarm + Bloodline-Overlay + Ember-Puls gemeinsam triggern (Optik+Sound = Druck).
- `prefers-reduced-motion` final durchtesten.
- Performance: ein rAF-Loop bestätigen, Aurora+Shader-Last auf dem Mac prüfen.

---

**Berührte Dateien gesamt:** `src/index.css`, `src/App.tsx`, `src/components/{Lobby,ChatPanel,HeroState,CardItem,EndTurnButton}.tsx`, `src/utils/audio.ts` + neu `src/components/Atmosphere.tsx`, `src/components/FuseTimer.tsx`. Assets nach `public/assets/` + `public/audio/`, plus `CREDITS.md`.

**Offene technische Risiken:** (1) Stein-Glyphen sind hell-grau auf weissem/transparentem Grund — `mask-image` umgeht das Recolor-Problem komplett, deshalb diese Lösung statt `mix-blend-mode`-Glücksspiel. (2) WebGL-Aurora/Shader dauerlaufend = Performance im Auge behalten, notfalls Aurora auf CSS-only-Variante (ist im gewählten Component schon CSS). (3) Logo besser einmal als PSD→PNG exportieren statt 8 Runen-Glyphen zur Laufzeit positionieren.
