import React from "react";

// Glossar: erklaert Keywords + Spielablauf. Aufrufbar aus Lobby und im Spiel.
// Rein erklaerend, kein Spiel-State. Schliessen per X oder Hintergrund-Klick.

interface Entry { emoji: string; title: string; text: string; }

const KEYWORDS: Entry[] = [
  { emoji: "🛡️", title: "Spott", text: "Gegner MÜSSEN diesen Diener zuerst angreifen, bevor sie den Helden oder andere Diener treffen können." },
  { emoji: "⚡", title: "Ansturm", text: "Darf in der Runde angreifen, in der er gespielt wird (normale Diener müssen eine Runde warten)." },
  { emoji: "🌟", title: "Gottesschild", text: "Der erste Schaden, der diesen Diener trifft, wird komplett geschluckt. Danach ist der Schild weg." },
  { emoji: "❤️", title: "Kampfschrei", text: "Ein Effekt, der einmal auslöst, sobald der Diener von der Hand gespielt wird (z.B. Schaden, Klau, Heilung)." },
  { emoji: "❄️", title: "Eingefroren", text: "Der Diener überspringt seinen nächsten Angriff. Danach taut er auf und kann wieder zuschlagen." },
  { emoji: "💀", title: "Todesröcheln", text: "Ein Effekt, der auslöst, sobald dieser Diener stirbt (z.B. Schaden, Karte ziehen, Welpen beschwören). Wirkt über den Tod hinaus." },
];

const FLOW: Entry[] = [
  { emoji: "💧", title: "Mana", text: "Jede Runde +1 Mana (bis 10). Karten kosten Mana - oben spielbare Karten leuchten grün, zu teure sind abgedunkelt." },
  { emoji: "⚔️", title: "Angreifen", text: "Tippe deinen angriffsbereiten Diener (grün leuchtend) an, dann das Ziel. Der Verteidiger schlägt zurück." },
  { emoji: "✨", title: "Heldenkraft", text: "Einmal pro Runde für 2 Mana. Jede Klasse hat eigene Kräfte (Schaden, Heilung, Diener beschwören …)." },
  { emoji: "🧪", title: "Schmiede", text: "Götter-Würfel = Zufallskarte ~1 Stufe über dem Einsatz (mehrfach, steigende Kosten). Oder 1x pro Spiel selbst eine Karte bauen." },
  { emoji: "🎬", title: "Todesstoß-Kino", text: "Fällt ein Held, wird der entscheidende Schlag groß in Zeitlupe nachgespielt. Auf dem Sieg-Screen jederzeit erneut ansehbar." },
];

const MODES: Entry[] = [
  { emoji: "⚔️", title: "Duell (1v1)", text: "Klassisch einer gegen einen. Wer den gegnerischen Helden auf 0 bringt, gewinnt. Übungsgegner-Bot Holgar möglich." },
  { emoji: "🔺", title: "Free-for-All", text: "3-4 Spieler, jeder gegen jeden. Letzter Überlebender gewinnt. Bots können leere Plätze füllen." },
  { emoji: "🛡️", title: "2v2", text: "Team gegen Team. Schaden trifft nur das Feind-Team, Heilung wirkt auf Verbündete. Letztes Team, das steht, gewinnt." },
];

function Section({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <div className="mb-4">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-mg-bronze font-mono mb-2">{title}</h3>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.title} className="flex gap-2.5 items-start px-3 py-2 rounded-lg bg-mg-void/50 border border-mg-stone">
            <span className="text-lg leading-none mt-0.5 shrink-0">{e.emoji}</span>
            <div>
              <div className="text-sm font-bold text-white">{e.title}</div>
              <div className="text-[11px] text-mg-fog leading-snug">{e.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Glossary({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-mg-void/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-mg-slate to-mg-void border-2 border-mg-bronze/70 rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4 sticky top-0">
          <h2 className="text-lg font-serif font-black text-white uppercase tracking-wide">📖 Glossar</h2>
          <button onClick={onClose} type="button" className="text-mg-fog hover:text-white font-black text-lg px-2 cursor-pointer">✕</button>
        </div>
        <Section title="Schlüsselwörter" entries={KEYWORDS} />
        <Section title="Spielablauf" entries={FLOW} />
        <Section title="Modi" entries={MODES} />
        <p className="text-[10px] text-mg-fog/70 text-center mt-2">Ciao, bleibt sicher. Und haut rein in Marcgard.</p>
      </div>
    </div>
  );
}
