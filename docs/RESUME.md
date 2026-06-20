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

## STAND (Stand: 2026-06-20)

### FERTIG + LIVE
- **Phase 1 Fundament:** Auto-Reconnect+Rejoin, Server-Heartbeat, Endzug-Halten, lautes Timer-Ticken, KI-aus, Render-Hosting, Wach-Ping.
- **Phase 2 Rebranding:** Name Marcgard, dunkel-nordische Palette + Fonts (Cinzel/Pirata One/Spectral, Tailwind-Tokens `mg-*` in `src/index.css`), Atmosphaere (`Atmosphere.tsx`: Schnee + Raben + Aurora/Nebel/Vignette + **Blutregen** bei Held <=10 HP), Raben-Sound, aufgeraeumte Profi-Lobby (vertikaler Flow, `Lobby.tsx`, zeigt jetzt alle 3 Heldenkraefte), nordische Zufallsnamen, Musik-Loop + Toggle.
- **Phase 3 (Teil):** Tarot-Karten-Look, brennende-Zuendschnur-Timer, Wikinger-Auto-Beleidigungen.
- **Kampf-FX (`src/utils/combatFx.ts`, von React entkoppelt: Overlay an body + WAAPI):** Angreifer-Lunge, Treffer-Wackeln + roter Flash + Schadenszahl, Tod-Rauch, Bildschirm-Flash beim eigenen Helden, **Rundenstart-Schwerter**, **Element-Zauber-VFX** (Runenkreis+Pentagramm+Partikel), **Projektile** (`castProjectile`, Komet/Pfeil Held->Ziel). Treffer-Sounds prozedural in `utils/audio.ts` ("hit"/"hurt").
- **Kampflog-Klarheit:** `resolveDamage` + m_firelord/dr_boom nennen Quelle + Betrag + HP-Differenz.
- **Karten-Vorschau (`previewCardId` in App.tsx):** Handkarte antippen -> grosse Vorschau (Werte + Kodex/Keyword-Erklaerungen) -> erst "Beschwoeren/Wirken" spielt. `playCardNow` ersetzt direktes Klick-Spielen.
- **Lokaler Uebungsgegner-Bot.**

### OFFEN (naechste Bloecke, Prio von oben)
1. **Marc's Breath (alexstrasza) zielbar:** aktuell setzt der Battlecry hart `opponent.health=15` ohne Wahl. Soll "beliebiger Held auf 15" werden -> braucht einen NEUEN Battlecry-Ziel-Flow fuer Diener (Diener werden sonst sofort ohne Ziel gespielt) + sichtbarer Effekt. Server: `server.ts` Battlecry-Block ~715.
2. **Alchemie-Schmiede Goetter-Wuerfel** (ENTSCHIEDEN mit Henry): zusaetzlich zum manuellen Bauen (bleibt **1x/Spiel**) ein **Zufalls-Wuerfel**: sichtbare Wuerfel-Animation aufs Brett, Ergebnis = gebalancter Zufall **immer ~1 Stufe ueber dem Mana-Einsatz** (nie Muell, kein Cherry-Picking weil random), **mehrfach nutzbar mit steigenden Mana-Kosten** (z.B. 1->2->3...). Manuelles Bauen ist der OP-Vektor -> bleibt 1x/Spiel.
3. **Schmiede-Inhalte aufbohren:** aktuell nur basic Effekte (damage/heal/draw). Henry will ein paar coole Basics, spaeter wilde Karten.
4. **FX beidseitig (Phase B):** Projektile/Quell-Label erscheinen nur beim Castenden. Fuer "Gegner sieht auch was fliegt" braucht es ein leichtes Server-FX-Event neben ROOM_STATE_UPDATE (z.B. `room.lastFx`), das beide Clients animieren.
5. **Gameplay-Bugs (Henry-Entscheidung offen):** Freeze (Mage "Chilled Arcana") ist nur kosmetisch (kein echtes Einfrieren); **Bot loest keine Battlecries aus** (`server.ts` ~273, eigener Bot-Minion-Pfad ohne Battlecry-Block) -> Holger zu schwach. Beides bewusst nicht blind geaendert (Balance).
6. **Kampf-Sounds erweitern:** Kriegstrommeln (bei knapper Zeit hoch), Wolfsgeheul, Wasser-Ambiente. Quellen Pixabay (PHASE2-DESIGN.md 2.5), lokale MP3 nach `public/audio/` + CREDITS.md. (Treffer-Boom/Aua sind schon da, prozedural.)
7. **Eagle-Stein-Glyphen** als Faehigkeits-Icons (statt T/C/S) - Asset-Map PHASE2-DESIGN.md 2.
8. **Phase 4 (spaeter):** Login/Profile/Level/Deckbau via EIGENES neues Supabase-Projekt (Henrys DBs NICHT anfassen). Loest auch State-Verlust bei Neustart.

### DECK-DESIGN (Befund)
Aktuell sind alle 4 Klassen ~80% identischer Neutral-Stapel; nur paar Karten je Klasse anders -> die **Heldenkraft ist quasi der einzige echte Unterschied**. Falls echte Klassen-Identitaet gewuenscht: pro Klasse eigene Schluesselkarten definieren (`STANDARD_CLASS_CARDS` in constants.ts).

### Lore-Richtung (fuer Karten-Namen/Klassen)
Marc = dunkler Hellseher mit Untergangs-Prophezeiung. Marc-Zauber (Blut/Fluch, gluehen) vs normale Wikinger-Krieger (Schild/Axt). Siehe `docs/LORE.md`. GoT-Ton, derbe aber sauber.

## Arbeitsweise-Hinweise
- Recherche/groessere Bloecke gern per Workflow-Team (wie Phase-2-Recherche). frontend-design-Skill fuer UI.
- Sounds immer lokal buendeln (nicht zur Laufzeit fetchen), CREDITS.md pflegen.
- Bei jedem Update: Changelog (`docs/CHANGELOG.md`) + Patch-Notes in der Lobby pflegen (Feature das Henry liebt).
- Henry-Kommunikation: Du-Form, kurz, kein Em-Dash, Deutsch.
