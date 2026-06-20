# Changelog / Patch Notes

Alle nennenswerten Aenderungen an Marcstone. Neueste oben.
Dieses Changelog ist die Quelle fuer die spaeteren In-Game-Patch-Notes.

Format: `## [Version] - Datum` mit Kategorien Hinzugefuegt / Geaendert / Behoben / Entfernt.

---

## [2.7.0] - Fairer Bot + Schmiede server-autoritativ (aus Balance-Review-Agent)

### Behoben
- **Bot loest Battlecries aus:** Holgar spielte Firelord/Dr. Marc/Marc's Breath/Ragnaros/Sylvanas als Vanilla-Koerper (Battlecry-Logik hing nur in `PLAY_CARD`). Logik in `resolveBattlecry()` ausgelagert + im Bot-Pfad aufgerufen. Fuer Marc's Breath waehlt der Bot ein sinnvolles Ziel (heilt sich unter 15, sonst nukt er den Menschen auf 15). Verifiziert: Bot legte Dr. Marc -> Boom-Bots feuerten.
- **Schmiede Server-Trust-Luecke (Fairness):** Manuelle Karten-Kosten wurden clientseitig berechnet, Server uebernahm sie fast ungeprueft -> ein manipulierter Client konnte ein 0-Mana-10/10 bauen. Kostenformel als `computeForgeCost()` auf den Server gezogen (spiegelt die Client-Formel), Client-`cost` wird ignoriert, Stats auf 1-10 geclampt, >10-Mana-Karten abgelehnt. Verifiziert: 10/10-mit-allem abgelehnt, 5/5-mit-cost-0 landet mit 4 Mana in der Hand.

### Geaendert
- **Lobby-Tagline:** „Fordere deinen Bruder per Link heraus" raus. Stattdessen Seher-Lore (Marc-Prophezeiung) + dezente Credit-Zeile „Game Design: Marc Haevernick" in der Display-Schrift.

## [2.6.0] - Karten-/Logik-Fixes (aus Balance-Review-Agent)

### Behoben
- **`meteor` (6 Mana, 8 Schaden) + `mind_control` (10 Mana) waren tote Karten** - fehlten in der Client-Ziel-Zauber-Liste (`App.tsx`), wurden ohne Ziel gesendet -> Server tat nichts, Mana verpufft. Jetzt zielbar; mind_control nur auf gegnerische Diener (Server-Handler-Anforderung).
- **Doppel-`processEndTurn`-Race** (Timer-Ablauf + manuelles END_TURN fast gleichzeitig konnten den Zug zweimal weiterschalten -> doppelter Kartenzug/Mana). Reentrancy-Guard `if (room.turn !== currentTurnConnectionId) return;`.
- **Leaderboard:** Bot "Holgar" wurde eingetragen, und `startsWith("ai")` filterte echte Namen (z.B. "Aiko") faelschlich raus. Filter praezisiert (`recordWin`).

### Hinweis
- Vollstaendiger Review-Report inkl. offener Balance-Punkte fuer die naechste Session: `docs/BALANCE-REVIEW.md`.

## [2.5.0] - Komplett Deutsch + Angriff-UX-Fixes (Handy)

### Geaendert
- **Alles auf Deutsch** (~95 Strings, per Uebersetzungs-Agent): alle Karten-Beschreibungen + Heldenkraft-Texte (constants.ts), alle Toasts/Labels/Menues/Victory/Schmiede-Formular (App.tsx), Kampf-Emotes frech-nordisch (ChatPanel), CardItem, HeroState. Eigennamen (Kartennamen, Heldenkraft-Namen) bewusst gelassen. Formelle "Sie"-Reste in der Schmiede auf "du" gezogen.

### Behoben (Henrys Handy-Playtest)
- **Angreifen blockiert nicht mehr:** der Ziel-Hinweis-Toast lag auf kleinen Screens ueber dem Gegner-Helden und fing den Tap ab -> "abgebrochen". Toast ist jetzt `pointer-events-none`, Taps gehen sauber auf Held/Brett durch.
- **Diener-Status klar erkennbar:** angriffsbereite eigene Diener haben ein gruenes, pulsierendes Leuchten (`glow-attackable`), schon eingesetzte/frisch beschworene sind ausgegraut (`minion-exhausted`).
- **Zug-Timer 30 -> 45 Sek** (Handy tippt langsamer).
- **Gegner-Handkarten-Rueckseiten am Handy ausgeblendet** (liefen ueber/sahen buggy aus; nur die Zahlen bleiben).

## [2.4.0] - Goetter-Wuerfel + Marc's Breath zielbar

