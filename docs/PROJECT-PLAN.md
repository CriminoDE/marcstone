# Marcstone - Projektplan

**Arbeitstitel:** Marcstone (epischer Name kommt in Phase 2)
**Was:** Browser-basiertes Sammelkarten-Duell im Stil von Hearthstone, fuer 1-gegen-1 online ueber Link. Eigene Regeln, eigene Karten, staerker anpassbar als das Original.
**Fuer wen:** Henry + sein Bruder Marc (und Freunde die per Link reinkommen). Aktuell kein kommerzielles Ziel, reine Spielerei mit Ambition.
**Stand:** Phase 1 LIVE. Spiel laeuft unter https://marcstone.onrender.com
**Render-Service:** `srv-d8qt0gho3t8c73ad3uig` (Team `tea-d8qsj3ernols73ejngkg`, Region Frankfurt, Gratis)

---

## Tech-Ueberblick

- **Frontend:** React 19 + Vite + TypeScript + Tailwind 4
- **Backend:** Node + Express + WebSocket (`ws`), ein dauerhaft laufender Server (`server.ts`)
- **Spielstand:** komplett im Arbeitsspeicher des Servers (keine Datenbank bis Phase 4)
- **KI-Gegner:** Gemini-API (ab Phase 1 ausgeblendet, damit keine Kosten entstehen)
- **Hosting:** GitHub (Repo `CriminoDE/marcstone`, public) + Render.com (Web Service, Gratis-Plan)
- **Deploy:** Render zieht das oeffentliche Repo, Deploys werden per Render-API ausgeloest
- **Wachhalten:** GitHub-Action pingt den Server alle paar Minuten an (Gratis-Plan schlaeft sonst ein)

Warum nicht Vercel: Das Spiel ist ein zustandsbehafteter WebSocket-Server mit Raeumen im RAM. Vercel ist serverless und kann sowas nicht halten. Render/Railway/Fly sind die richtige Plattform-Art.

---

## Phasen

### Phase 1 - Fundament (LIVE bringen + stabil machen)
Ziel: Zwei Leute koennen ueber einen Link zuverlaessig gegeneinander spielen ohne rauszufliegen.

- [x] Auto-Reconnect im Client (Verbindung bricht ab -> automatischer Neuversuch bis es klappt)
- [x] Auto-Rejoin: Raum-ID + Klasse + Name in localStorage, nach Reconnect automatisch zurueck ins Spiel
- [x] Ping/Pong-Herzschlag zwischen Client und Server (tote Verbindungen schnell erkennen)
- [x] Sichtbarer Verbindungs-Status statt stilles Einfrieren
- [x] Endzug-Knopf: gedrueckt halten + fuellender Kreis statt Sofort-Ausloesung
- [x] Timer-Ticken: letzte 5 Sekunden je ein Tick, deutlich lauter
- [x] KI-Modus ausblenden (kein versehentlicher Gemini-Aufruf)
- [x] GitHub-Action Wach-Ping gegen Server-Schlaf
- [x] Auf Render deployen, Live-URL testen (live + WS-Reconnect gegen Live-URL getestet)

**Bekannte Grenze:** Server-Neustart (Deploy/Absturz) loescht laufende Spiele, weil alles im RAM liegt. Akzeptabel fuer Phase 1. Echte Absturzsicherheit = Phase 4 (Datenbank).

### Phase 2 - Rebranding (Optik + Setting)
Ziel: Weg vom KI-App-Look, hin zu einem stimmigen dunklen Nordisch/Wikinger/Hexen-Setting.

- [ ] Epischen Namen festlegen (nordisch, mit Bezug zu "Marc", z.B. Markkoenig / Markseher)
- [ ] Setting: dunkel, mystisch, mittelalterlich, nordische Mythologie, Hexen, Wahrsager
- [ ] frontend-design-Skill nutzen fuer das neue UI
- [ ] 21st.dev UI-Elemente + Effekte einbauen
- [ ] Eagle-Library + Pexels/Pixabay fuer Hintergruende/Artwork
- [ ] Leise Mittelalter-Hintergrundmusik
- [ ] Handy-Tauglichkeit (Layout, Touch-Targets, Hochformat)

### Phase 3 - Juice (Kampf-Feedback + Sound)
Ziel: Kaempfe fuehlen sich knackig an.

- [ ] Angreifende Karte bewegt sich zum Ziel
- [ ] Verbindungslinie/Pfeil vom Angreifer zum Ziel
- [ ] Impact-Symbol + Sound beim Treffer
- [ ] Getroffene Karte wackelt
- [ ] Spieler-Treffer: roter Bildschirm-Flash
- [ ] Mehr + bessere Sounds
- [ ] Schlauere, lustigere, immer passende Auto-Beleidigungen (kontextabhaengig)

### Phase 4 - Tiefe (Accounts + Deckbau)
Ziel: Das Koenigs-Feature. Eigene Identitaet, Karten sammeln, eigenes Deck bauen.

- [ ] Kleine Datenbank anbinden (Supabase, gratis)
- [ ] Eigener Account ohne Google
- [ ] Kartensammlung
- [ ] Eigener Deckbau
- [ ] Mehr Karten, Balance-Arbeit

---

## Durchgehende Prinzipien

- **Patch Notes bei jedem Update:** Jede Aenderung kommt in `docs/CHANGELOG.md`. Wird spaeter auch im Spiel als Patch-Notes-Fenster angezeigt.
- **Doku darf nicht verloren gehen:** Dieser Plan + Changelog + Architektur-Notizen leben im Repo und werden bei jedem Schritt gepflegt.
- **Balance im Blick:** Mehr Anpassbarkeit ist das Ziel, aber Karten muessen fair bleiben.
- **Branch-Disziplin:** Auf `main` nur was getestet ist.

---

## Offene Entscheidungen

- Epischer Name (Phase 2)
- Ob Render-Gratis reicht oder spaeter ~5 EUR/Monat fuer always-on (erst entscheiden wenn es nervt)
