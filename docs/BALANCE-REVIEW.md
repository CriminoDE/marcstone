# Marcgard - Balance/Bug-Review (Agent, 2026-06-20 nachts)

Bau-Anleitung fuer die gemeinsame Session. Was nachts schon gefixt wurde ist abgehakt.

## Nachts schon erledigt + live (v2.6)
- [x] **3.4 (HOCH): `meteor` + `mind_control` waren tote Karten** (fehlten in der Ziel-Zauber-Liste -> Mana weg, kein Effekt). Beide jetzt zielbar; mind_control nur gegnerischer Diener. `App.tsx`.
- [x] **3.5: Doppel-`processEndTurn`-Race** (Timer + manuelles END_TURN fast gleichzeitig -> Zug sprang doppelt). Reentrancy-Guard in `server.ts` processEndTurn.
- [x] **Leaderboard-Filter:** Bot "Holgar" landete im Leaderboard, und `startsWith("ai")` filterte echte Namen (Aiko) faelschlich. Jetzt sauber. `server.ts` recordWin.

## Offen - SCHNELL + SICHER (zuerst angehen)
- [ ] **3.3: Bot loest keine Battlecries aus** (`server.ts` Bot-Minion-Pfad ~325). Battlecry-Logik aus PLAY_CARD in `resolveBattlecry(...)` auslagern, im Bot aufrufen. Macht Holgar fair (aktuell spielt er Ragnaros/Firelord/Sylvanas/Marc's Breath als Vanilla-Koerper). Mittel, additiv.
- [ ] **3.2: Mind Spike "-1 Angriff" ist permanent** statt temporaer (`server.ts` ~1078, Text `constants.ts` ~393). Schnell: Text auf "dauerhaft" aendern. Sauber: tempAttack-Feld + Reset.
- [ ] **3.1: Freeze (Mage "Chilled Arcana") nur kosmetisch** (kein echtes Einfrieren). Schnell: Kraft auf was Funktionierendes umschreiben. Sauber: `frozen`-Feld in types + Skip beim Ready-Up in processEndTurn.

## Offen - BALANCE-WELLE (Spielgefuehl, mit Henry entscheiden)
- [ ] **manuelle Schmiede Server-Trust-Luecke (HOCH Fairness):** Kosten werden CLIENTSEITIG berechnet (`App.tsx` ~819), Server nimmt sie fast ungeprueft (`server.ts` ~1236). Manipulierter Client kann 0-Mana 10/10 bauen. Fix: Kostenformel auf den Server ziehen, Client-cost ignorieren.
- [ ] **Goetter-Wuerfel evtl. zu grosszuegig:** Stats = tier*2+1 bei gedruckten Kosten = Einsatz -> overstattet. Optionen: gedruckte Kosten = tier, oder Stat-Budget tier*2, oder Mana-Steigerung steiler (1,3,5..). Henry-Call.
- [ ] **`m_champion` (Marc's Champion) OP:** 5 Mana 4/5 Gottesschild+Ansturm, in JEDEM Deck. Auf 6 Mana oder 3/4 ziehen. `constants.ts` ~323.
- [ ] **`dr_boom` (Dr. Marc) schwach** fuer 7 Mana (kein Body-Bonus). `constants.ts` ~295.
- [ ] **Helden-Paritaet: Hunter > Mage > Priest > Paladin.** Paladin hat keine Tempo-Kraft. Paladin-Kraefte aufwerten.

## Offen - GROESSER (Phase B / spaeter)
- [ ] **Klassen-Identitaet:** Decks ~80% gleich. Pro Klasse 2-3 exklusive Signatur-Karten in `STANDARD_CLASS_CARDS`. Reine constants.ts-Aenderung, kein Migration.
- [ ] **Temp-Effekte sauber** (frozen + tempAttackDebuff in types + Reset) - loest 3.1 + 3.2 richtig.
- [ ] **FX-Leak-Haertung:** combatFx-Overlays nur `onfinish`, kein `oncancel`. Niedriges Risiko, ggf. Root zwischen Zuegen leeren.
- [ ] **Reconnect ohne Auth (3.6):** Namens-/Klassen-Imitation kann Slot kapern (Lobby ist oeffentlich). Erst relevant ueber die private Bruder-Runde hinaus -> loest sich mit Google-Login (Phase C, stabile Spieler-ID aus JWT).
- [ ] **Scoring: Selbst-Farmen gegen Bot** - recordWin sollte Siege gegen den Bot nicht zaehlen (Verlierer-ID pruefen). Vertrauensbasis, niedrig.

## Reihenfolge-Empfehlung
3.3 (Bot fair) -> Schmiede-Server-Trust -> m_champion-Nerf -> Wuerfel-Tuning (zusammen mit Henry) -> Freeze/MindSpike sauber -> Klassen-Signatur-Karten (Phase B). Dann Henrys Google-Login + Deckbau (Phase C).