### Hinzugefuegt
- **Goetter-Wuerfel** (Schmiede, neben dem manuellen Bauen): Action `ROLL_FORGE_DICE`, `rollForgedCard(diceManaCost)` im Server erzeugt eine gebalancte Zufallskarte - garantiert ~1 Manastufe ueber dem Einsatz (Stat-Budget tier*2+1, 25% Zauber/75% Diener, max 1 Keyword mit Tier-Gates: Gottesschild ab Tier 3, Ansturm ab Tier 2). **Mehrfach pro Spiel**, Kosten steigen pro Wurf (1,2,3...) ueber `forgeDiceCount`. Sichtbare Wuerfel-Animation (`diceRoll` in combatFx). Manuelles Bauen bleibt 1x/Spiel (kein Cherry-Picking, weil Wuerfel = Zufall).
- **Marc's Breath (alexstrasza) zielbar**: neuer Client-Targeting-Modus `battlecry_target` - Diener mit `battlecryNeedsTarget` lassen dich erst einen Helden waehlen (eigenen oder gegnerischen) und setzen DESSEN Leben auf 15 (vorher hart auf den Gegner + ohne sichtbaren Effekt). Klarer Log mit HP-Differenz + Holy-Cast-FX.

### Technik
- Server bleibt autoritativ; Battlecry-Ziel kommt client-getrieben ueber PLAY_CARD (targetId/isTargetHero), kein riskanter Pending-State.

### Behoben (nach Review-Agent)
- **Goetter-Wuerfel ist jetzt IN der Schmiede** (ein "🔮 Schmiede"-Knopf oeffnet das Fenster mit Wuerfel oben + Selber-Bauen darunter), statt separatem Action-Leisten-Knopf.
- `forgeDiceCount` + `hasForgedThisGame` werden bei START_GAME und RESTART_GAME zurueckgesetzt (vorher Bug: Rematch im selben Raum startete mit teurem Wuerfel + gesperrter Schmiede - die Spieler-Objekte werden wiederverwendet, nicht neu erstellt).
- Klick auf ein Helden-Ziel loest keinen falschen "abgebrochen"-Toast mehr aus (stopPropagation in HeroState).

## [2.3.0] - Karten-Vorschau (Tap-to-read) + Handy-Tooltips

### Hinzugefuegt
- **Karten-Vorschau statt Sofort-Spielen**: Handkarte antippen oeffnet eine grosse, lesbare Vorschau (Kosten, Werte, Beschreibung, Schluesselwort-Erklaerungen = "Marcgard Kodex"). Erst der "Beschwoeren/Wirken"-Knopf spielt die Karte; danebentippen schliesst. Loest versehentliches Ausspielen am Handy + bringt Tooltips auf Touch-Geraete. (`previewCardId`-State, `playCardNow` ersetzt das direkte Klick-Spielen.)

### Offen (naechste Welle, mit Henry abgestimmt)
- Marc's Breath (alexstrasza) zielbar machen ("beliebiger Held" auf 15) + sichtbarer Effekt.
- Alchemie-Schmiede: **Goetter-Wuerfel** (sichtbarer Wuerfel, gebalancter Zufall ~1 Stufe ueber Einsatz, steigende Mana-Kosten) zusaetzlich zum manuellen Bauen (bleibt 1x/Spiel).

## [2.2.0] - Sichtbare Magie: Projektile, Sounds, klarer Log

### Hinzugefuegt
- **Projektile** (`castProjectile` in combatFx): Zauber & zielende Heldenkraefte fliegen sichtbar vom Helden zum Ziel (Komet, Pfeil bei Hunter Steady Shot + Arcane Shot), beim Aufprall folgt der Element-Effekt.
- **Element-Zauber-VFX**: roter Runenkreis + Pentagramm + Element-Partikel (Feuer/Frost/Arkan/Heilig/Heilung/Schatten) bei jedem Zauber/jeder Heldenkraft.
- **Rundenstart-Schwerter**: gekreuzte Schwerter bei Zugwechsel (Gold = ich, Rot = Gegner).
- **Treffer-Sounds** (prozedural, WebAudio): kurzer "hit"-Boom bei Schaden, tieferes "hurt"-Aua wenn der eigene Held getroffen wird (ein Sound pro Ereignis, kein Flaechen-Spam).
- **Lobby**: zeigt jetzt alle 3 Heldenkraefte der gewaehlten Klasse mit Beschreibung + Tooltip (vorher nur 1).

### Behoben (Kampflog-Klarheit)
- Marc the Firelord, Dr. Marc (Boom-Bots) und alle Direktzauber/Heldenkraefte loggen jetzt klar WER WIE VIEL Schaden am Helden macht, inkl. Lebens-Differenz (vorher: "Spell/Fireblast … experimental Hero" ohne Quelle/Betrag, bzw. gar keine Zeile). Loest "ich verliere Leben und sehe nicht wodurch".

### Bekannte Grenze / offen
- Projektile + Quell-Label erscheinen aktuell nur auf dem Bildschirm des Castenden; der Gegner sieht Treffer-Flash + Schadenszahl + Sound + Log, aber (noch) nicht das fliegende Geschoss des Anderen. Beidseitig braucht ein Server-FX-Event (Phase B).
- Freeze (Mage "Chilled Arcana") ist weiterhin nur kosmetisch; Bot loest keine Battlecries aus. Bewusst offen gelassen (Balance-Entscheidung).

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
