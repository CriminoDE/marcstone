import React, { useState } from "react";
import { PlayerState, ClientAction } from "../types";
import { diceRoll } from "../utils/combatFx";

interface FfaForgeProps {
  me: PlayerState;
  isMyTurn: boolean;
  roomId: string;
  sendAction: (a: ClientAction) => void;
  showToast: (m: string, t?: "info" | "warning" | "success") => void;
  onClose: () => void;
}

// Spiegelt die Server-Kostenformel (computeForgeCost) fuer die Vorschau.
function previewCost(type: "minion" | "spell", atk: number, hp: number, taunt: boolean, charge: boolean, shield: boolean, effect: string, val: number): number {
  if (type === "minion") {
    const a = Math.min(10, Math.max(1, atk || 1));
    const h = Math.min(10, Math.max(1, hp || 1));
    const base = Math.ceil((a + h) / 2);
    const count = (taunt ? 1 : 0) + (charge ? 1 : 0) + (shield ? 1 : 0);
    const abil = (taunt ? 1 : 0) + (charge ? 2 : 0) + (shield ? 1 : 0);
    let pen = count > 1 ? count * 2 : 0;
    if (a >= 5 && count >= 2) pen += 4;
    return Math.max(1, base + abil + pen - 1);
  }
  const v = Math.min(10, Math.max(1, val || 1));
  if (effect === "heal") return Math.ceil(v / 2);
  if (effect === "draw") return Math.ceil(v * 2.5);
  return Math.ceil(v);
}

const MINION_EMOJI = ["⚔️", "🪓", "🐺", "🛡️", "❄️", "💀", "🐉", "🔥"];
const SPELL_EMOJI = ["🔮", "✨", "🌩️", "🩸", "☄️", "🌀"];

