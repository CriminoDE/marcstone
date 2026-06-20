import React, { useState } from "react";
import { RoomState, PlayerState, Card, ClientAction, HeroClass } from "../types";
import { HeroState } from "./HeroState";
import { CardItem } from "./CardItem";
import { Atmosphere } from "./Atmosphere";
import { MusicToggle } from "./MusicToggle";
import { HERO_POWER_COST, HERO_POWERS_LIST } from "../constants";
import { playRaven } from "../utils/audio";

type ToastFn = (m: string, t?: "info" | "warning" | "success") => void;

interface FfaGameProps {
  room: RoomState;
  connectionId: string;
  myName: string;
  sendAction: (a: ClientAction) => void;
  onLeave: () => void;
  showToast: ToastFn;
  timeRemaining: number;
  heroSelectionTimeRemaining: number;
}

type TargetMode = "none" | "spell" | "attack" | "heropower" | "battlecry";
interface Targeting { mode: TargetMode; sourceId?: string }

const FFA_TARGETED_SPELLS = new Set(["arc_shot", "fireball", "meteor", "pyroblast", "heal_touch", "mind_control"]);

function spellNeedsTarget(card: Card): boolean {
  if (card.type !== "spell") return false;
  if (card.templateId === "custom_magic") return card.spellEffect === "damage" || card.spellEffect === "heal";
  return FFA_TARGETED_SPELLS.has(card.templateId);
}
// Heldenkräfte, die vor dem Wirken ein Ziel verlangen.
function heroPowerNeedsTarget(heroClass: HeroClass, idx: number): boolean {
  if (heroClass === "Mage") return idx === 0 || idx === 1;
  if (heroClass === "Priest") return true;
  if (heroClass === "Hunter") return idx === 0;
  if (heroClass === "Paladin") return idx === 1 || idx === 2;
  return false;
}

