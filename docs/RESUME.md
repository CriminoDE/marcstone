# Marcgard - RESUME (hier weitermachen)

**Wenn Henry sagt "weiter marcgard": ZUERST dieses Dokument lesen, dann `docs/PROJECT-PLAN.md` + `docs/VISION-PHASE2-3.md` + `docs/LORE.md`.**

## Was ist das
Marcgard = Browser-Kartenduell (Hearthstone-artig), 1v1 online ueber Link, fuer Henry + Bruder Marc. Spass-Projekt, nicht kommerziell. Dunkel-nordisches Setting (Wikinger/Hexen/Seher, GoT-Ton, nicht kindisch).

## Wo es laeuft
- **Live:** https://marcgard.onrender.com (umgezogen 2026-06-20; alter Service marcstone geloescht. Domain marcgard.de/.com ist frei, spaeter draufsetzen.)
- **Repo:** GitHub `CriminoDE/marcstone` (public, Name bleibt marcstone), lokal `/Users/hhaev/Krimi/marcstone`. Arbeit direkt auf `main`.
- **Hosting:** Render, Service `srv-d8qu8s6rnols73ellus0`, Team `tea-d8qsj3ernols73ejngkg`, Gratis-Plan.
- **WICHTIG Free-Tier:** Nur EINE aktive Free-Web-Instanz pro Account. Kein zweiter Render-Service parallel, sonst bekommt einer `no-server`. Deshalb wurde der alte Service geloescht statt behalten.
- **Stack:** React 19 + Vite + TS + Tailwind 4 Frontend, Node + Express + WebSocket (`ws`) Backend (`server.ts`). State im RAM (keine DB bis Phase 4).

## Deploy-Workflow (WICHTIG)
1. Aendern, dann `npm run lint` + `npm run build` (muss gruen sein).
2. `git add -A && git commit && git push origin main`.
3. Deploy ausloesen per Render-API:
   `curl -sS -X POST "https://api.render.com/v1/services/srv-d8qu8s6rnols73ellus0/deploys" -H "Authorization: Bearer <RENDER_KEY>" -H "Content-Type: application/json" -d '{"clearCache":"do_not_clear"}'`
4. Status pollen bis "live", dann live verifizieren (Titel/health/ws-Test).
- **RENDER_KEY:** Henry hat ihn (Key-Name "marcgard"). Wird NICHT gespeichert -> in neuer Session Henry danach fragen, wenn ein Deploy ansteht.
- Wach-Ping laeuft als GitHub-Action (`.github/workflows/keepalive.yml`), RENDER_URL als gh-Repo-Variable.

## Testen ohne zweiten Spieler
Raum erstellen -> Warteraum -> "Uebungsgegner hinzufuegen" -> lokaler Bot "Holgar" (kein Gemini, kostenlos). WS-Testskripte: `/tmp/wstest.mjs` (Reconnect), `/tmp/bottest.mjs` (Bot) - bei Bedarf neu schreiben.

## STAND (Stand: 2026-06-22, **v2.16 (Original-IP-Umbau) LIVE auf https://marcgard.onrender.com** - Commit ac5418b, deployed (dep-d8sp71p) + verifiziert: health 200, Live-JS sha256-identisch mit Build, 0 Blizzard-Namen im Bundle, WS ok. Vorher v2.15 = 0ff4d13.)

### v2.16 - Original-IP-Umbau (WICHTIG: Spiel ist jetzt blizzard-frei, oeffentlich zeigbar)
- **Alle HS-abgeleiteten Anzeigenamen raus.** ~26 Kartennamen + 10 Heldenkraefte + Keyword-Begriffe (Gottesschild->Runenschild, Kampfschrei->Schlachtruf, Todesroecheln->Grabhauch) auf eigene dunkel-nordische Begriffe. Silver Hand->Klingenknappe. Server-Logs/Lobby/Forge mitgezogen.
- ⚠️ **NUR Anzeige-Strings.** `templateId`s (z.B. "fireball","sylvanas","ragnaros" lowercase) + Werte + Effekte + komplette Logik UNVERAENDERT. Logik haengt an templateId, nicht am Namen. Code-Kommentare nennen teils noch HS-Namen (intern, egal).
- Henry-Entscheidung 2026-06-22: Umbenennen + gleiche Werte = legal sauber (Mechanik/Zahlen nicht schuetzbar, nur Ausgestaltung). Spaeter geplant: **Azteken-Update** (wenn Henry in Mexiko) mit Quetzalcoatl etc.
- Verifiziert: lint+build gruen, headless 3/3 Sieg, 0 Crashes/Errors, neue Namen in Logs.
- **Offen/spaeter:** Code-Kommentare entblizzarden (kosmetisch), Klassennamen (Mage/Priest/Hunter/Paladin sind generisch, ok) evtl. nordisch umlabeln (Seher/Skalde/Jaeger/Schildwart). Icons/Art = Polishing (Henry hat ChatGPT-API-Key fuer transparente Icon-Generierung angeboten; Eagle-Lib hat schon welche).

