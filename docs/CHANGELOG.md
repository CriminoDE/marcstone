# Changelog / Patch Notes

Alle nennenswerten Aenderungen an Marcstone. Neueste oben.
Dieses Changelog ist die Quelle fuer die spaeteren In-Game-Patch-Notes.

Format: `## [Version] - Datum` mit Kategorien Hinzugefuegt / Geaendert / Behoben / Entfernt.

---

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
