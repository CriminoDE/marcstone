# Changelog / Patch Notes

Alle nennenswerten Aenderungen an Marcstone. Neueste oben.
Dieses Changelog ist die Quelle fuer die spaeteren In-Game-Patch-Notes.

Format: `## [Version] - Datum` mit Kategorien Hinzugefuegt / Geaendert / Behoben / Entfernt.

---

## [2.16.0] - Original-IP-Umbau (Sicherheit)

Alle von Hearthstone abgeleiteten Namen raus, damit das Spiel oeffentlich gezeigt/promotet werden kann ohne Blizzard-Risiko. **Nur Anzeige-Strings geaendert - templateIds, Werte, Effekte, Logik alle unveraendert** (Logik haengt an templateId, nicht am Namen). Eigene Marc-/Norse-Karten waren eh schon original.

### Geaendert
- **~26 Kartennamen** auf eigene, dunkel-nordische Namen: Sylvanas->Hela die Rabenkoenigin, Ragnaros->Surtr der Flammenfuerst, Deathwing->Fafnir der Weltendrache, Lich King->Der Frostkoenig, Boulderfist->Felsfaust-Joetun, Chillwind Yeti->Ymir der Frostriese, Pyroblast->Glutsturm, Fireball->Flammenstoss, Flamestrike->Flammenwand, Consecration->Heiliger Bannkreis, Mind Control->Gedankenfessel, Blizzard->Eissturm, Goldshire Footman->Huegelwaechter, Murloc->Sumpfbalg, usw. Marc-Karten germanisiert (Marc's Breath->Marcs Odem, Marc's Champion->Marcs Vorkaempfer ...).
- **Heldenkraft-Namen** entblizzardet: Fireblast->Feuerstoss, Steady Shot->Zielschuss, Lesser Heal->Kleine Heilung, Reinforce->Rekrutieren, Holy Light->Lichtsegen, Mind Spike->Geistesstich, Power Infusion->Kraftsegen, Call Pet->Wildruf, Explosive Trap->Berstfalle, Unstable Magic->Wilde Magie. Silver Hand Recruit->Klingenknappe.
- **Keyword-Begriffe** leicht umformuliert (Mechanik gleich, klar erkennbar): Gottesschild->**Runenschild**, Kampfschrei->**Schlachtruf**, Todesroecheln->**Grabhauch**. In Karten, Glossar, Tooltips, Server-Logs konsistent.
- Server-Logs + Lobby-Patch-Notes + Forge-UI auf die neuen Namen gezogen (keine Blizzard-Begriffe mehr user-facing; nur Code-Kommentare + lowercase templateIds bleiben intern).

### Verifikation
- lint + build gruen. Headless 3 Spiele: 3/3 Sieg, 0 Crashes, 0 Server-Errors, Effekte feuern weiter (neue Namen in Logs). Hinweis: Spiel-Mechaniken/Werte sind nicht schuetzbar, nur konkrete Ausgestaltung (Name/Art/Flavor) - daher reicht Umbenennen + eigene Karten.

## [2.15.0] - Karten-Wave: Bann, Heldenkraft-Wandel, grosse Bedrohungen

### Hinzugefuegt
- **Runen-Wandel** (`m_runeshift`, 2M Zauber): wechselt die eigene Heldenkraft zur naechsten der Klasse (`selectedHeroPowerIndex` +1 mod 3) und setzt `heroPowerUsed=false` (sofort wieder einsatzbereit). Duell + FFA + beide Bots. Die Heldenkraft-Wechsel-Karte von Henrys Wunschliste.
- **Marcs Bann** (`m_bann`, 3M Zauber, zielbar): verbannt einen gegnerischen Diener per `splice` - **kein Todesroecheln** (sauberer Konter gegen die v2.14-Mechanik). Duell + FFA + Bots + Client-Targeting (Feind-Diener).
- **Nidhoegg** (`nidhogg`, 6M 5/5): Todesroecheln - 5 Schaden an einen gegnerischen Helden (grosse Bedrohung, Branch in `fireDeathrattle`).
- **Walkuere** (`valkyrie`, 5M 4/5 Spott): Kampfschrei - alle ANDEREN eigenen Diener +1/+1 (resolveBattlecry + resolveFfaBattlecry).
- **Client:** Kampfschrei-Tooltip greift jetzt auch bei deutschem "Kampfschrei"-Text (vorher nur ueber Emoji-Heuristik) - zeigt jetzt auch bei Walkuere + Marc der Seher.