### v2.15 - Karten-Wave (Bann + Heldenkraft-Wandel + Bedrohungen)
- **4 Karten:** `m_runeshift` Runen-Wandel (2M Zauber: Heldenkraft +1 mod 3 + heroPowerUsed=false = sofort wieder bereit; die Wunschlisten-Karte), `m_bann` Marcs Bann (3M zielbar: verbannt Feind-Diener per splice = KEIN Todesroecheln), `nidhogg` Nidhoegg (6M 5/5, Todesroecheln 5 an Feind-Held), `valkyrie` Walkuere (5M 4/5 Spott, Kampfschrei: andere eigene Diener +1/+1).
- Verdrahtet: Duell PLAY_CARD + botPlaySpell + resolveBattlecry + fireDeathrattle, FFA resolveFfaSpell + resolveFfaBattlecry + FFA-Bot (m_bann wie mind_control auf staerksten Feind-Diener), Client targetSpells + FFA_TARGETED_SPELLS + SPELL_ELEMENT + Kampfschrei-Tooltip-Fix.
- **Verifiziert:** deterministischer Headless-Test (MG_TEST_WAVE-Hook, danach entfernt) - alle 4 feuern (Runen-Wandel auch beim Bot), 0 liegende Diener, 0 Crashes. Normal-Mode sauber. lint+build gruen.

### v2.14 - Todesroecheln (Deathrattle)
- **Neue Mechanik:** `hasDeathrattle`-Diener feuern beim Tod einen Effekt. Server-zentral: **eine** `reap(room)`-Funktion (in server.ts bei den Finisher-Helfern) ersetzt die ~35 verstreuten `board.filter(health>0)` - sammelt tote Diener auf allen Brettern, feuert `fireDeathrattle`, wiederholt fuer Kettentode. `fireDeathrattle` mutiert direkt (keine Rekursion). Wirkt in Duell + FFA + 2v2 + beide Bots (alle Schadenspfade laufen durch reap).
- **4 Karten:** m_revenant (Tod: 3 an Feind-Held), m_seeress (Tod: Karte ziehen), fenris_brood (Tod: 2x wolf_token 2/2), draugr (Spott, Tod: 2 an alle Feind-Diener). Client: 💀-Chip + Tooltip + Glossar.
- **Verifiziert:** deterministischer Headless-Test (MG_TEST_DR-Hook, danach entfernt) - alle 4 feuern, Welpen erscheinen, Ketten loesen aus, **0 liegende tote Diener**, 0 Crashes. Normal-Mode sauber. lint+build gruen.
- ⚠️ Wenn du am reap-Refactor zweifelst: Test-Hook war `MG_TEST_DR=1` in generateClassDeck (front-laedt DR-Karten) - wurde nach dem Test wieder entfernt, ist NICHT mehr im Code.

### v2.13 (lokal, ungepusht) - Marcs Macht + hellere Handkarten
- **4 neue Marc-Legendaere** (nur bestehende Frameworks, KEIN neues Keyword): `m_wrath` Zorn des Marc (4M Zauber, 4 Schaden an ALLEN Dienern symmetrisch), `m_curse` Marcs Fluch (3M zielbar, halbiert Leben min 3), `m_seer` Marc der Seher (4M 3/4 Kampfschrei: zieh 2, zahl 2 Leben min 1), `fenrir` Fenrir der Endwolf (7M 6/6 Ansturm). In `src/constants.ts` + ALLEN Modi verdrahtet (Duell PLAY_CARD/resolveBattlecry/botPlaySpell, FFA resolveFfaSpell/resolveFfaBattlecry/FFA-Bot-targetedDmg, Client targetSpells+FFA_TARGETED_SPELLS+SPELL_ELEMENT). Headless 16 Spiele vs Bot: 0 Crashes, alle 4 Karten feuern, server-stdout 0 Errors.
- **Handkarten heller (Henry-Wunsch):** `CardItem.tsx` - spielbar `brightness 1.4/saturate 1.4` (war 1.15/1.25), unspielbar `opacity 0.65/brightness 0.82` (war 0.4/0.6), Zauber-Grundflaeche `to-mg-slate` statt `to-mg-void`.
- Patch-Notes v2.13 in Lobby + CHANGELOG + BALANCE-CHANGES (Veto-Tabelle). lint+build gruen.
- **OFFEN: Henry-Spieltest, dann committen + pushen + Render-Deploy.** Danach: Klassensystem-Weiche (siehe unten) + naechste Mechaniken-Wave.

