# Changelog / Patch Notes

Alle nennenswerten Aenderungen an Marcstone. Neueste oben.
Dieses Changelog ist die Quelle fuer die spaeteren In-Game-Patch-Notes.

Format: `## [Version] - Datum` mit Kategorien Hinzugefuegt / Geaendert / Behoben / Entfernt.

---

## [2.1.0] - Kampf-Animationen + Blutregen

### Hinzugefuegt
- **Kampf-Animationen** (`src/utils/combatFx.ts`, komplett von React entkoppelt: eigene Overlay-Ebene an `document.body` + Web Animations API direkt am Knoten, ueberlebt Re-Renders):
  - **Angreifer-Lunge:** die angreifende Figur holt aus, stoesst zum Ziel und federt zurueck (sofort beim Klick, optimistisch).
  - **Treffer-Reaktion** (ueber HP-Zustands-Diff, also auf BEIDEN Bildschirmen): getroffene Figur/Held wackelt, roter Flash, aufsteigende Schadenszahl `-X`, Funken-Stoss.
  - **Tod-Rauch:** gefallene Figuren zerstaeuben mit dunklem Blut-Rauch an ihrer letzten Position.
  - **Bildschirm-Flash:** roter Voll-Flash, wenn der eigene Held Schaden nimmt (Staerke skaliert mit Schaden).
- **Blutregen:** faellt ein Held auf <= 10 Leben, faerbt sich der Schnee blutrot und wird zu Regen (sanfter Uebergang) + pulsierender roter Schleier.

### Technik
- Server bleibt autoritativ; FX reagieren rein clientseitig auf `ROOM_STATE_UPDATE`-Diffs. Alles respektiert `prefers-reduced-motion`.

### Infra
- Hosting auf **marcgard.onrender.com** umgezogen (neuer Render-Service, alter `marcstone` geloescht - Free-Tier erlaubt nur eine aktive Instanz). Wach-Ping-Variable angepasst.

## [2.0.0-a] - Phase 2 Start: Marcgard-Rebranding (Optik)

### Hinzugefuegt
- Neuer Name **Marcgard** (Titel, Lobby-Logo in Cinzel, Arena, metadata).
- Dunkel-nordisches Design-System: Palette (Stein/Frost/Blut/Bronze) + Fonts Cinzel/Pirata One/Spectral als Tailwind-Tokens.
- Atmosphaere-Layer: fallender Schnee + gelegentlich fliegende Raben (Canvas), Aurora/Nebel/Vignette (CSS). Respektiert prefers-reduced-motion.
- **Raben-Geraeusch** beim Raben-Flug (echtes Audio, Wikimedia/Xeno-Canto).

### Geaendert
- Komplette Lobby + Spiel-UI von Slate/Amber auf die Marcgard-Palette umgestellt.

### In Arbeit (Phase 2/3)
- Spielbrett + Karten im Tarot-Stil, brennende-Zuendschnur-Timer, mehr Sounds (Musik/Wasser/Trommeln/Wolf), Eagle-Glyphen als Faehigkeits-Icons. Plan: docs/PHASE2-DESIGN.md

## [1.6.0] - Phase 1: Festung (Fundament + Stabilitaet)

### Hinzugefuegt
- **Auto-Reconnect:** Client verbindet nach Abbruch automatisch alle 2 Sek neu.
- **Auto-Rejoin:** Raum-ID + Klasse + Name in localStorage; nach Reconnect automatisch zurueck ins laufende Spiel (end-to-end getestet).
- **Server-Heartbeat:** Ping/Pong alle 30 Sek, tote Verbindungen werden erkannt und beendet.
- **Endzug-Halten:** Endzug-Knopf muss gedrueckt gehalten werden (fuellender Balken, 550 ms), kein versehentliches Beenden mehr.
- **Wach-Ping:** GitHub-Action pingt den Server alle 10 Min an, damit der Gratis-Plan nicht einschlaeft.
- **Render-Blueprint** (`render.yaml`) + Port aus `process.env.PORT`.

### Geaendert
- Timer-Ticken: letzte 5 Sekunden je ein deutlich lauterer Tick (vorher nur 1x bei 5 Sek, zu leise).
- Verbindungs-Status-Texte auf Deutsch.

### Entfernt
- KI-Gegner-Schalter (Gemini) aus der Lobby ausgeblendet -> keine API-Kosten mehr.

### Bekannte Grenze
- Server-Neustart (Deploy/Absturz) loescht laufende Spiele (alles im RAM). Behebung in Phase 4 mit Datenbank.