### Verifikation
- Deterministischer Headless-Test (Front-Load-Hook MG_TEST_WAVE, danach entfernt): alle 4 Effekte feuern (Heldenkraft-Wechsel inkl. Bot, Bann entfernt Diener, Nidhoegg-Tod 5 ins Gesicht, Walkuere-Buff), 0 liegende tote Diener, 0 Crashes. Normal-Modus sauber. lint + build gruen.

## [2.14.0] - Todesroecheln (Deathrattle)

### Hinzugefuegt
- **Neue Mechanik Todesroecheln** (`hasDeathrattle`): Diener loesen beim Sterben einen Effekt aus. Server-zentral umgesetzt - **eine** `reap(room)`-Funktion ersetzt jetzt die ~35 verstreuten `board.filter(health>0)`-Stellen: sie sammelt tote Diener auf allen Brettern, feuert ihr Todesroecheln und wiederholt das (Kettentode, z.B. Draugr-AoE). `fireDeathrattle` mutiert direkt (keine Rekursion). Greift in Duell + FFA + 2v2 + bei beiden Bots, weil alle Schadenspfade durch `reap` laufen.
- **4 Todesroecheln-Karten** (`src/constants.ts`): Marcs Wiedergaenger (3M 3/2, Tod: 3 an gegnerischen Helden), Marcs Seherin (2M 2/2, Tod: zieh eine Karte), Fenris-Brut (4M 3/3, Tod: beschwoere zwei 2/2 Fenris-Welpen), Draugr-Krieger (5M 4/4 Spott, Tod: 2 an alle Feind-Diener). Plus Token `wolf_token` (nur beschworen).
- **Client:** 💀-Keyword-Chip auf der Karte + Tooltip + Glossar-Eintrag "Todesroecheln".

### Verifikation
- Headless deterministisch (Deck mit allen 4 DR-Karten front-geladen, aggressives Traden): alle 4 Effekte feuern (Helden-Schaden + Karte-ziehen + Welpen-Beschwoeren + AoE), Welpen erscheinen, Kettentode loesen aus. **0 liegengebliebene tote Diener** ueber alle Spiele (beweist: reap laeuft nach jedem Schadenspfad), **0 Crashes**. Normal-Modus unveraendert. lint + build gruen.

## [2.13.0] - Marcs Macht + hellere Handkarten

### Hinzugefuegt
- **4 neue Marc-Legendaere** (`src/constants.ts`), in allen Modi verdrahtet (Duell + FFA + 2v2 + beide Bots), keine neuen Keywords - nur die bestehenden Zauber-/Kampfschrei-Frameworks:
  - **Zorn des Marc** (`m_wrath`, 4 Mana Zauber): 4 Schaden an ALLEN Dienern im Spiel, Freund wie Feind (symmetrischer Brett-Reiniger). Mage + Priest.
  - **Marcs Fluch** (`m_curse`, 3 Mana Zauber, zielbar): halbiert das aktuelle Leben eines beliebigen Ziels (mind. 3 Schaden). Mage + Hunter + Paladin.
  - **Marc der Seher** (`m_seer`, 4 Mana 3/4, Kampfschrei): ziehe 2 Karten, zahle 2 Leben (nie unter 1). Mage + Priest.
  - **Fenrir der Endwolf** (`fenrir`, 7 Mana 6/6, Ansturm): reine Werte + Ansturm, splashy Legendaerer. Hunter + Paladin.
- Beide Marc-Zauber bekommen Schatten-VFX (Element `shadow`); `m_curse` ist im Duell- und FFA-Targeting + bei beiden Bots als Ziel-Zauber registriert.

### Geaendert
- **Handkarten deutlich heller (Henry-Wunsch):** spielbare Karten leuchten kraeftiger (`brightness 1.4 / saturate 1.4` statt 1.15/1.25), nicht spielbare sind weniger stark abgedunkelt (`opacity 0.65 / brightness 0.82` statt 0.4/0.6). Zauberkarten-Grundflaeche von fast-schwarz (`to-mg-void`) auf Schiefer (`to-mg-slate`) aufgehellt.