### 🎯 NAECHSTE SESSION: krasse Karten-Wave (Henry-Entscheidungen 2026-06-20 stehen)
**Design-Weichen sind GESTELLT (Henry hat entschieden, nicht mehr neu fragen):**
- ✅ **Todesroecheln (Deathrattle) = GEBAUT in v2.14** (zentrale `reap`-Funktion + 4 Karten, siehe v2.14-Block oben). Lifesteal/Zauberschaden/Windfury bewusst NICHT jetzt - die kommen evtl. in spaeteren Wellen, wenn Henry sie will. Fuer neue Deathrattle-Karten: nur Karte in constants + Branch in `fireDeathrattle` (Duell+FFA teilen sich die Funktion) + Klassen-Liste. Kein Kern-Refactor mehr noetig.
- **Universal-Karten-Pool = ERST mit dem Deckbau (Phase C), NICHT jetzt.** Begruendung Henry/Claude: ohne Deckbau macht ein Universal-Pool alle Klassen wieder ~gleich = undo von v2.9. Kuratierte `STANDARD_CLASS_CARDS` bleiben bis Deckbau existiert. Voll-Hearthstone verworfen.
- **Dann krasse Karten-Wave:** mehr Marc-Legendaere mit Deathrattle (Marcs Bann, Zorn-Reihe, Heldenkraft-Wechsel-Karte). Jede neue Karte = Wiring in Duell (PLAY_CARD/resolveBattlecry/botPlaySpell) + FFA (resolveFfaSpell/resolveFfaBattlecry/FFA-Bot) + Client (targetSpells/FFA_TARGETED_SPELLS/SPELL_ELEMENT) + Glossar bei neuem Keyword, sonst tote Karte (meteor/mind_control-Falle).
- **Account-Setup (Phase C):** Google-OAuth + Profil + Sammlung + Deckbau via EIGENES Supabase-Projekt. **HENRY macht das selbst, Claude fasst Supabase NICHT an.**

### v2.12 LIVE (Commit 0318c45)
- **Glossar** (📖 Button Lobby/Duell/FFA) - `src/components/Glossary.tsx`. **Eis-Optik fancy** (`mg-frost-shimmer`/`mg-frost-pulse` + `frostNova` in combatFx). **Mehr Wikinger-Beleidigungen**. **3 Marc-Karten** (keyword-only, vetobar in docs/BALANCE-CHANGES.md): m_ravens 3M 4/2 Ansturm, m_marksman 4M 5/1 Ansturm, m_warden 4M 4/4 Spott.

