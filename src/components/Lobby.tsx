import React, { useState } from "react";
import { HeroClass, OpenRoomInfo, OnlinePlayerInfo } from "../types";
import { HERO_POWERS_LIST } from "../constants";
import { generateVikingName } from "../utils/names";
import { Glossary } from "./Glossary";

interface LobbyProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedClass: HeroClass;
  setSelectedClass: (heroClass: HeroClass) => void;
  roomIdInput: string;
  setRoomIdInput: (room: string) => void;
  onCreateRoom: (vsAI: boolean, mode?: "duel" | "ffa" | "2v2", maxPlayers?: number) => void;
  onJoinRoom: () => void;
  errorMsg: string | null;
  openRooms: OpenRoomInfo[];
  onlinePlayers: OnlinePlayerInfo[];
  leaderboard: { name: string; score: number }[];
  onQuickJoin: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
}

const CLASS_INFO: Record<HeroClass, { emoji: string; tag: string }> = {
  Mage: { emoji: "🧙‍♀️", tag: "Zauberfeuer" },
  Priest: { emoji: "🩹", tag: "Heilung" },
  Hunter: { emoji: "🏹", tag: "Druck" },
  Paladin: { emoji: "🫡", tag: "Schildwall" },
};

const CLASSES: HeroClass[] = ["Mage", "Priest", "Hunter", "Paladin"];