## [2.12.0] - Glossar, Eis-Optik, Inhalt (lokal gebaut, noch nicht gepusht)

### Hinzugefuegt
- **Glossar** (`src/components/Glossary.tsx`): erklaert Schluesselwoerter (Spott/Ansturm/Gottesschild/Kampfschrei/Eingefroren), Spielablauf (Mana/Angriff/Heldenkraft/Schmiede/Todesstoss-Kino) und die 3 Modi. Per 📖-Button in Lobby, Duell und FFA/2v2 erreichbar.
- **Frost-Nova-Effekt** (`frostNova` in combatFx): eisiger Bildschirm-Schimmer + Schneeflocken bei Blizzard & Co. (Duell + FFA/2v2).
- **3 Marc-Themen-Karten** (nur bestehende Keywords, balance-arm): Marcs Raben (3M 4/2 Ansturm), Marksmann des Marc (4M 5/1 Ansturm), Waechter des Nordens (4M 4/4 Spott). Siehe docs/BALANCE-CHANGES.md (zum Vetoen).
- **Mehr Wikinger-Auto-Beleidigungen** (groessere Pools fuer minion_died + high_damage).

### Geaendert
- **Eingefroren-Optik aufgehuebscht:** vereiste Karten bekommen pochenden Eis-Rand + wandernden Glitzer-Streif + Eiskristalle (`mg-frost-shimmer` / `mg-frost-pulse`).

## [2.11.0] - 2v2-Team-Modus + Bots

### Hinzugefuegt
- **2v2-Team-Modus (auf der FFA-Infra):** Team A gegen Team B. Eigener Lobby-Button "2v2 erstellen". Im Warteraum waehlt man sein Team (A/B-Buttons) und der Ersteller fuellt leere Plaetze mit **Bots** - so spielbar ohne 4 echte Leute (z.B. du + Marc vs 2 Bots, oder du vs Marc je mit Bot-Partner, oder 4 Menschen). Start nur bei genau 2 gegen 2; Sitze werden zum Start team-abwechselnd geordnet (faire Zugfolge A,B,A,B).
- **FFA-taugliche KI (`playFfaBotTurn`):** Bots spielen Karten, nutzen offensive Heldenkraefte und greifen an - team-aware (treffen im 2v2 nur das Feind-Team). Headless gegen ein komplettes Spiel getestet (Team-Sieg sauber erkannt).
- **Bots auch im Free-for-All:** Der Uebungsgegner laesst sich jetzt auch in FFA-Raeumen dazuholen (vorher nur im 1v1).
- **Verbuendeten-Panel:** Im 2v2 wird der Partner separat (gruen) gezeigt - heil- und buffbar, nicht angreifbar.

### Geaendert
- **Friendly Fire ist aus (2v2):** Schaden, Angriffe, AoE, Gedankenkontrolle und Random-Treffer (Ragnaros/Dr. Marc/Mehrfachschuss) gehen nur aufs Feind-Team. Heilung + Heilige Nova wirken auf die ganze eigene Seite. Die Ziel-Auswahl im UI bietet entsprechend nur gueltige Ziele an.
- **Sieg team-aware:** `room.winnerTeam` (A/B/Unentschieden); Sieg-Screen + Zeitlupen-Kino zeigen Team-Ausgang. Bots zaehlen nicht in die Ruhmeshalle.

## [2.10.0] - Todesstoß in Zeitlupe (Sieg-Replay)

### Hinzugefuegt
- **Sieg-Zeitlupen-Kino (Henrys grosser Wunsch):** Wenn ein Held faellt, wird der entscheidende Schlag gross + in Slow-Mo nachgespielt: die toedliche Karte fliegt herein, praesentiert sich tanzend in der Mitte (Diener-Koerper mit Angriffs-Badge oder Zauber-Sigille), holt aus und schlaegt/feuert in Zeitlupe auf das Helden-Wappen des Opfers, riesige Schadenszahl, dann epische Todes-Explosion + Boom. Danach erscheint der Sieg-Screen.
- **Strukturierte "letzte Aktion" vom Server (`room.finisher`):** Der Server erfasst jeden Helden-Treffer (Diener-Angriff, Zauber, Heldenkraft, Battlecry, AoE) mit voller Info (wer, welche Karte/Emoji/Element, Schaden, Opfer) und legt beim Sieg den toedlichen Schlag ab. So kann der Client ihn exakt nachspielen statt nur Text zu zeigen. Greift in Duell **und** Free-for-All.
- **Replay-Button:** Auf dem Sieg-Screen spielt "🎬 Todesstoß in Zeitlupe ansehen" den Moment beliebig oft nach.