### ⭐ OFFENE HENRY-WUENSCHE / BACKLOG (fuer naechste Session - WICHTIG zuerst lesen)
Aus den Live-Playtests gesammelt, nach Prio:
1. ✅ **ERLEDIGT + LIVE in v2.10 - EPISCHER SIEG-/TODES-REPLAY in ZEITLUPE (Henrys grosser Wunsch):** Beim Sieg spielt jetzt ein Zeitlupen-Kino: die toedliche Karte fliegt herein, praesentiert sich gross (Diener-Koerper mit ⚔-Badge oder Zauber-Sigille), holt aus, schlaegt/feuert in Slow-Mo aufs Helden-Wappen, riesige Schadenszahl, dann Todes-Explosion + Boom. Danach Sieg-Screen. Replay-Button "🎬 Todesstoß in Zeitlupe ansehen". Duell + FFA. **Wie gebaut:** Server erfasst `room.finisher` (FinishingBlow in types.ts) an allen Helden-Schaden-Stellen via `activeFx`-Kontext + `recordHeroBlow` (resolveDamage, Duell-ATTACK, ffaHitHero, Battlecries, Bot-Pfade). Client: `playFinisherCinematic` in combatFx.ts, getriggert per Phasen-Transition in App.tsx (Duell) + FfaGame.tsx (FFA). Headless gegen echten Kill-Pfad getestet (Bot toetet via Firelord -> finisher korrekt). Deployed + live verifiziert. **Henry-Feel-Test offen (er spielt drueber).**
2. ✅ **ERLEDIGT + LIVE in v2.11 - 2v2-Team-Modus + FFA-Bots:** Team A vs B auf FFA-Infra. Lobby-Button "2v2 erstellen", Warteraum mit Team-Wahl (A/B) + Bot-Auffuellung (leere Plaetze -> Bots, also ohne 4 echte Leute spielbar: du+Marc vs 2 Bots, du vs Marc je mit Bot-Partner, oder 4 Menschen). Friendly Fire aus (Schaden/Angriff/AoE/Mind-Control nur Feind-Team; Heilung+Heilige Nova auf eigene Seite). Verbuendeten-Panel (gruen, heil-/buffbar, nicht angreifbar). Sieg = letztes Team steht (`room.winnerTeam`). Faire Zugfolge (Sitze beim Start team-abwechselnd). Neue FFA-KI `playFfaBotTurn` (team-aware). Headless + Browser-Smoke + Live-Spiel bis Team-Sieg getestet. **Henry-Feel-Test offen.**
3. **Frozen-Optik aufhuebschen (optional, JETZT als naechstes moeglich):** Henry erwaehnte 21st.dev fuer eisige Animationen. Aktuell CSS (blauer Schleier + ❄️ + cyan Rand) - reicht, kann spaeter fancy werden.
4. **Balance nach Playtest (mit Henry):** Werte in docs/BALANCE-CHANGES.md, Henry kann jeden vetoen/tunen. Neue Zauber-Manakosten (Blizzard/Holy Nova/Div. Sturm je 5) evtl. auf 4? m_champion 6 ok? Evtl. FFA-Bot-Staerke tunen (aktuell solide).

### v2.11 LIVE (Commit 290fe76) - 2v2-Team-Modus + Bots
- Dateien: `src/types.ts` (GameMode "2v2", team/isBot, winnerTeam, SET_TEAM), `server.ts` (isTeamMode/isFfaLike, ffaOpponents/ffaAllies/isEnemyTarget, checkFfaVictory team-aware, Friendly-Fire-Guards, `playFfaBotTurn`, CREATE/JOIN/SET_TEAM/ADD_BOT/START fuer 2v2, Seat-Interleave), `src/components/FfaGame.tsx` (Team-Warteraum, Verbuendeten-Panel, team-aware Targeting/Intent, Team-Sieg), `src/components/Lobby.tsx` (2v2-Button + Badges), `src/App.tsx` (Routing + Create + mine-Resolution).
- **Bot-Modell:** FFA/2v2-Bots haben `isBot:true` + eigene id (`bot-xxx`), werden in der Zug-Rotation NICHT als offline uebersprungen, ziehen sich selbst durch (`playFfaBotTurn` -> advanceFfaTurn). Holgar (Duell) bleibt separat via fixem BOT_ID.

### v2.10 LIVE (Commit 236d801) - Todesstoß in Zeitlupe
- Siehe Backlog-Punkt 1. Dateien: `src/types.ts` (FinishingBlow + room.finisher), `server.ts` (Erfassung + DE-Logs + Reset), `src/utils/combatFx.ts` (`playFinisherCinematic`), `src/App.tsx` + `src/components/FfaGame.tsx` (Trigger + Modal-Gate + Replay-Button), `src/components/ChatPanel.tsx` (Chronik-Scroll nach oben). lint + build gruen, headless Finisher-Test gruen, deployed (dep-d8r9id0js32c73bppku0) + live verifiziert (HTTP/health 200, WS ok).

