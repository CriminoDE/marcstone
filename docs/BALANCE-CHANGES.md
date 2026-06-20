# Marcgard - Balance-Aenderungen (v2.9)

Autonom umgesetzt, **alles leicht aenderbar** - sag einfach welchen Wert du anders willst.
Werte stehen in `src/constants.ts` (Karten/Kraefte) bzw. `server.ts` (Effekt-Zahlen).

## Geaendert in v2.9

| Was | Vorher | Jetzt | Warum |
|---|---|---|---|
| **Marc's Champion** (`m_champion`) | 5 Mana 4/5 Gottesschild+Ansturm | **6 Mana** 4/5 (Rest gleich) | War als 5-Mana-Sofortschlag in jedem Deck zu stark (Balance-Review-Befund). |
| **Dr. Marc** (`dr_boom`) Boom-Bots | 3x je **1** Schaden | 3x je **2** Schaden | 7-Mana-Legendaerer war zu schwach (kein Body-Bonus). |
| **Paladin "Holy Light"** | 1 Schaden / 1 Heilung | **2 / 2** | Paladin war die schwaechste Klasse, hatte keine Tempo-/Reichweiten-Kraft. |
| **Goetter-Wuerfel** Stat-Budget | tier*2 **+1** | tier*2 | War leicht ueberstattet (Stats > Einsatz). |

## Neue Karten (v2.9, je 2 exklusiv pro Klasse)

| Karte | Klasse | Mana | Effekt |
|---|---|---|---|
| Blizzard | Mage | 5 | 2 Schaden an allen Gegner-Dienern + einfrieren |
| Wasserelementar | Mage | 4 | 3/6 Koerper (Frost-Mauer) |
| Heilige Nova | Priest | 5 | 2 an Gegner-Dienern, +2 Leben fuer eigene Seite |
| Tempelwaechter | Priest | 4 | 3/6 Spott |
| Mehrfachschuss | Hunter | 4 | 2 zufaellige Gegner-Ziele je 3 Schaden |
| Schreckenswolf | Hunter | 2 | 3/2 Ansturm |
| Goettlicher Sturm | Paladin | 5 | alle eigenen Diener +1/+1 |
| Silberhand-Ritter | Paladin | 4 | 4/4 Gottesschild |

## Noch offen / moegliche naechste Balance-Calls (mit dir)
- Sind die neuen Zauber-Manakosten passend? (Blizzard 5, Heilige Nova 5, Goettlicher Sturm 5 - evtl. 4?)
- m_champion 6 Mana ok, oder lieber 5 Mana / 3-4 Werte?
- Klassen-Paritaet nach ein paar Runden nochmal pruefen.