### Geaendert
- **"So endete es" + Schlachtchronik richtig herum:** Beide zeigen jetzt die **neuesten** Aktionen zuerst (die History ist neueste-zuerst gespeichert; vorher wurden faelschlich die aeltesten Zeilen gezeigt bzw. die Chronik scrollte von neuen Aktionen weg).
- **Mehr Kampf-Texte auf Deutsch:** Sieg-/Angriffs-/Battlecry-/Heldenkraft-Logs, die noch englisch waren (z.B. "is Victorous", Steady Shot, Dr. Marc, Ragnaros), uebersetzt - tauchen u.a. im "So endete es"-Block auf.

### Hinweis
- Reduced-Motion: das Kino spielt eine kurze, ruhige Fassung. Self-cleanup, kein Einfluss aufs Spiel-State.

## [2.9.1] - FFA-Lobby-Fix + hellerer Mana-Glow + epischer Todes-Moment

### Behoben
- **FFA-Lobby-Haenger (kritisch):** Nach einem Free-for-All kam man nicht zurueck in die Lobby - egal was man klickte, es zog einen zurueck in den (beendeten) Raum. Ursache: der verlassende Spieler blieb Broadcast-Mitglied + nachzuegelnde Updates zogen zurueck. Fix: Server entfernt den Sitz beim Verlassen in JEDER Phase, Client ignoriert Raum-Updates nach bewusstem Verlassen (`hasLeftRoomRef`). Browser-getestet.

### Geaendert
- **Mana-Glow deutlich heller:** Spielbare Handkarten leuchten jetzt kraeftig gruen + pulsieren + heller; nicht spielbare sind klar abgedunkelt (mehr Kontrast). Henry-Feedback: "muss hell leuchten".

### Hinzugefuegt
- **Epischer Todes-Moment:** Wenn ein Held auf 0 faellt, gibt es jetzt eine fette Explosion (Schockwellen + Splitter + Totenkopf + blutroter Bildschirm-Puls) + tiefen Untergangs-Boom-Sound.
- **"So endete es":** Der Sieg-Bildschirm (Duell + FFA) zeigt jetzt die letzten Log-Zeilen, damit man sieht, was der entscheidende Zug war.
- (Offen/naechste Session: voller Zeitlupen-Replay des letzten Zuges mit Karten-Praesentation - siehe docs/RESUME.md.)

## [2.9.0] - Klassen-Identitaet, echtes Einfrieren, Sichtbarkeit + Balance

### Hinzugefuegt
- **Klassen-Identitaet (endlich eigene Decks):** Jede Klasse hat jetzt einen eigenen Themen-Stapel + 2 exklusive Signaturkarten. Mage = Frost/Feuer (**Blizzard** + Wasserelementar), Priest = Heilung/Schatten (**Heilige Nova** + Tempelwaechter), Hunter = Bestien/Aggro (**Mehrfachschuss** + Schreckenswolf), Paladin = Licht/breit (**Goettlicher Sturm** + Silberhand-Ritter). Die Legendaeren sind nicht mehr in jedem Deck gleich.
- **Spielbar-Anzeige:** Handkarten, die du dir leisten kannst, leuchten gruen + heben sich an; nicht spielbare sind abgedunkelt. Aktualisiert sich live mit dem Mana (Duell + FFA).
- **Eis-Optik:** Eingefrorene Diener bekommen einen blauen Eis-Schleier + ❄️-Marke + cyanfarbenen Rand.
- **Keywords immer sichtbar:** Spott 🛡️, Ansturm ⚡, Gottesschild ✨ und Eingefroren ❄️ als deutliche Emoji-Chips direkt auf der Karte (auch am Handy ohne Hover) - besonders bei geschmiedeten Karten. Gottesschild hat zusaetzlich einen goldenen Schimmer-Ring.