export function Lobby({
  playerName,
  setPlayerName,
  selectedClass,
  setSelectedClass,
  roomIdInput,
  setRoomIdInput,
  onCreateRoom,
  onJoinRoom,
  errorMsg,
  openRooms,
  onlinePlayers,
  leaderboard,
  onQuickJoin,
  onDeleteRoom,
}: LobbyProps) {
  const powers = HERO_POWERS_LIST[selectedClass];
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      {showGlossary && <Glossary onClose={() => setShowGlossary(false)} />}
      <button
        type="button"
        onClick={() => setShowGlossary(true)}
        className="fixed top-3 right-3 z-40 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-mg-bronze/50 bg-mg-void/70 text-mg-bronze-bright hover:border-mg-bronze cursor-pointer"
        title="Spielregeln & Begriffe"
      >
        📖 Glossar
      </button>
      {/* Header */}
      <header className="text-center mb-9">
        <h1 className="font-display font-black text-6xl md:text-8xl tracking-[0.05em] uppercase text-mg-frost-text drop-shadow-[0_3px_28px_rgba(95,168,214,0.3)]">
          Marc<span className="text-mg-bronze drop-shadow-[0_2px_20px_rgba(176,132,59,0.55)]">gard</span>
        </h1>
        <p className="text-mg-fog mt-3 text-sm md:text-base max-w-md mx-auto leading-relaxed font-body italic">
          Ein dunkles Kartenspiel aus Eis und Blut.
        </p>
        <p className="font-display text-mg-bronze/60 mt-3 text-[11px] md:text-xs tracking-[0.25em] uppercase">
          Game Design: Marc Haevernick
        </p>
      </header>

      {errorMsg && (
        <div className="mb-5 bg-mg-blood/15 border border-mg-blood-bright/40 text-mg-frost-text p-3 rounded-xl text-xs font-body flex items-center gap-2.5">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PLAY PANEL */}
      <section className="mg-panel rounded-2xl p-6 md:p-8 mb-6">
        {/* Name */}
        <label className="block text-[11px] font-display font-bold text-mg-bronze uppercase tracking-[0.15em] mb-2">
          Dein Name
        </label>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.substring(0, 15))}
            placeholder="Name des Duellanten..."
            className="flex-1 bg-mg-void/70 border border-mg-stone rounded-xl px-4 py-3 text-sm text-mg-frost-text font-body focus:outline-none focus:border-mg-bronze transition-all"
          />
          <button
            type="button"
            onClick={() => setPlayerName(generateVikingName())}
            title="Neuer nordischer Name"
            className="px-4 rounded-xl bg-mg-slate-raised border border-mg-stone text-lg text-mg-fog hover:text-mg-frost-text hover:border-mg-stone-light cursor-pointer transition-all"
          >
            🎲
          </button>
        </div>

        {/* Deck / Class */}
        <label className="block text-[11px] font-display font-bold text-mg-bronze uppercase tracking-[0.15em] mb-2">
          Wähle dein Deck
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CLASSES.map((cls) => {
            const info = CLASS_INFO[cls];
            const active = selectedClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border cursor-pointer transition-all ${
                  active
                    ? "border-mg-bronze bg-mg-bronze/10 shadow-[0_0_18px_rgba(176,132,59,0.25)] -translate-y-0.5"
                    : "border-mg-stone bg-mg-void/40 hover:border-mg-stone-light"
                }`}
              >
                <span className="text-2xl md:text-3xl">{info.emoji}</span>
                <span className={`text-[10px] md:text-xs font-display font-bold tracking-wide ${active ? "text-mg-frost-text" : "text-mg-fog"}`}>
                  {cls}
                </span>
              </button>
            );
          })}
        </div>
        {/* Alle drei Heldenkraefte der gewaehlten Klasse - eine waehlst du zu Spielbeginn */}
        <div className="mt-3">
          <div className="text-[9px] text-center text-mg-fog uppercase tracking-[0.15em] font-display mb-1.5">
            3 Heldenkräfte · eine wählst du zu Spielbeginn
          </div>
          <div className="grid grid-cols-3 gap-2">
            {powers.map((p, i) => (
              <div
                key={i}
                title={`${p.name}: ${p.description}`}
                className="flex flex-col items-center text-center gap-1 rounded-xl border border-mg-stone bg-mg-void/40 px-2 py-2.5 hover:border-mg-bronze/60 transition-colors"
              >
                <span className="text-xl leading-none">{p.emoji}</span>
                <span className="text-[10px] font-display font-bold text-mg-bronze-bright leading-tight">{p.name}</span>
                <span className="text-[9px] text-mg-fog font-body leading-snug">{p.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary action */}
        <button
          type="button"
          onClick={() => onCreateRoom(false)}
          className="w-full mt-6 py-4 font-display font-bold text-sm uppercase tracking-[0.12em] rounded-xl cursor-pointer
            bg-gradient-to-b from-mg-bronze-bright to-mg-bronze text-mg-void border border-[#7a5a26]
            shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_0_#6e521f,0_8px_16px_rgba(0,0,0,0.5)]
            active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_0_#6e521f] transition-all"
        >
          ⚔️ Duell erstellen
        </button>

        {/* Free-for-All (Spassmodus) */}
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-mg-fog font-display mb-1.5 text-center">Free-for-All · Spassmodus · jeder gegen jeden</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCreateRoom(false, "ffa", 3)}
              className="flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wide bg-mg-slate-raised text-mg-frost-text border border-mg-blood-bright/40 hover:border-mg-blood-bright hover:bg-mg-blood/15 cursor-pointer transition-all"
            >
              🔺 Dreieck · 3 Spieler
            </button>
            <button
              type="button"
              onClick={() => onCreateRoom(false, "ffa", 4)}
              className="flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wide bg-mg-slate-raised text-mg-frost-text border border-mg-blood-bright/40 hover:border-mg-blood-bright hover:bg-mg-blood/15 cursor-pointer transition-all"
            >
              💥 Chaos · 4 Spieler
            </button>
          </div>
        </div>

        {/* 2v2 (Teams, Bots erlaubt) */}
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-mg-fog font-display mb-1.5 text-center">2v2 · Team gegen Team · Bots erlaubt</div>
          <button
            type="button"
            onClick={() => onCreateRoom(false, "2v2", 4)}
            className="w-full py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wide bg-mg-slate-raised text-mg-frost-text border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/20 cursor-pointer transition-all"
          >
            🛡️ 2v2 erstellen · Teams + Bots
          </button>
        </div>

        {/* Join by code */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            placeholder="CODE EINGEBEN"
            className="flex-1 bg-mg-void/70 border border-mg-stone rounded-xl px-4 py-3 text-xs font-display tracking-[0.25em] text-center text-mg-frost-text focus:outline-none focus:border-mg-frost transition-all uppercase"
          />
          <button
            type="button"
            onClick={onJoinRoom}
            className="px-5 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-mg-slate-raised text-mg-frost-text border border-mg-stone hover:border-mg-frost hover:text-mg-frost cursor-pointer transition-all"
          >
            Beitreten
          </button>
        </div>
      </section>

      {/* OPEN DUELS */}
      {openRooms.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-[11px] font-display font-bold text-mg-bronze uppercase tracking-[0.18em] mb-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-mg-stone" />
            Offene Duelle ({openRooms.length})
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-mg-stone" />
          </h2>
          <div className="space-y-2">
            {openRooms.map((r) => (
              <div
                key={r.roomId}
                className="mg-panel rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-xs text-mg-bronze tracking-widest">{r.roomId}</span>
                    {(r.mode === "ffa" || r.mode === "2v2") ? (
                      <span className="text-[10px] text-mg-blood-bright font-bold">
                        {r.phase === "lobby"
                          ? `${r.mode === "2v2" ? "🛡️ 2v2" : "🔺 FFA"} · ${r.playerCount}/${r.maxPlayers}`
                          : (r.mode === "2v2" ? "🛡️ 2v2 läuft" : "💥 FFA läuft")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-mg-fog">
                        {r.p2Name ? (r.phase === "lobby" ? "⏳ Lobby" : "⚔️ Im Kampf") : "🪑 Wartet"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-mg-frost-text/90 truncate mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.p1Online ? "bg-mg-poison" : "bg-mg-blood-bright"}`} />
                    {(r.mode === "ffa" || r.mode === "2v2") ? (
                      <span className="truncate">{r.p1Name}{r.p2Name ? `, ${r.p2Name}` : ""}{(r.playerCount ?? 0) > 2 ? ` +${(r.playerCount ?? 0) - 2}` : ""}</span>
                    ) : (
                      <>
                        <span className="truncate">{r.p1Name}</span>
                        {r.p2Name && <span className="text-mg-stone-light">vs</span>}
                        {r.p2Name && <span className="truncate">{r.p2Name}</span>}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onQuickJoin(r.roomId)}
                    disabled={(r.mode === "ffa" || r.mode === "2v2") && r.phase !== "lobby"}
                    className="text-[11px] font-display font-bold uppercase tracking-wide bg-mg-bronze hover:bg-mg-bronze-bright text-mg-void py-1.5 px-3 rounded-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {(r.mode === "ffa" || r.mode === "2v2") ? (r.phase === "lobby" ? "Mitspielen" : "Läuft") : r.p2Name ? "Zurückkehren" : "Beitreten"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRoom(r.roomId)}
                    title="Raum löschen"
                    className="text-[11px] border border-mg-stone hover:border-mg-blood-bright bg-mg-void/40 hover:bg-mg-blood/20 text-mg-fog hover:text-mg-frost-text px-2 rounded-lg cursor-pointer transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM: Patch Notes + Rangliste */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Patch Notes */}
        <div className="mg-panel rounded-xl p-4">
          <h3 className="text-[11px] font-display font-bold text-mg-bronze uppercase tracking-[0.15em] mb-3">
            📜 Patch Notes
          </h3>
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            <div>
              <div className="text-[11px] font-display font-bold text-mg-frost-text">v2.13 · Marcs Macht & hellere Hand 🩸</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>4 neue Marc-Legendäre:</b> <b>Zorn des Marc</b> (4 Schaden an ALLEN Dienern, Freund wie Feind), <b>Marcs Fluch</b> (halbiert das Leben eines Ziels), <b>Marc der Seher</b> (zieh 2 Karten, zahl 2 Leben) und <b>Fenrir der Endwolf</b> (6/6 Ansturm).</li>
                <li><b>Handkarten heller:</b> spielbare Karten leuchten jetzt deutlich kräftiger, schwer lesbare dunkle Karten sind aufgehellt.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.12 · Glossar, Eis & frisches Blut 📖</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>Glossar</b> (📖 oben rechts): erklärt alle Schlüsselwörter, den Spielablauf und die Modi.</li>
                <li><b>Eis-Optik aufgehübscht:</b> eingefrorene Karten glitzern jetzt richtig, und Blizzard lässt einen Frost-Schwall über den Bildschirm ziehen.</li>
                <li><b>Neue Marc-Karten:</b> Marcs Raben, Marksmann des Marc, Wächter des Nordens. Plus deutlich mehr fiese Wikinger-Sprüche.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.11 · 2v2 + Bots 🛡️</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>Neuer 2v2-Modus:</b> Team gegen Team. Im Warteraum Team A/B wählen, leere Plätze mit <b>Bots</b> füllen - ihr braucht also keine 4 echten Leute.</li>
                <li>Schaden trifft nur das Feind-Team, Heilung/Heilige Nova wirkt auf Verbündete. Verbündeten-Panel zeigt den Partner, Sieg = letztes Team steht.</li>
                <li><b>Bots auch im Free-for-All:</b> Übungsgegner lassen sich jetzt auch in FFA dazuholen.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.10 · Todesstoß in Zeitlupe 🎬</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>Sieg-Replay in Zeitlupe:</b> Wenn ein Held fällt, präsentiert sich die tödliche Karte groß und schlägt in Slow-Mo zu - riesige Schadenszahl, dann epische Todes-Explosion + Boom.</li>
                <li>Funktioniert für Diener-Angriffe, Zauber, Heldenkräfte und Battlecries - im Duell <b>und</b> im Free-for-All.</li>
                <li>Sieg-Screen: Button <b>„Todesstoß in Zeitlupe ansehen"</b> spielt den Moment beliebig oft nach.</li>
                <li>Schlachtchronik & „So endete es" zeigen jetzt die <b>neuesten</b> Aktionen zuerst, viele Kampf-Texte auf Deutsch.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.9.1 · Fixes & Wucht 💥</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>Free-for-All:</b> Rückkehr in die Lobby gefixt (hing vorher nach Spielende).</li>
                <li>Spielbare Karten <b>leuchten jetzt richtig hell</b> grün, nicht-spielbare sind dunkel.</li>
                <li><b>Epischer Todes-Moment:</b> Explosion + Boom-Sound wenn ein Held fällt; Sieg-Screen zeigt den letzten Zug.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.9 · Klassen & Eis ❄️</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li><b>Eigene Klassen-Decks:</b> Mage = Frost/Feuer (Blizzard), Priest = Heilung/Schatten (Heilige Nova), Hunter = Bestien (Mehrfachschuss), Paladin = Licht (Göttlicher Sturm). 8 neue Karten.</li>
                <li><b>Einfrieren wirkt jetzt wirklich</b> - eingefrorene Diener überspringen ihren Angriff, mit blauer Eis-Optik ❄️.</li>
                <li><b>Spielbare Karten leuchten</b> (genug Mana) statt alles grau. Keywords (Spott/Ansturm/Gottesschild) jetzt deutlich auf der Karte.</li>
                <li>Balance: Marc's Champion 6 Mana, Dr. Marc stärker, Paladin aufgewertet.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.8 · Free-for-All 🔺</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Neuer Spassmodus: <b>Dreieck (3 Spieler)</b> und <b>Chaos (4 Spieler)</b>, jeder gegen jeden. Letzter Überlebender gewinnt.</li>
                <li>Gegner oben im Dreieck angeordnet, du wählst bei Zaubern/Angriffen genau welchen Gegner du triffst.</li>
                <li>Flächenzauber treffen alle Gegner, Ragnaros & Dr. Marc streuen über alle. Beitritt per Raum-Code, Start ab 3 Spielern.</li>
                <li>Volle Kampf-Animationen auch im Free-for-All: Treffer, Schadenszahlen, Tod-Rauch, Lunge, Zauber-Projektile, Rundenstart-Schwerter.</li>
                <li>Alchemie-Schmiede (Götter-Würfel + Selber-Bauen) jetzt auch im Free-for-All.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.7 · Fairer Übungsgegner</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Holgar löst jetzt Battlecries aus (Firelord, Dr. Marc, Marc's Breath & Co.) statt sie als stumme Körper zu spielen - deutlich härterer Gegner.</li>
                <li>Schmiede gegen Schummeln abgesichert: Karten-Kosten werden serverseitig berechnet, kein 0-Mana-10/10 mehr möglich.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.6 · Karten-Fixes</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Meteor & Gedankenkontrolle funktionieren jetzt - waren vorher tote Karten (Mana verpufft).</li>
                <li>Zugwechsel-Bug behoben (kein doppeltes Weiterschalten mehr bei knapper Zeit).</li>
                <li>Übungsgegner verschmutzt nicht mehr die Ruhmeshalle.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.5 · Alles Deutsch + sauberes Angreifen</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Komplett auf Deutsch (Karten, Texte, Menüs, Kampf-Emotes).</li>
                <li>Angreifen am Handy gefixt: der Hinweis blockiert nicht mehr, du triffst den Helden sauber.</li>
                <li>Angriffsbereite Diener leuchten grün, schon eingesetzte sind ausgegraut - sofort erkennbar.</li>
                <li>Mehr Zeit pro Zug (45 statt 30 Sek). Gegner-Anzeige am Handy aufgeräumt.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.4 · Würfel & Drachenatem</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>🎲 Götter-Würfel in der Schmiede: zufällige Karte ~1 Stufe über dem Einsatz, mehrfach nutzbar (steigende Mana-Kosten).</li>
                <li>Marc's Breath: du wählst jetzt selbst welchen Helden du auf 15 setzt (auch dich selbst zum Heilen).</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.3 · Karten lesen</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Karte antippen öffnet jetzt eine große Vorschau (kein Verklicken mehr) - mit Werten + Schlüsselwort-Erklärungen, auch am Handy.</li>
                <li>Erst „Beschwören/Wirken“ spielt die Karte wirklich aus.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.2 · Sichtbare Magie</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Zauber & Heldenschüsse fliegen sichtbar (Geschoss/Pfeil) + Runenkreis je Element.</li>
                <li>Treffer machen jetzt Geräusch, Held-Treffer zeigt Schadenszahl + roten Blitz.</li>
                <li>Kampflog sagt klar wer wie viel Schaden macht (mit Lebens-Differenz).</li>
                <li>Rundenstart-Schwerter. Lobby zeigt alle 3 Heldenkräfte.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.1 · Blut & Stahl</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Kampf-Animationen: Figuren stürmen ins Ziel, Treffer wackeln, Schadenszahlen fliegen, Gefallene zerstäuben.</li>
                <li>Eigener Held getroffen = roter Bildschirm-Flash.</li>
                <li>Fällt ein Held unter 10 Leben, wird der Schnee zu blutrotem Regen.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v2.0 · Marcgard erwacht</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Dunkel-nordische Optik, Schnee und fliegende Raben.</li>
                <li>Neuer Name, neue Schrift, neue Lobby.</li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-display font-bold text-mg-fog">v1.6 · Festung</div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px] text-mg-fog font-body">
                <li>Stabiler Online: Auto-Reconnect, kein Rausfliegen mehr.</li>
                <li>Zug beenden = gedrückt halten. Lauteres Timer-Ticken.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mg-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-display font-bold text-mg-bronze uppercase tracking-[0.15em]">
              🏆 Halle des Ruhms
            </h3>
            <span className="text-[10px] text-mg-fog font-body flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mg-poison" />
              {onlinePlayers.length} online
            </span>
          </div>
          <div className="max-h-52 overflow-y-auto pr-1">
            {leaderboard.length === 0 ? (
              <div className="text-[11px] text-mg-fog italic font-body py-2">Noch keine Siege verzeichnet. Sei der Erste.</div>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.map((lb, idx) => (
                  <div key={lb.name} className="flex justify-between items-center text-[11px] font-body border-b border-mg-stone/40 pb-1.5 last:border-0">
                    <span className={`font-bold ${idx === 0 ? "text-mg-bronze-bright" : idx === 1 ? "text-mg-frost-text" : idx === 2 ? "text-mg-bronze" : "text-mg-fog"}`}>
                      {idx + 1}. {lb.name}
                    </span>
                    <span className="text-mg-bronze font-bold">{lb.score} {lb.score === 1 ? "Sieg" : "Siege"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
