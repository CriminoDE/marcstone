# Marcgard - RESUME (hier weitermachen)

**Wenn Henry sagt "weiter marcgard": ZUERST dieses Dokument lesen, dann `docs/PROJECT-PLAN.md` + `docs/VISION-PHASE2-3.md` + `docs/LORE.md`.**

## Was ist das
Marcgard = Browser-Kartenduell (Hearthstone-artig), 1v1 online ueber Link, fuer Henry + Bruder Marc. Spass-Projekt, nicht kommerziell. Dunkel-nordisches Setting (Wikinger/Hexen/Seher, GoT-Ton, nicht kindisch).

## Wo es laeuft
- **Live:** https://marcstone.onrender.com (Subdomain fix; Domain marcgard.de/.com ist frei, spaeter draufsetzen)
- **Repo:** GitHub `CriminoDE/marcstone` (public), lokal `/Users/hhaev/Krimi/marcstone`. Arbeit direkt auf `main`.
- **Hosting:** Render, Service `srv-d8qt0gho3t8c73ad3uig`, Team `tea-d8qsj3ernols73ejngkg`, Gratis-Plan.
- **Stack:** React 19 + Vite + TS + Tailwind 4 Frontend, Node + Express + WebSocket (`ws`) Backend (`server.ts`). State im RAM (keine DB bis Phase 4).

## Deploy-Workflow (WICHTIG)
1. Aendern, dann `npm run lint` + `npm run build` (muss gruen sein).
2. `git add -A && git commit && git push origin main`.
3. Deploy ausloesen per Render-API:
   `curl -sS -X POST "https://api.render.com/v1/services/srv-d8qt0gho3t8c73ad3uig/deploys" -H "Authorization: Bearer <RENDER_KEY>" -H "Content-Type: application/json" -d '{"clearCache":"do_not_clear"}'`
4. Status pollen bis "live", dann live verifizieren (Titel/health/ws-Test).
- **RENDER_KEY:** Henry hat ihn (Key-Name "marcgard"). Wird NICHT gespeichert -> in neuer Session Henry danach fragen, wenn ein Deploy ansteht.
- Wach-Ping laeuft als GitHub-Action (`.github/workflows/keepalive.yml`), RENDER_URL als gh-Repo-Variable.

## Testen ohne zweiten Spieler
Raum erstellen -> Warteraum -> "Uebungsgegner hinzufuegen" -> lokaler Bot "Holgar" (kein Gemini, kostenlos). WS-Testskripte: `/tmp/wstest.mjs` (Reconnect), `/tmp/bottest.mjs` (Bot) - bei Bedarf neu schreiben.

## STAND (Stand: 2026-06-20)

### FERTIG + LIVE
- **Phase 1 Fundament:** Auto-Reconnect+Rejoin, Server-Heartbeat, Endzug-Halten, lautes Timer-Ticken, KI-aus, Render-Hosting, Wach-Ping.
- **Phase 2 Rebranding:** Name Marcgard, dunkel-nordische Palette + Fonts (Cinzel/Pirata One/Spectral, Tailwind-Tokens `mg-*` in `src/index.css`), Atmosphaere (`Atmosphere.tsx`: Schnee + Raben + Aurora/Nebel/Vignette), Raben-Sound, aufgeraeumte Profi-Lobby (vertikaler Flow, `Lobby.tsx`), nordische Zufallsnamen (`utils/names.ts`), Hintergrundmusik-Loop + Toggle (`utils/music.ts`, `MusicToggle.tsx`).
- **Phase 3 (Teil):** Tarot-Karten-Look (`CardItem.tsx`, Marc-Karten gluehen), brennende-Zuendschnur-Timer (`FuseTimer.tsx`), Wikinger-Auto-Beleidigungen (`server.ts` triggerRageChat).
- **Lokaler Uebungsgegner-Bot** (`server.ts` playAITurn Heuristik + ADD_BOT).

### OFFEN (naechste Bloecke, Prio von oben)
1. **Kampf-Animationen:** angreifende Figur bewegt sich zum Ziel, Impact, Ziel wackelt, Spieler-Treffer = roter Bildschirm-Flash, Angriffslinie. (Henry: Figuren muessen sich richtig gut bewegen.)
2. **Rundenstart-Effekt:** zwei ueberkreuzte Schwerter fliegen rein, bleiben kurz, faden weg.
3. **Element-basierte Zauber-VFX:** rotes Pentagramm/Runenkreis beim Zaubern, Flammen bei Feuer, Schnee bei Frost (je nach Zauber-Typ).
4. **Kampf-Sounds:** Kriegstrommeln (bei knapper Zeit hochfahren), Impact, Wolfsgeheul, Wasser-Ambiente. Quellen: Pixabay (siehe PHASE2-DESIGN.md 2.5), als lokale MP3 nach `public/audio/`, mit `CREDITS.md`-Eintrag. Audio-Manager in `utils/audio.ts` ausbauen (GainNode pro Kategorie).
5. **Handy-Lesbarkeit + Tap-to-Zoom Karten + Glossar:** Karten auf dem Handy gut lesbar, antippen = grosse Leseansicht; Glossar das Keywords erklaert (Spott/Ansturm/Gottesschild/Kampfschrei...).
6. **Eagle-Stein-Glyphen** als Faehigkeits-Icons auf Karten (statt Buchstaben T/C/S) - Asset-Map in `docs/PHASE2-DESIGN.md` Abschnitt 2 (Item-IDs + Pfade, via mask-image einfaerben). Glyph-PNGs sind grau, evtl. transparent pruefen.
7. **Phase 4 (spaeter):** Login/Profile/Level/Kartensammlung/Deckbau via EIGENES neues Supabase-Projekt (Henrys bestehende DBs NICHT anfassen). Loest auch State-Verlust bei Server-Neustart.

### Lore-Richtung (fuer Karten-Namen/Klassen)
Marc = dunkler Hellseher mit Untergangs-Prophezeiung. Marc-Zauber (Blut/Fluch, gluehen) vs normale Wikinger-Krieger (Schild/Axt). Siehe `docs/LORE.md`. GoT-Ton, derbe aber sauber.

## Arbeitsweise-Hinweise
- Recherche/groessere Bloecke gern per Workflow-Team (wie Phase-2-Recherche). frontend-design-Skill fuer UI.
- Sounds immer lokal buendeln (nicht zur Laufzeit fetchen), CREDITS.md pflegen.
- Bei jedem Update: Changelog (`docs/CHANGELOG.md`) + Patch-Notes in der Lobby pflegen (Feature das Henry liebt).
- Henry-Kommunikation: Du-Form, kurz, kein Em-Dash, Deutsch.