### v2.9.1 deployed (Commit 1c7f316) - Lobby-Fix + heller Glow + Todes-Moment
- **FFA-Lobby-Haenger GEFIXT (kritisch):** nach FFA kam man nicht in die Lobby zurueck. Server entfernt Sitz beim Verlassen in JEDER Phase (LEAVE_ROOM), Client ignoriert Updates nach bewusstem Verlassen (`hasLeftRoomRef` in App.tsx, gesetzt in handleLeaveRoom, zurueckgesetzt in Create/Join). Browser-getestet.
- **Mana-Glow viel heller:** `mg-playable-pulse` (index.css) + brightness/saturate; nicht-spielbar opacity-40+grayscale. Henry: "muss hell leuchten".
- **Todes-Moment:** heroDeathExplosion + hero_death-Sound bei Held-auf-0 (Diff-Effekt in App.tsx + FfaGame.tsx). "So endete es"-Box im Sieg-Screen (Duell + FFA).

### v2.9 deployed (Commit e054d7d) - Klassen-Identitaet + echtes Einfrieren + Sichtbarkeit + Balance
- **Klassen-Decks endlich verschieden:** Mage Frost/Feuer, Priest Heilung/Schatten, Hunter Bestien, Paladin Licht. 8 neue Karten (4 Signatur-Zauber blizzard/holy_nova/multi_shot/divine_storm + 4 Diener), alle ziellos verdrahtet (Duell PLAY_CARD + botPlaySpell + FFA resolveFfaSpell + SPELL_ELEMENT-Maps). Legendaere nicht mehr ueberall.
- **Einfrieren echt:** `frozen`-Flag + `readyUpBoard()` (geteilt Duell/FFA) ueberspringt naechstes Bereitmachen. Mind Spike `tempAttackDebuff` (temporaer). types.ts Card: frozen + tempAttackDebuff.
- **Sichtbarkeit:** Mana-Glow (spielbare Handkarten gruener Ring + Lift, nicht spielbar abgedunkelt; `inHand`-Prop in CardItem), Keyword-Emoji-Chips immer sichtbar (🛡️⚡✨❄️), Gottesschild goldener Ring, eingefroren blaue Eis-Optik.
- **Balance (docs/BALANCE-CHANGES.md):** m_champion 5->6, Dr.Marc Boom 1->2, Holy Light 1->2, Wuerfel tier*2. Alles leicht aenderbar, Henry kann vetoen.
- **next-wave Branch ist nach main gemergt** (== main). Naechste Arbeit auf neuem Branch.
- **OFFEN / naechste Schritte:** Wave 4 = **2v2-Modus** (auf FFA-Infra, Teams + geteilter Sieg). Dann evtl. weitere Karten/Balance nach Henrys Playtest-Feedback.

### Aelterer Stand (Referenz):

### v2.7 + v2.8 deployed (Commit a2eff8e, live verifiziert)
- **v2.7:** Bot loest Battlecries aus (resolveBattlecry geteilt) + Schmiede server-autoritativ (computeForgeCost, kein 0-Mana-10/10-Cheat) + Lobby-Tagline (Seher-Lore + "Game Design: Marc Haevernick").
- **v2.8 = Free-for-All:** Dreieck (3) / Chaos (4) Spieler, jeder gegen jeden, last-standing. Eigener Pfad `room.mode==="ffa"` + `room.players[]` + `src/components/FfaGame.tsx`, Duell (player1/player2) byte-fuer-byte unangetastet. Ziel-Wahl pro Gegner (targetPlayerId), AoE trifft alle Gegner, Random ueber alle. **Volle Kampf-Animationen** (gleiche FX-Engine wie Duell) + **Alchemie-Schmiede** (Goetter-Wuerfel + Selber-Bauen, `FfaForge.tsx`, Kosten server-autoritativ). Getestet: headless 3er/4er + FFA-Schmiede + Browser-E2E (3 Clients) + 1v1-Regression, 0 Crashes.
- **v1-Grenze:** Reconnect Best-Effort (Sitz per Name). **2v2 bewusst weggelassen.** (Schmiede + Animationen sind jetzt drin.)
- **Naechste moegliche Schritte:** Balance-Welle (m_champion-Nerf/Wuerfel-Tuning - braucht Henrys Design-Call), FFA-Schmiede nachruesten, evtl. 2v2.

### Stand vor diesen Wellen (Referenz, v2.6):

