# Marcgard - KI-Balancing-Plan (Entwurf, 2026-06-22)

Henry will: Karten-Performance tracken + mit KI/Agenten auswerten und Balance vorschlagen.
Hier mein Konzept + ehrliche Einschaetzung was Sinn macht und in welcher Reihenfolge.

## Kern-Erkenntnis: zwei Datenquellen, nicht eine

Balance braucht VIELE Spiele, um aussagekraeftig zu sein. Bei 2 Mann + kleiner Community
sind echte Spiele zu wenig (statistisches Rauschen). Loesung: zwei Quellen.

1. **Bot-Self-Play (JETZT moeglich, KEINE DB noetig).** Wir haben lokale Bots + den Headless-Harness
   (genau das, womit ich die neuen Karten teste). Damit lassen sich **tausende Bot-vs-Bot-Spiele**
   ueber Nacht fahren und pro Karte messen. Riesige Stichprobe, sofort, gratis, ohne Login.
   -> Das ist der Haupthebel und das, was zuerst gebaut wird.
2. **Echte-Spieler-Daten (spaeter, BRAUCHT DB/Login = Phase C).** Liefert das, was Bots NICHT koennen:
   menschliches Meta, welche Karten Menschen gut/schlecht spielen, Spass-Signal (wie lange gespielt).
   Verfeinert die Bot-Daten, ersetzt sie nicht.

## Was getrackt wird (gilt fuer beide Quellen)

Pro Spiel ein kompaktes Ergebnis-Objekt:
- Spiel-ID, Modus, Klassen beider Seiten, Sieger-Klasse, Rundenzahl, Datum.
- Pro Karte: gezogen? gespielt? in welcher Runde? am Ende auf dem Brett / im Friedhof?
- Ausgang gekoppelt: hat die Seite, die Karte X gespielt hat, gewonnen?

Daraus die Metriken:
- **Win-Rate-when-played** pro Karte (wichtigste Zahl): Karten deutlich ueber/unter 50% = Verdaechtige.
- **Play-Rate** (wie oft ueberhaupt gespielt, wenn gezogen): nie gespielte Karten = totes/zu-teures Design.
- **Klassen-Paritaet:** Win-Rate je Klasse (Ziel ~50% bei Spiegel-Pool).
- **Matchup-Matrix** Klasse gegen Klasse (Schere-Stein-Papier-Check).
- **Durchschnittliche Spiellaenge** (zu kurz = Aggro zu stark, zu lang = Stall).

## Der KI-/Agenten-Teil (so wuerde ich es bauen)

Nicht "KI spielt das Spiel", sondern **KI liest die aggregierten Zahlen und schlaegt Tuning vor.** Ablauf:

1. **Sammeln:** Headless-Sim-Harness faehrt z.B. 5.000 Bot-Spiele, schreibt eine Stats-Tabelle
   (`card_id, played, wins, winrate, playrate`).
2. **Analyse-Agent:** ein Agent bekommt die Tabelle + die Karten-Werte aus `constants.ts` und soll:
   - Ausreisser finden (Win-Rate > ~58% oder < ~42% bei genug Stichprobe).
   - je Ausreisser eine **konkrete, kleine** Wertaenderung vorschlagen (z.B. "Fenris-Brut Welpen 2/2 -> 1/1",
     "Marcs Bann 3 -> 4 Mana") mit Begruendung.
   - NICHT selbst committen.
3. **Gegen-Agent (optional, fuer Vertrauen):** zweiter Agent prueft die Vorschlaege adversarial
   ("ist die Karte wirklich zu stark, oder gewinnt nur die Klasse drumrum?").
4. **Henry entscheidet:** Vorschlaege als Tabelle, du vetost/aenderst, ich setze die abgenickten Werte
   in `constants.ts` + fahre die Sim nochmal -> Vorher/Nachher-Vergleich. Schleife.

Das passt perfekt zur bestehenden Struktur (1 Karte = 1 templateId + Werte in `constants.ts`),
und zu Henrys "Agententeam"-Arbeitsweise.

## Ehrliche Einschaetzung

- **Bot-Self-Play-Balancing: sehr sinnvoll, machbar JETZT, hoher Wert.** Grosse Stichprobe ohne DB.
  Einschraenkung: Bots spielen simpel/gierig -> sie finden keine cleveren Combos, die Menschen finden.
  Also gut fuer grobe Ausreisser (klar OP/zu schwach), nicht fuer feines High-Level-Meta.
  Gegenmittel: Bot-KI etwas schlauer machen ODER Mensch-Daten spaeter dazu.
- **Echte-Spieler-Tracking: sinnvoll, aber erst mit DB/Login (Phase C) und erst ab echtem Playerbase.**
  Vorher liefert es zu wenig Daten, um den Aufwand zu lohnen.
- **Reihenfolge passt zu Henrys Plan:** kleines Balancing (von Hand, jetzt) -> Login+DB -> dann
  Sim-Harness + Agenten-Auswertung scharfstellen -> mit echten Daten verfeinern.

## Konkrete naechste Schritte (wenn wir das angehen)

1. `sim/` Harness: Bot-vs-Bot, beide Seiten lokal, N Spiele, schreibt `sim/stats.json`. (Kein Server/DB.)
2. Stats-Aggregator (Win-Rate/Play-Rate je Karte + Klassen-Matrix).
3. Analyse-Agent-Prompt + Vorschlags-Tabelle.
4. Schleife mit Henry (vetolen, anwenden, re-simulieren).
5. Spaeter: gleiche Stats-Felder aus echten Spielen in die DB (Phase C) -> selber Auswerter, mehr Signal.

## Status
- Plan-Entwurf, noch nicht gebaut. Reihenfolge laut Henry 2026-06-22:
  **Soße -> kleines Balancing -> Login+DB -> Random-Deck-Schnellduell -> neue Helden.**
- Bot-Self-Play-Sim ist der erste konkrete Baustein und braucht NICHTS von Henry (kein Key, keine DB).