export function FfaGame({ room, connectionId, myName, sendAction, onLeave, showToast, timeRemaining, heroSelectionTimeRemaining }: FfaGameProps) {
  const [targeting, setTargeting] = useState<Targeting>({ mode: "none" });
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const seats = room.players ?? [];
  const me = seats.find(p => p.id === connectionId) || seats.find(p => p.name === myName);
  const myId = me?.id;
  const isCreator = seats[0]?.id === myId;
  const opponents = seats.filter(p => p.id !== myId);
  const isMyTurn = room.phase === "playing" && !!me && !me.isEliminated && room.turn === myId;
  const power = me ? (HERO_POWERS_LIST[me.heroClass]?.[me.selectedHeroPowerIndex ?? 0]) : undefined;

  const copyCode = () => {
    navigator.clipboard?.writeText(room.roomId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  const cancelTargeting = () => { if (targeting.mode !== "none") { setTargeting({ mode: "none" }); showToast("Zielwahl abgebrochen.", "info"); } };

  // ---- Aktionen ----
  const playCard = (card: Card) => {
    setPreviewCardId(null);
    if (!isMyTurn || !me) return;
    if (card.cost > me.mana) { showToast(`Zu wenig Mana (braucht ${card.cost}).`, "warning"); return; }
    if (card.type === "minion") {
      if (card.battlecryNeedsTarget) { setTargeting({ mode: "battlecry", sourceId: card.id }); showToast("Wähle einen Helden als Ziel (auch dich selbst).", "info"); return; }
      if (me.board.length >= 7) { showToast("Dein Brett ist voll (max 7).", "warning"); return; }
      sendAction({ type: "PLAY_CARD", payload: { roomId: room.roomId, cardId: card.id } });
    } else {
      if (spellNeedsTarget(card)) { setTargeting({ mode: "spell", sourceId: card.id }); showToast("Wähle ein Ziel für den Zauber.", "info"); return; }
      sendAction({ type: "PLAY_CARD", payload: { roomId: room.roomId, cardId: card.id } });
    }
  };
  const startAttack = (minion: Card) => {
    if (!isMyTurn) return;
    if (!minion.isReady) { showToast("Dieser Diener kann diesen Zug nicht angreifen.", "warning"); return; }
    setTargeting({ mode: "attack", sourceId: minion.id });
    showToast("Wähle einen Gegner zum Angreifen.", "info");
  };
  const useHeroPower = () => {
    if (!isMyTurn || !me) return;
    if (me.heroPowerUsed) { showToast("Heldenkraft schon genutzt.", "warning"); return; }
    if (me.mana < HERO_POWER_COST) { showToast(`Heldenkraft kostet ${HERO_POWER_COST} Mana.`, "warning"); return; }
    if (heroPowerNeedsTarget(me.heroClass, me.selectedHeroPowerIndex ?? 0)) {
      setTargeting({ mode: "heropower" });
      showToast("Wähle ein Ziel für die Heldenkraft.", "info");
    } else {
      sendAction({ type: "USE_HERO_POWER", payload: { roomId: room.roomId } });
    }
  };
  const sendAtTarget = (ownerId: string, isTargetHero: boolean, targetId?: string) => {
    const { mode, sourceId } = targeting;
    const roomId = room.roomId;
    if (mode === "spell") sendAction({ type: "PLAY_CARD", payload: { roomId, cardId: sourceId!, targetPlayerId: ownerId, isTargetHero, targetId } });
    else if (mode === "battlecry") sendAction({ type: "PLAY_CARD", payload: { roomId, cardId: sourceId!, targetPlayerId: ownerId, isTargetHero: true } });
    else if (mode === "attack") sendAction({ type: "ATTACK", payload: { roomId, attackerCardId: sourceId!, targetPlayerId: ownerId, isTargetHero, targetCardId: targetId } });
    else if (mode === "heropower") sendAction({ type: "USE_HERO_POWER", payload: { roomId, targetPlayerId: ownerId, isTargetHero, targetId } });
    setTargeting({ mode: "none" });
  };
  const endTurn = () => { if (isMyTurn) sendAction({ type: "END_TURN", payload: { roomId: room.roomId } }); };
  const restart = () => sendAction({ type: "RESTART_GAME", payload: { roomId: room.roomId } });

  // Darf ein Held/Diener gerade als Ziel angeklickt werden?
  const heroTargetable = (p: PlayerState): boolean => {
    if (targeting.mode === "none" || p.isEliminated) return false;
    if (targeting.mode === "attack") return p.id !== myId && !p.board.some(m => m.hasTaunt);
    return true; // spell/heropower/battlecry: jeder Held wählbar
  };
  const minionTargetable = (owner: PlayerState, minion: Card): boolean => {
    if (targeting.mode === "none" || owner.isEliminated) return false;
    if (targeting.mode === "battlecry") return false; // nur Helden
    if (targeting.mode === "attack") {
      if (owner.id === myId) return false;
      const hasTaunt = owner.board.some(m => m.hasTaunt);
      return hasTaunt ? !!minion.hasTaunt : true;
    }
    return true; // spell/heropower: jeder Diener
  };

  // ---- Sub-Renders ----
  const TopBar = () => (
    <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto w-full mb-3">
      <div className="flex items-center gap-2">
        <span className="font-display text-2xl tracking-wide text-mg-frost-text">Marc<span className="text-mg-bronze">gard</span></span>
        <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full bg-mg-blood/20 border border-mg-blood-bright/40 text-mg-frost-text">Free-for-All</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={copyCode} className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-mg-stone bg-mg-void/60 text-mg-fog hover:border-mg-bronze/60">
          {copied ? "✔ kopiert" : `Code ${room.roomId}`}
        </button>
        <button onClick={onLeave} className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-mg-blood-bright/40 bg-mg-blood/15 text-mg-frost-text hover:border-mg-blood-bright">Verlassen</button>
      </div>
    </div>
  );

  // === WARTERAUM (Lobby) ===
  if (room.phase === "lobby") {
    return (
      <div className="min-h-screen text-mg-frost-text flex flex-col py-6 px-4 font-body">
        <Atmosphere onRaven={playRaven} />
        <MusicToggle />
        <TopBar />
        <div className="max-w-xl mx-auto w-full mt-6 bg-mg-slate/60 rounded-3xl border border-mg-stone p-6 shadow-xl">
          <h2 className="text-xl font-serif font-black text-white text-center uppercase tracking-wide">Free-for-All Warteraum</h2>
          <p className="text-xs text-mg-fog text-center mt-1">Teile den Code <span className="font-mono text-mg-bronze-bright">{room.roomId}</span> mit deinen Mitstreitern. Start ab 3 Spielern.</p>
          <div className="mt-5 space-y-2">
            {seats.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-mg-void/50 border border-mg-stone">
                <span className="font-bold text-sm text-white">{i === 0 ? "👑 " : ""}{p.name}{p.id === myId ? " (du)" : ""}</span>
                <span className="text-[11px] font-mono text-mg-fog">{p.heroClass} · {p.isOnline === false ? "🔴 offline" : "🟢"}</span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, (room.maxPlayers ?? 3) - seats.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="px-3 py-2 rounded-xl bg-mg-void/30 border border-dashed border-mg-stone text-center text-[11px] text-mg-fog font-mono">leerer Platz…</div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {isCreator ? (
              <button onClick={() => sendAction({ type: "START_GAME", payload: { roomId: room.roomId } })} disabled={seats.length < 3}
                className={`py-3 rounded-xl font-bold tracking-wide uppercase text-sm transition-all ${seats.length < 3 ? "bg-mg-slate/40 text-mg-fog cursor-not-allowed border border-mg-stone" : "bg-mg-bronze text-mg-void hover:scale-[1.02] shadow-lg"}`}>
                {seats.length < 3 ? `Warte auf Spieler (${seats.length}/${room.maxPlayers})` : `Free-for-All starten (${seats.length} Spieler)`}
              </button>
            ) : (
              <div className="py-3 rounded-xl bg-mg-slate/40 border border-mg-stone text-center text-sm text-mg-fog">Warte, bis der Ersteller startet… ({seats.length}/{room.maxPlayers})</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === HELDENKRAFT-WAHL ===
  if (room.phase === "hero_selection" && me) {
    const classPowers = HERO_POWERS_LIST[me.heroClass] || [];
    const chosen = typeof me.selectedHeroPowerIndex === "number";
    return (
      <div className="min-h-screen text-mg-frost-text flex flex-col items-center justify-center py-6 px-4 font-body">
        <Atmosphere onRaven={playRaven} />
        <MusicToggle />
        <div className="absolute top-8 flex flex-col items-center">
          <span className="text-[10px] text-mg-bronze/80 font-mono tracking-widest uppercase mb-1">Verbleibende Zeit</span>
          <span className={`text-5xl font-black font-mono ${heroSelectionTimeRemaining <= 3 ? "text-red-500 animate-pulse" : "text-mg-bronze-bright"}`}>{heroSelectionTimeRemaining}s</span>
        </div>
        {chosen ? (
          <div className="text-center mt-10">
            <div className="text-4xl mb-3">⚔️</div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wide">Bereit. Warte auf die anderen…</h2>
            <p className="text-xs text-mg-fog mt-2">{seats.filter(s => typeof s.selectedHeroPowerIndex === "number").length}/{seats.length} haben gewählt.</p>
          </div>
        ) : (
          <div className="max-w-4xl w-full mt-16">
            <h2 className="text-2xl font-serif font-black text-white text-center mb-6 uppercase tracking-wide">Wähle deine Heldenkraft</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classPowers.map((p, idx) => (
                <button key={idx} onClick={() => sendAction({ type: "SELECT_HERO_POWER", payload: { roomId: room.roomId, powerIndex: idx } })}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-mg-slate border border-mg-stone hover:border-mg-bronze-bright hover:-translate-y-1 transition-all group cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-mg-bronze/10 border border-mg-bronze/20 text-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{p.emoji}</div>
                  <h3 className="font-serif font-bold text-white group-hover:text-mg-bronze-bright">{p.name}</h3>
                  <p className="text-[10px] text-mg-fog mt-2 leading-normal">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!me) return <div className="min-h-screen flex items-center justify-center text-mg-fog">Lade Free-for-All…</div>;

  // === BOARD (playing / victory) ===
  const winner = seats.find(p => p.id === room.winnerId);
  const recentLog = (room.history || []).slice(-4);

  return (
    <div className={`min-h-screen text-mg-frost-text font-body flex flex-col ${targeting.mode !== "none" ? "cursor-crosshair" : ""}`} onClick={cancelTargeting}>
      <Atmosphere onRaven={playRaven} />
      <MusicToggle />
      <div className="px-4 py-4 flex flex-col gap-3 flex-1">
        <TopBar />

        {/* GEGNER-REIHE (Dreieck/Kreuz) */}
        <div className={`grid gap-3 max-w-6xl mx-auto w-full ${opponents.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {opponents.map(opp => {
            const oppTurn = room.turn === opp.id;
            return (
              <div key={opp.id} className={`rounded-2xl border p-2.5 transition-all ${opp.isEliminated ? "opacity-40 border-mg-stone bg-mg-void/40" : oppTurn ? "border-mg-bronze bg-mg-slate/40 shadow-[0_0_14px_rgba(234,179,8,0.18)]" : "border-mg-stone bg-mg-void/50"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-mg-fog">🂠 {opp.hand.length} Karten</span>
                  {opp.isEliminated ? <span className="text-[10px] font-mono text-red-400 uppercase">☠️ gefallen</span> : oppTurn ? <span className="text-[10px] font-mono text-mg-bronze-bright uppercase animate-pulse">am Zug</span> : opp.isOnline === false ? <span className="text-[10px] font-mono text-red-400">offline</span> : null}
                </div>
                <HeroState player={opp} isActiveTurn={oppTurn} isEnemy canBeTargeted={heroTargetable(opp)} onHeroClick={() => sendAtTarget(opp.id, true)} />
                <div className="flex flex-wrap gap-1 justify-center mt-2 min-h-[3.5rem]">
                  {opp.board.map(m => (
                    <CardItem key={m.id} card={m} isOwner={false}
                      className={`w-16 ${minionTargetable(opp, m) ? "ring-2 ring-mg-bronze-bright cursor-pointer scale-105" : ""}`}
                      onClick={() => { if (minionTargetable(opp, m)) sendAtTarget(opp.id, false, m.id); }} />
                  ))}
                  {opp.board.length === 0 && !opp.isEliminated && <span className="text-[10px] text-mg-fog/60 self-center">kein Diener</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* MITTE: Status + Log */}
        <div className="max-w-2xl mx-auto w-full text-center">
          <div className={`text-sm font-bold ${isMyTurn ? "text-mg-bronze-bright" : "text-mg-fog"}`}>
            {room.phase === "victory" ? "" : isMyTurn ? `🔥 Du bist am Zug! (${timeRemaining}s)` : `⏳ ${seats.find(s => s.id === room.turn)?.name ?? "?"} ist am Zug…`}
            {targeting.mode !== "none" && <span className="ml-2 text-mg-frost-text">· Ziel wählen (oder Hintergrund tippen zum Abbrechen)</span>}
          </div>
          <div className="mt-1 text-[10px] text-mg-fog/80 font-mono leading-snug h-12 overflow-hidden">
            {recentLog.map((l, i) => <div key={i} className="truncate">{l}</div>)}
          </div>
        </div>

        {/* MEIN BEREICH */}
        <div className="max-w-5xl mx-auto w-full mt-auto">
          {/* mein Brett */}
          <div className="flex flex-wrap gap-1.5 justify-center min-h-[4.5rem] mb-2">
            {me.board.map(m => {
              const asTarget = minionTargetable(me, m);
              return (
                <CardItem key={m.id} card={m} isOwner canAttack={isMyTurn && !!m.isReady} isSelected={targeting.sourceId === m.id}
                  className={`w-[4.5rem] ${asTarget ? "ring-2 ring-mg-bronze-bright cursor-pointer" : isMyTurn && m.isReady ? "glow-attackable cursor-pointer" : "minion-exhausted"}`}
                  onClick={() => { if (asTarget) sendAtTarget(me.id, false, m.id); else startAttack(m); }} />
              );
            })}
            {me.board.length === 0 && <span className="text-[11px] text-mg-fog/60 self-center">Spiele Diener aus deiner Hand.</span>}
          </div>

          {/* mein Held + Heldenkraft */}
          <div className="flex justify-center mb-2" onClick={(e) => { if (targeting.mode !== "none") e.stopPropagation(); }}>
            <HeroState player={me} isActiveTurn={isMyTurn} onHeroPowerClick={useHeroPower}
              isHeroPowerSelected={targeting.mode === "heropower"} canBeTargeted={heroTargetable(me)} onHeroClick={() => sendAtTarget(me.id, true)} />
          </div>

          {/* meine Hand */}
          <div className="flex flex-wrap gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
            {me.board.length >= 0 && me.hand.map(card => {
              const affordable = isMyTurn && card.cost <= me.mana;
              return (
                <CardItem key={card.id} card={card} isOwner canBePlayed={affordable}
                  className="w-20 md:w-24" onClick={() => setPreviewCardId(card.id)} />
              );
            })}
          </div>

          {/* End-Turn */}
          <div className="flex justify-center mt-3" onClick={(e) => e.stopPropagation()}>
            <button onClick={endTurn} disabled={!isMyTurn}
              className={`px-6 py-2.5 rounded-xl font-bold uppercase tracking-wide text-sm transition-all ${isMyTurn ? "bg-mg-bronze text-mg-void hover:scale-105 shadow-lg" : "bg-mg-slate/40 text-mg-fog cursor-not-allowed border border-mg-stone"}`}>
              {isMyTurn ? "Zug beenden" : "Nicht dein Zug"}
            </button>
          </div>
        </div>
      </div>

      {/* KARTEN-VORSCHAU */}
      {previewCardId && (() => {
        const card = me.hand.find(c => c.id === previewCardId);
        if (!card) return null;
        const affordable = isMyTurn && card.cost <= me.mana;
        return (
          <div className="fixed inset-0 bg-mg-void/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6" onClick={() => setPreviewCardId(null)}>
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-4">
              <CardItem card={card} isOwner className="w-44 md:w-52 scale-100" />
              <div className="flex gap-3">
                <button onClick={() => setPreviewCardId(null)} className="px-4 py-2 rounded-xl border border-mg-stone bg-mg-void/60 text-mg-fog text-sm">Zurück</button>
                <button onClick={() => playCard(card)} disabled={!affordable}
                  className={`px-5 py-2 rounded-xl font-bold text-sm ${affordable ? "bg-mg-bronze text-mg-void hover:scale-105" : "bg-mg-slate/40 text-mg-fog cursor-not-allowed border border-mg-stone"}`}>
                  {!isMyTurn ? "Nicht dein Zug" : card.cost > me.mana ? `Braucht ${card.cost} Mana` : card.type === "minion" ? "Beschwören" : "Wirken"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SIEG */}
      {room.phase === "victory" && (
        <div className="fixed inset-0 bg-mg-void/85 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
          <div className="text-6xl mb-4">{room.winnerId === myId ? "👑" : "☠️"}</div>
          <h2 className="text-3xl font-serif font-black text-white uppercase tracking-wide">
            {room.winnerId === "DRAW" ? "Unentschieden" : `${winner?.name ?? "?"} gewinnt!`}
          </h2>
          <p className="text-sm text-mg-fog mt-2">{room.winnerId === myId ? "Letzter Überlebender. Marcgard gehört dir." : "Gefallen im Free-for-All."}</p>
          <div className="flex gap-3 mt-6">
            {isCreator && <button onClick={restart} className="px-5 py-2.5 rounded-xl bg-mg-bronze text-mg-void font-bold hover:scale-105">Nochmal</button>}
            <button onClick={onLeave} className="px-5 py-2.5 rounded-xl border border-mg-stone bg-mg-void/60 text-mg-fog font-bold">Zur Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
}