export function FfaForge({ me, isMyTurn, roomId, sendAction, showToast, onClose }: FfaForgeProps) {
  const [type, setType] = useState<"minion" | "spell">("minion");
  const [name, setName] = useState("Geschmiedeter Krieger");
  const [attack, setAttack] = useState("3");
  const [health, setHealth] = useState("3");
  const [taunt, setTaunt] = useState(false);
  const [charge, setCharge] = useState(false);
  const [shield, setShield] = useState(false);
  const [emoji, setEmoji] = useState("⚔️");
  const [effect, setEffect] = useState<"damage" | "heal" | "draw">("damage");
  const [value, setValue] = useState("3");

  const diceCost = (me.forgeDiceCount ?? 0) + 1;
  const diceDisabled = !isMyTurn || me.mana < diceCost || me.hand.length >= 10;
  const cost = previewCost(type, Number(attack), Number(health), taunt, charge, shield, effect, Number(value));
  const tooExpensive = cost > 10;
  const buildDisabled = me.hasForgedThisGame || tooExpensive || me.hand.length >= 10;

  const roll = () => {
    if (diceDisabled) return;
    diceRoll();
    sendAction({ type: "ROLL_FORGE_DICE", payload: { roomId } });
  };
  const build = () => {
    if (buildDisabled) { showToast(me.hasForgedThisGame ? "Selber-Bauen schon genutzt." : "Karte zu mächtig (max 10).", "warning"); return; }
    sendAction({
      type: "CREATE_CUSTOM_CARD",
      payload: {
        roomId, name: name.trim() || (type === "spell" ? "Zauber" : "Diener"), type, cost,
        attack: Number(attack), health: Number(health), emoji,
        description: type === "spell" ? `Zauber: ${effect} ${value}` : "Geschmiedet in der Alchemie-Schmiede.",
        hasTaunt: taunt, hasCharge: charge, hasDivineShield: shield,
        spellEffect: type === "spell" ? effect : undefined,
        spellValue: type === "spell" ? Number(value) : undefined,
      },
    });
    showToast(`🪄 ${name} beschworen!`, "success");
    onClose();
  };

  const numField = (val: string, set: (v: string) => void, label: string) => (
    <label className="flex flex-col gap-1 text-[10px] text-mg-fog uppercase tracking-wide">
      {label}
      <input type="number" min={1} max={10} value={val} onChange={(e) => set(e.target.value)}
        className="bg-mg-void/70 border border-mg-stone rounded-lg px-2 py-1.5 text-sm text-mg-frost-text text-center font-mono focus:outline-none focus:border-mg-bronze" />
    </label>
  );
  const chip = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button onClick={() => set(!on)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${on ? "bg-mg-bronze text-mg-void border-mg-bronze" : "bg-mg-void/50 text-mg-fog border-mg-stone"}`}>{label}</button>
  );

  return (
    <div className="fixed inset-0 bg-mg-void/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-mg-slate border border-mg-bronze/40 rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-black text-white uppercase tracking-wide text-lg">🧪 Alchemie-Schmiede</h3>
          <button onClick={onClose} className="text-mg-fog hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Götter-Würfel */}
        <div className="rounded-xl border border-mg-bronze/30 bg-mg-void/40 p-3 mb-4">
          <div className="text-[11px] text-mg-bronze-bright font-bold uppercase tracking-wide mb-1">🎲 Götter-Würfel</div>
          <p className="text-[10px] text-mg-fog mb-2 leading-snug">Zufallskarte ~1 Stufe über dem Einsatz. Mehrfach nutzbar, Kosten steigen pro Wurf.</p>
          <button onClick={roll} disabled={diceDisabled}
            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${diceDisabled ? "bg-mg-slate/40 text-mg-fog cursor-not-allowed border border-mg-stone" : "bg-mg-bronze text-mg-void hover:scale-[1.02]"}`}>
            {!isMyTurn ? "⏳ Nicht dein Zug" : me.hand.length >= 10 ? "Hand voll" : me.mana < diceCost ? `Braucht ${diceCost} Mana` : `🎲 Würfeln (${diceCost} Mana)`}
          </button>
        </div>

        {/* Selber bauen */}
        <div className="rounded-xl border border-mg-stone bg-mg-void/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-mg-frost-text font-bold uppercase tracking-wide">🔨 Selber bauen {me.hasForgedThisGame && <span className="text-mg-fog">· schon genutzt</span>}</div>
            <span className={`text-xs font-mono font-bold ${tooExpensive ? "text-red-400" : "text-mg-bronze-bright"}`}>{cost} Mana</span>
          </div>

          <div className="flex gap-2 mb-2">
            {(["minion", "spell"] as const).map(t => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${type === t ? "bg-mg-bronze text-mg-void border-mg-bronze" : "bg-mg-void/50 text-mg-fog border-mg-stone"}`}>{t === "minion" ? "Diener" : "Zauber"}</button>
            ))}
          </div>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className="w-full bg-mg-void/70 border border-mg-stone rounded-lg px-2.5 py-1.5 text-sm text-mg-frost-text mb-2 focus:outline-none focus:border-mg-bronze" />

          {type === "minion" ? (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {numField(attack, setAttack, "Angriff")}
                {numField(health, setHealth, "Leben")}
              </div>
              <div className="flex gap-2 mb-2">
                {chip(taunt, setTaunt, "🛡️ Spott")}
                {chip(charge, setCharge, "⚡ Ansturm")}
                {chip(shield, setShield, "✨ Gottesschild")}
              </div>
              <div className="flex flex-wrap gap-1 mb-1">{MINION_EMOJI.map(e => <button key={e} onClick={() => setEmoji(e)} className={`text-lg w-8 h-8 rounded-md ${emoji === e ? "bg-mg-bronze/40 ring-1 ring-mg-bronze" : "bg-mg-void/40"}`}>{e}</button>)}</div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex flex-col gap-1 text-[10px] text-mg-fog uppercase tracking-wide">Effekt
                  <select value={effect} onChange={(e) => setEffect(e.target.value as any)} className="bg-mg-void/70 border border-mg-stone rounded-lg px-2 py-1.5 text-sm text-mg-frost-text focus:outline-none focus:border-mg-bronze">
                    <option value="damage">Schaden</option>
                    <option value="heal">Heilung</option>
                    <option value="draw">Karten ziehen</option>
                  </select>
                </label>
                {numField(value, setValue, "Wert")}
              </div>
              <div className="flex flex-wrap gap-1 mb-1">{SPELL_EMOJI.map(e => <button key={e} onClick={() => setEmoji(e)} className={`text-lg w-8 h-8 rounded-md ${emoji === e ? "bg-mg-bronze/40 ring-1 ring-mg-bronze" : "bg-mg-void/40"}`}>{e}</button>)}</div>
            </>
          )}

          <button onClick={build} disabled={buildDisabled}
            className={`w-full mt-2 py-2.5 rounded-lg font-bold text-sm transition-all ${buildDisabled ? "bg-mg-slate/40 text-mg-fog cursor-not-allowed border border-mg-stone" : "bg-mg-bronze text-mg-void hover:scale-[1.02]"}`}>
            {me.hasForgedThisGame ? "⏳ Schon genutzt" : tooExpensive ? "⚠️ Zu mächtig (>10)" : me.hand.length >= 10 ? "Hand voll" : `🧪 Schmieden (${cost} Mana)`}
          </button>
        </div>
      </div>
    </div>
  );
}