### FERTIG + LIVE
- **Phase 1 Fundament:** Auto-Reconnect+Rejoin, Server-Heartbeat, Endzug-Halten, lautes Timer-Ticken, KI-aus, Render-Hosting, Wach-Ping.
- **Phase 2 Rebranding:** Name Marcgard, dunkel-nordische Palette + Fonts (Cinzel/Pirata One/Spectral, Tailwind-Tokens `mg-*` in `src/index.css`), Atmosphaere (`Atmosphere.tsx`: Schnee + Raben + Aurora/Nebel/Vignette + **Blutregen** bei Held <=10 HP), Raben-Sound, aufgeraeumte Profi-Lobby (vertikaler Flow, `Lobby.tsx`, zeigt jetzt alle 3 Heldenkraefte), nordische Zufallsnamen, Musik-Loop + Toggle.
- **Phase 3 (Teil):** Tarot-Karten-Look, brennende-Zuendschnur-Timer, Wikinger-Auto-Beleidigungen.
- **Kampf-FX (`src/utils/combatFx.ts`, von React entkoppelt: Overlay an body + WAAPI):** Angreifer-Lunge, Treffer-Wackeln + roter Flash + Schadenszahl, Tod-Rauch, Bildschirm-Flash beim eigenen Helden, **Rundenstart-Schwerter**, **Element-Zauber-VFX** (Runenkreis+Pentagramm+Partikel), **Projektile** (`castProjectile`, Komet/Pfeil Held->Ziel). Treffer-Sounds prozedural in `utils/audio.ts` ("hit"/"hurt").
- **Kampflog-Klarheit:** `resolveDamage` + m_firelord/dr_boom nennen Quelle + Betrag + HP-Differenz.
- **Karten-Vorschau (`previewCardId` in App.tsx):** Handkarte antippen -> grosse Vorschau (Werte + Kodex/Keyword-Erklaerungen) -> erst "Beschwoeren/Wirken" spielt. `playCardNow` ersetzt direktes Klick-Spielen.
- **v2.4 Goetter-Wuerfel** (`ROLL_FORGE_DICE` + `rollForgedCard` in server.ts): IN der Alchemie-Schmiede (ein "Schmiede"-Knopf oeffnet Modal: Wuerfel oben + Selber-Bauen darunter). Zufallskarte ~1 Stufe ueber Einsatz, mehrfach, steigende Mana-Kosten (`forgeDiceCount`, resettet in START_GAME/RESTART_GAME). Manuelles Bauen 1x/Spiel.
- **v2.4 Marc's Breath zielbar** (`battlecry_target`-Modus): Diener-Battlecry mit Ziel -> du waehlst welchen Helden auf 15 (auch dich selbst).
- **v2.5 Komplett Deutsch** (~95 Strings) + **Handy-Angriff-Fixes:** Ziel-Toast `pointer-events-none` (blockiert Helden-Tap nicht mehr), angriffsbereite Diener gruenes Puls-Leuchten (`glow-attackable`), erschoepfte ausgegraut (`minion-exhausted`), Zug-Timer 30->45s, Gegner-Kartenrueckseiten am Handy ausgeblendet.
- **v2.6 Karten-Fixes:** `meteor` + `mind_control` waren tote Karten (fehlten in targetSpells) -> jetzt zielbar; Reentrancy-Guard in `processEndTurn` (kein Doppel-Zugwechsel); Leaderboard-Filter (Bot raus).
- **Lokaler Uebungsgegner-Bot "Holgar".**

### OFFEN -> PRIMAERE QUELLE: `docs/BALANCE-REVIEW.md`
Der Balance-/Bug-Review-Agent hat eine priorisierte Liste erstellt - **das ist die Bau-Anleitung fuer die naechste Session.** Dort abgehakt was nachts schon gefixt wurde (meteor/mind_control, Zug-Race, Leaderboard). Kurz die naechsten Brocken:

