import React from "react";
import { HeroClass, OpenRoomInfo, OnlinePlayerInfo } from "../types";
import { HERO_POWERS } from "../constants";

interface LobbyProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedClass: HeroClass;
  setSelectedClass: (heroClass: HeroClass) => void;
  roomIdInput: string;
  setRoomIdInput: (room: string) => void;
  onCreateRoom: (vsAI: boolean) => void;
  onJoinRoom: () => void;
  errorMsg: string | null;
  openRooms: OpenRoomInfo[];
  onlinePlayers: OnlinePlayerInfo[];
  leaderboard: {name: string, score: number}[];
  onQuickJoin: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
}

const CLASS_DESCRIPTIONS: Record<HeroClass, { role: string; desc: string; emoji: string }> = {
  Mage: {
    role: "Spells and Firepower",
    desc: "Uses Fireballs, Arcane attacks, and destructive Pyroblasts to control the field directly.",
    emoji: "🧙‍♀️",
  },
  Priest: {
    role: "Wounded Healing & Endurance",
    desc: "Heals minions or the hero to outlast opponents in strategic fatigue matches.",
    emoji: "🩹",
  },
  Hunter: {
    role: "Aggressive direct pressure",
    desc: "Summons agile beasts and attacks the enemy hero with steady archery shots.",
    emoji: "🏹",
  },
  Paladin: {
    role: "Tokens and Reinforcements",
    desc: "Surrounds the opponent with Silver Hand Recruits, Divine Shields, and Consecrations.",
    emoji: "🫡",
  },
};

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
  const [vsAI, setVsAI] = React.useState(false);
  const classesList: HeroClass[] = ["Mage", "Priest", "Hunter", "Paladin"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Sleek Hero header */}
      <div className="text-center mb-6">
        <span className="text-xs bg-amber-500/10 text-amber-500 font-mono font-bold px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest">
          🔮 Online Real-time Card Arena
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mt-4 font-sans uppercase">
          Markcraft <span className="text-amber-500">Stone</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          A real-time multiplayer card game inspired by Hearthstone. Play with your brother instantly across devices!
        </p>

        {/* Patch Notes */}
        <div className="mt-6 max-w-lg mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-left">
          <h3 className="text-xs font-mono font-bold text-amber-500 tracking-widest uppercase mb-2">📜 Patch Notes v1.5.0</h3>
          <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4 font-sans">
            <li><strong>Leaderboard:</strong> Neue Ehrenhalle in der Lobby zählt deine verdienten Siege!</li>
            <li><strong>Alchemie-Schmiede:</strong> Das Tippen der Werte (Angriff/Leben) ist reibungsloser. Nun wirklich nur noch EINMAL pro Match nutzbar.</li>
            <li><strong>Reconnect-Schutz:</strong> Das Spiel verlangt nun strikt, beim Rejoinen deine originale Klasse zu wählen.</li>
            <li><strong>Audio Cues:</strong> New deep warnings at 10s and urgent high-pitched beeps at 5s added for the turn timers!</li>
            <li><strong>New Cards Added:</strong> Added tricky & powerful combinations for each class.</li>
          </ul>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-950/40 border border-red-500/40 text-red-300 p-4 rounded-2xl text-xs font-mono flex items-center gap-3 animate-pulse">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Nickname and Class selections */}
        <div className="lg:col-span-2 space-y-6 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 shadow-xl">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Choose your Duelist Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.substring(0, 15))}
              placeholder="Enter duelist name..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-sans transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Choose your Hero Class
            </label>
            <div className="grid grid-cols-2 gap-3">
              {classesList.map((heroClass) => {
                const info = CLASS_DESCRIPTIONS[heroClass];
                const power = HERO_POWERS[heroClass];
                const isSelected = selectedClass === heroClass;
                return (
                  <button
                    key={heroClass}
                    type="button"
                    onClick={() => setSelectedClass(heroClass)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-36 relative overflow-hidden
                      ${isSelected 
                        ? "border-amber-500 bg-amber-950/20 text-white shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-102" 
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700/60"
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
                          {info.role}
                        </span>
                        <h3 className="text-base font-bold text-white font-sans mt-0.5 flex items-center gap-1.5">
                          <span>{info.emoji}</span>
                          <span>{heroClass}</span>
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-[10px] text-slate-400 leading-tight flex-1">
                      {info.desc}
                    </div>

                    {/* Miniature power display */}
                    <div className="mt-2 pt-1 border-t border-slate-850 flex items-center gap-1.5 text-[9px] font-mono text-amber-500/90 bg-slate-900/30 -mx-4 -mb-4 px-4 py-1.5">
                      <span className="font-sans text-xs">{power.emoji}</span>
                      <span className="font-bold underline">{power.name}:</span>
                      <span className="truncate max-w-[140px] text-slate-400">{power.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Room creation & joining controls */}
        <div className="space-y-6">
          {/* Room actions box */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                3. Create or Join a Duel
              </h3>

              {/* Action: Create room */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <div>
                  <h4 className="text-xs font-sans font-bold text-white">Direct Host Connection</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Start a matchmaking room instantly. You'll receive a Room Code to send to your brother.
                  </p>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={vsAI}
                    onChange={(e) => setVsAI(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-600 bg-slate-900" 
                  />
                  <span className="text-[10px] font-mono text-purple-300 font-bold tracking-wide">PLAY AGAINST GEMINI AI 🧠</span>
                </label>

                <button
                  type="button"
                  onClick={() => onCreateRoom(vsAI)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs py-3 px-4 rounded-xl shadow-md cursor-pointer transition-all hover:scale-103 text-center uppercase tracking-wider"
                >
                  Create Game Room 🚀
                </button>
              </div>

              {/* Action: Join Room */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <div>
                  <h4 className="text-xs font-sans font-bold text-white">Join Existing Match</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Enter the code shared with you to join your brother's arena.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={onJoinRoom}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs px-4 rounded-xl cursor-pointer transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {/* Quick instructions guide */}
            <div className="mt-6 pt-4 border-t border-slate-850 text-[10px] text-slate-400 space-y-2 leading-relaxed">
              <h5 className="font-mono font-bold text-slate-300 uppercase tracking-widest text-[9px]">How to play (Hearthstone rules)</h5>
              <ul className="list-disc pl-3 space-y-1">
                <li>Both players have 30 health. You lose if your health hits 0.</li>
                <li>Each turn you draw 1 card, and gain +1 Max Mana (up to 10).</li>
                <li>Play minions to defend your hero and attack enemy units.</li>
                <li><strong>Taunt</strong> minions block attacks and MUST be targeted first!</li>
                <li><strong>Divine Shields</strong> absorb the first incoming damage point completely.</li>
                <li><strong>Charge</strong> minions can attack immediately on the turn they're summoned.</li>
                <li>Activate your Hero Power for 2 Mana each turn.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column layout list for Lobby info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-900 pt-8 animate-fade-in">
        
        {/* Active Duels Map */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                🏰 Aktive Duelle & Säle ({openRooms.length}/10)
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                Lobby Live
              </span>
            </div>
            
            {openRooms.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <p className="text-xl">📯</p>
                <p className="text-xs text-slate-400 font-sans mt-2">Das Reich ist ruhig. Keine aktiven Duelle im Augenblick.</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Erstelle oben einen neuen Spielraum und lade jemanden ein!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {openRooms.map((r) => {
                  return (
                    <div key={r.roomId} className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-2xl flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:border-slate-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10">
                            {r.roomId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Status: <span className="font-bold text-slate-350 uppercase">{r.p2Name ? (r.phase === "lobby" ? "⏳ Lobby" : "⚔️ Im Kampf") : "⏳ Wartet"}</span>
                          </span>
                        </div>
                        
                        <div className="text-[11px] text-slate-300 space-y-1 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${r.p1Online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            <span className="text-slate-500 font-mono text-[9px]">P1:</span>
                            <span className="font-medium">{r.p1Name}</span>
                            <span className="text-[10px] text-slate-500">[{r.p1Class}]</span>
                          </div>
                          {r.p2Name ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${r.p2Online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                              <span className="text-slate-500 font-mono text-[9px]">P2:</span>
                              <span className="font-medium">{r.p2Name}</span>
                              <span className="text-[10px] text-slate-500">[{r.p2Class}]</span>
                            </div>
                          ) : (
                            <div className="text-slate-500 italic text-[10px] pl-3">
                              Warte auf Herausforderer...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                        <button
                          type="button"
                          onClick={() => onQuickJoin(r.roomId)}
                          className="flex-1 sm:flex-none text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 px-3 rounded-lg transition-all font-sans uppercase shadow cursor-pointer hover:scale-103"
                        >
                          {r.p2Name ? "Rejoin" : "Join Duel"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => onDeleteRoom(r.roomId)}
                          title="Lösche diesen Raum"
                          className="text-[11px] border border-slate-850 hover:border-red-900 bg-slate-900/50 hover:bg-red-950/40 text-red-400 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Active online players strip */}
          <div className="mt-5 pt-4 border-t border-slate-850">
            <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400 mb-2">
              🔮 Online-Duellanten im Gasthaus ({onlinePlayers.length})
            </h4>
            <div className="flex flex-wrap gap-1.5 border-b border-slate-850 pb-4 mb-4">
              {onlinePlayers.map((player) => (
                <span
                  key={player.id}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-slate-950/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>{player.name}</span>
                </span>
              ))}
              {onlinePlayers.length === 0 && (
                <span className="text-[10px] text-slate-500 italic">Keine Spieler am Tisch...</span>
              )}
            </div>

            {/* Leaderboard  */}
            <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-500 mb-2 flex items-center gap-2">
              🏆 Halle des Ruhms (Leaderboard)
            </h4>
            <div className="bg-slate-950/60 border border-amber-900/15 rounded-xl p-3 max-h-[160px] overflow-y-auto w-full">
               {leaderboard.length === 0 ? (
                 <div className="text-[10px] text-slate-500 italic">Noch keine Siege verzeichnet...</div>
               ) : (
                 <div className="space-y-1.5">
                   {leaderboard.map((lb, idx) => (
                     <div key={lb.name} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/50 pb-1.5 last:border-0 last:pb-0">
                       <span className={`font-bold ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-700" : "text-slate-500"}`}>
                         {idx + 1}. {lb.name}
                       </span>
                       <span className="text-amber-500/80 font-bold bg-amber-500/10 px-2 rounded-full py-0.5">{lb.score} {lb.score === 1 ? "Sieg" : "Siege"}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Parchment Spellbook for Patchnotes */}
        <div className="bg-gradient-to-br from-amber-950/10 via-slate-900/40 to-slate-900/10 border border-amber-900/20 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-3 top-3 opacity-5 pointer-events-none text-8xl font-serif">📖</div>
          
          <div>
            <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              📚 Das Update-Zauberbuch (Patchnotes)
            </h3>
            
            <div className="bg-slate-950/60 border border-amber-900/15 rounded-2xl p-4 space-y-4 max-h-[290px] overflow-y-auto">
              <div className="border-b border-slate-850 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 font-sans">v1.3.0 - Die Mana-Waage der Alchemie</span>
                  <span className="text-[8px] font-mono text-amber-500/70 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">AKTUELL</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                  Fairness im Reich! Die Alchemie-Schmiede berechnet nun Mana-Kosten basierend auf Macht.
                </p>
                <ul className="list-disc pl-3.5 mt-1.5 space-y-1 text-[10px] text-slate-350 font-sans">
                  <li><strong>Dynamische Kosten</strong>: Starke Kombis (z.B. hohe Werte + Ansturm + Gottesschild) kosten mehr Mana.</li>
                  <li><strong>Zauberschriftrollen</strong>: Du kannst nun Zauber fälschen (Schaden, Heilung oder Karten ziehen).</li>
                  <li><strong>Limit der Gier</strong>: Du kannst pro Runde nur noch eine einzige Karte der Alchemie-Schmiede erschaffen! Höchstens 10 Mana.</li>
                </ul>
              </div>

              <div className="border-b border-slate-850 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 font-sans">v1.2.0 - Das Reconnect-Bündnis</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                  Maximale Stabilität für Duelle gegen deinen Bruder! Bei Verbindungsverlusten fliegt nun niemand mehr komplett raus.
                </p>
                <ul className="list-disc pl-3.5 mt-1.5 space-y-1 text-[10px] text-slate-350 font-sans">
                  <li><strong>Lobby & Online-Liste</strong>: Zeigt nun alle offenen Räume im Reich sowie alle gerade aktiven Spieler direkt an.</li>
                  <li><strong>Room Keep-Alive (1 Stunde)</strong>: Matchmaking-Räume bleiben nach Aktivierung für mindestens eine Stunde geöffnet.</li>
                  <li><strong>Reconnection Auto-Join</strong>: Tritt einfach mit demselben Namen bei, um deinen Platz im Spiel sofort wieder zu übernehmen.</li>
                  <li><strong>Ersteller-Zepter (Löschfunktion)</strong>: Ein Klicks auf 🗑️ säubert ungenutzte Räume sofort von der Liste.</li>
                  <li><strong>Limitierung</strong>: Maximal 10 gleichzeitig aktive Räume.</li>
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 font-sans">v1.1.0 - Die Alchemie-Schmiede & Feuereffekte</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                  Eigene Diener und Zauberschriftrollen live während des Duells kreieren!
                </p>
                <ul className="list-disc pl-3.5 mt-1.5 space-y-1 text-[10px] text-slate-450 font-sans">
                  <li><strong>Alchemy Forge</strong>: Personalisiere deine eigenen Kampfkarten mitten im Match.</li>
                  <li><strong>Audio & Visual-Booster</strong>: Soundeffekte und Pyroblasten entfesseln jetzt magische Audiofeedback-Wärme.</li>
                  <li><strong>Mobil-Scroll-Fix</strong>: Kein störendes automatisches Runterscrollen mehr auf Touchgeräten während hektischer Phasen!</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-[8px] font-mono text-amber-500/60 uppercase tracking-widest bg-amber-950/20 px-3 py-1 rounded-full border border-amber-900/10">
              ECWBSB - Gepflegt im Markcraft Archivar
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