### Behoben
- **Einfrieren wirkt jetzt wirklich:** Mage "Chilled Arcana" + Blizzard frieren Diener echt ein - sie ueberspringen ihren naechsten Angriff (vorher rein kosmetisch, der Diener konnte trotzdem angreifen).
- **Mind Spike nur noch temporaer:** Der Angriffs-Malus (-1) wird beim naechsten Zug des Dieners zurueckgegeben (vorher dauerhaft).

### Geaendert (Balance - alles dokumentiert in docs/BALANCE-CHANGES.md, leicht aenderbar)
- **Marc's Champion** 5 -> 6 Mana (war als 5-Mana-Sofortschlag zu stark).
- **Dr. Marc** Boom-Bots 1 -> 2 Schaden je Treffer (war zu schwach fuer 7 Mana).
- **Paladin "Holy Light"** 1/1 -> 2/2 (Schaden + Heilung), Klasse aufgewertet. Plus neuer Goettlicher Sturm staerkt Paladin-Breite.
- **Goetter-Wuerfel** Stat-Budget leicht gesenkt (tier*2 statt tier*2+1).

### Technik / getestet
- FFA-Vollspiel mit allen 4 Klassen-Decks + neuen Zaubern: sauber durchgelaufen, 0 Crashes. 1v1-Duell + FFA-Pfade beide intakt.

## [2.8.0] - Free-for-All: Dreieck (3) + Chaos (4) Spieler

### Hinzugefuegt
- **Free-for-All-Modus (Spassmodus, jeder gegen jeden):** 3-Spieler-Dreieck + 4-Spieler-Chaos. In der Lobby zwei neue Buttons (🔺 Dreieck / 💥 Chaos), Beitritt per Raum-Code, Warteraum mit Sitzliste, Start ab 3 Spielern. Sieg = letzter Ueberlebender.
- **Eigener Render-Pfad (`FfaGame.tsx`):** Gegner oben im Dreieck/Kreuz angeordnet, du unten. Ziel-Wahl pro Gegner: Zauber/Angriff/Heldenkraft fragen "welchen Gegner?" und treffen genau den (Held oder Diener antippen). AoE (Flammenwoge/Weihe/Sprengfalle) trifft ALLE Gegner, Random-Effekte (Ragnaros, Dr. Marc) streuen ueber alle Gegner, Marc's Breath zielbar.
- **Architektur:** komplett paralleler Pfad gated auf `room.mode==="ffa"` (`room.players[]`). Das 1v1-Duell (player1/player2) bleibt byte-fuer-byte unangetastet.

- **Kampf-Animationen auch in FFA:** dieselbe FX-Engine wie im Duell - Treffer-Wackeln + Schadenszahlen + Funken, Tod-Rauch, roter Bildschirm-Flash wenn dein Held getroffen wird, Angreifer-Lunge, Projektile/Runenkreis bei Zaubern & Heldenkräften, Rundenstart-Schwerter beim Zugwechsel.
- **Alchemie-Schmiede auch in FFA:** Götter-Würfel + Selber-Bauen (eigene Komponente `FfaForge.tsx`). Server-Handler (CREATE_CUSTOM_CARD / ROLL_FORGE_DICE) jetzt FFA-tauglich, Kosten weiter server-autoritativ. Schmiede-Button neben "Zug beenden".
- **Lobby-Tagline gekürzt** (nur noch "Ein dunkles Kartenspiel aus Eis und Blut." + Game-Design-Credit).

### Technik / getestet
- Server-Engine headless geprueft: 3er + 4er Vollspiel (Zug-Rotation ueberspringt Tote/Offline, Eliminationen, last-standing-Sieg, 0 Crashes).
- Browser-E2E mit 3 echten Clients: erstellen/joinen/starten/Heldenkraft/Board-Render/Zugwechsel, keine Laufzeitfehler.
- 1v1-Regression intakt (Forge-Trust + Bot-Battlecry weiter gruen).
- Reconnect ist Best-Effort (Sitz per Name). 2v2 bewusst (noch) weggelassen.

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