1. **Bot fair machen** (HOCH-Spass): Holgar loest keine Battlecries aus (`server.ts` Bot-Minion-Pfad ~325). Battlecry-Logik aus PLAY_CARD in `resolveBattlecry(...)` auslagern + im Bot aufrufen.
2. **Schmiede-Server-Trust-Luecke** (HOCH Fairness): manuelle Karten-Kosten werden CLIENTSEITIG berechnet (`App.tsx` ~819), Server nimmt sie fast ungeprueft -> Kostenformel auf den Server ziehen.
3. **Balance-Welle (mit Henry):** Goetter-Wuerfel-Tuning, `m_champion`-Nerf (5 Mana 4/5 Schild+Ansturm = OP), Paladin-Heldenkraefte aufwerten (schwaechste Klasse).
4. **Freeze + Mind Spike sauber** (temp-Effekt-Felder in types + Reset im Zugstart) - aktuell Freeze kosmetisch, Mind-Spike-Debuff permanent.
5. **FX beidseitig:** Projektile/Quell-Label nur beim Castenden -> Server-FX-Event (`room.lastFx`) neben ROOM_STATE_UPDATE, beide Clients animieren.
6. **A4/A5 Handy-UX (mit Henry gegentesten):** Heldenkraft am Handy lesbar (Tap-Info), Brett-Diener antippbar fuer Vorschau (Tap-Kollision mit Angriff beachten -> nur bei `targetingMode==="none"`).
7. **Klassen-Identitaet (Phase B):** pro Klasse 2-3 exklusive Signatur-Karten in `STANDARD_CLASS_CARDS` (reine constants.ts-Aenderung). Designer-Entscheidung: KEINE Waffen, Identitaet ueber Deckbau.
8. **Phase C (HENRY macht das selbst):** Google-OAuth + Profil + Sammlung + Deckbau via EIGENES neues Supabase-Projekt (Henrys Title-Tool-DBs NICHT anfassen). Datenmodell-Skizze in BALANCE-REVIEW.md/Plan. **Ich lege NICHTS in Supabase an.**

### DECK-DESIGN (Befund)
Alle 4 Klassen ~80% identischer Neutral-Stapel -> die **Heldenkraft ist quasi der einzige echte Unterschied**. Hebel: pro Klasse eigene Schluesselkarten in `STANDARD_CLASS_CARDS` (constants.ts). Designer-Empfehlung: KEINE Waffen, Klassen-Identitaet ueber Deckbau (Phase B/C).

### GESTOERTE IDEEN / SPAETER (niedrige Prio, Henrys Wunschliste)
- **Ragnarök-Modus:** 3-4 Spieler Free-for-all, im Dreieck/Kreis arrangiert, feste Zugreihenfolge, random Start, man kann JEDEN angreifen. Voraussetzung: sauberes Targeting - Zauber die aktuell hart 1 Gegner setzen oder "random enemy" treffen muessen multiplayer-tauglich werden (Ziel-Spieler waehlbar). Erst nach solidem Grundspiel + sauberem Code. Ganz am Ende.
- **2v2-Modus** (falls sinnvoll) - gleiche Targeting-Voraussetzung.
- **Heldenkraft-Wechsel-Karte:** seltene Karte, die die eigene Heldenkraft tauscht. OP + versatil. Mana-Kosten austarieren (2-4+?). Kommt mit der Karten-Design-Phase (B), Teil von "Klassen interessant machen".
- Generell B-Phase: mehr coole Karten/Zauber designen + balancen, Klassen-Identitaet schaerfen.

### ARBEITSWEISE (von Henry, 2026-06-20 nachts)
- Henry schlaeft, ich ziehe autonom den Plan (A3 -> A4/A5/A6 -> A7 -> B) durch, so weit wie moeglich, immer build+deploy+verify, **Patch-Notes bei JEDEM groesseren Build gross in die Lobby** (`Lobby.tsx` Patch-Notes-Block + `docs/CHANGELOG.md`).
- **Supabase/DB NICHT anfassen** - Henry macht Google-OAuth + DB morgen selbst mit eigenem Account. Phase C ist nur geplant, nicht von mir gebaut.
- Riskante Aenderungen (z.B. A7 FX-beidseitig) mit Review-Agent absichern. Am Ende ein Agent fuer Balancing/Scoring/Bugfixing.

### Lore-Richtung (fuer Karten-Namen/Klassen)
Marc = dunkler Hellseher mit Untergangs-Prophezeiung. Marc-Zauber (Blut/Fluch, gluehen) vs normale Wikinger-Krieger (Schild/Axt). Siehe `docs/LORE.md`. GoT-Ton, derbe aber sauber.

## Arbeitsweise-Hinweise
- Recherche/groessere Bloecke gern per Workflow-Team (wie Phase-2-Recherche). frontend-design-Skill fuer UI.
- Sounds immer lokal buendeln (nicht zur Laufzeit fetchen), CREDITS.md pflegen.
- Bei jedem Update: Changelog (`docs/CHANGELOG.md`) + Patch-Notes in der Lobby pflegen (Feature das Henry liebt).
- Henry-Kommunikation: Du-Form, kurz, kein Em-Dash, Deutsch.
