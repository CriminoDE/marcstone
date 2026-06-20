import React, { useState } from "react";
import { Card } from "../types";

interface CardItemProps {
  key?: React.Key;
  card: Card;
  isSelected?: boolean;
  canBePlayed?: boolean;
  canAttack?: boolean;
  isOwner?: boolean;
  onClick?: () => void;
  className?: string;
  isFaceDown?: boolean;
  inHand?: boolean; // Handkarte: dauerhaft markieren ob spielbar (Mana ok) oder nicht
}

export function CardItem({
  card,
  isSelected = false,
  canBePlayed = false,
  canAttack = false,
  isOwner = true,
  onClick,
  className = "",
  isFaceDown = false,
  inHand = false,
}: CardItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isFaceDown) {
    return (
      <div className={`w-32 h-44 rounded-xl border-2 border-mg-bronze/60 bg-gradient-to-br from-indigo-950 via-mg-slate to-indigo-950 flex flex-col items-center justify-center p-2 relative shadow-lg ${className}`}>
        {/* Intricate Card Back Frame */}
        <div className="absolute inset-1 border border-mg-bronze/30 rounded-lg flex flex-col items-center justify-center p-1 bg-indigo-950/20">
          <div className="w-10 h-10 rounded-full border-2 border-mg-bronze bg-mg-slate/80 flex items-center justify-center shadow-inner text-lg animate-pulse">
            🌀
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-mg-bronze/70 mt-3 uppercase text-center leading-none">
            Arkanes<br />Duell
          </span>
        </div>
      </div>
    );
  }

  // Is minion dead or wounded?
  const isWounded = card.type === "minion" && card.health < card.maxHealth;
  const isExhausted = card.type === "minion" && !card.isReady;
  // Marc-forged cards (the dark seer's work) glow blood-red and feel "wrongly powerful".
  const isMarc = card.templateId === "custom_magic";

  // Handkarten: dauerhaft sichtbar machen ob spielbar (genug Mana + dein Zug) oder nicht.
  // Aktualisiert sich automatisch mit dem Mana, weil canBePlayed dynamisch berechnet wird.
  const playableNow = inHand && isOwner && canBePlayed;
  const unplayableNow = inHand && isOwner && !canBePlayed;

  // Build Explanations List for the Custom Tooltip
  const tooltips: string[] = [];
  if (card.hasTaunt) {
    tooltips.push("🛡️ Spott: Gegner müssen zuerst diesen Diener angreifen.");
  }
  if (card.hasCharge) {
    tooltips.push("⚡ Ansturm: Kann sofort im selben Zug angreifen.");
  }
  if (card.hasDivineShield) {
    tooltips.push("✨ Gottesschild: Ignoriert die erste Schadensquelle vollständig.");
  }
  if (card.description.toLowerCase().includes("battlecry") || card.description.includes("🔥") || card.description.includes("💣") || card.description.includes("❤️")) {
    tooltips.push("💥 Kampfschrei: Löst direkt beim Ausspielen einen Einmaleffekt aus.");
  }

  return (
    <div
      id={`card-${card.id}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-xl border-2 flex flex-col justify-between shadow-[0_6px_16px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(176,132,59,0.22)] transition-all duration-300 select-none shrink-0
        w-[4.8rem] h-[6.8rem] p-1 sm:w-28 sm:h-36 sm:p-1.5 md:w-36 md:h-48 md:p-2
        ${isMarc
          ? "bg-gradient-to-b from-[#2A0E0E] to-mg-void"
          : card.type === "minion"
            ? "bg-gradient-to-b from-mg-slate-raised to-mg-slate"
            : "bg-gradient-to-b from-mg-frost-deep/30 to-mg-void"}
        ${isSelected
          ? "border-mg-bronze-bright scale-105 md:scale-110 glow-selected z-30"
          : card.hasTaunt
            ? "border-mg-blood-bright/70 glow-taunt"
            : isMarc
              ? "border-mg-blood mg-marc-glow"
              : "border-mg-stone-light/70"
        }
        ${canBePlayed && isOwner ? "hover:-translate-y-2 hover:border-mg-poison cursor-pointer hover:z-20 md:hover:-translate-y-3" : ""}
        ${canAttack && isOwner ? "hover:-translate-y-2 hover:border-emerald-400 cursor-pointer glow-attackable hover:z-20 md:hover:-translate-y-3" : ""}
        ${(!canBePlayed && !canAttack) && onClick ? "cursor-pointer hover:z-20" : ""}
        ${playableNow ? "ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)] -translate-y-1 md:-translate-y-1.5 cursor-pointer" : ""}
        ${unplayableNow ? "opacity-45 saturate-50" : ""}
        ${isHovered ? "z-40 scale-110 md:scale-110" : "z-10"}
        ${isExhausted && card.type === "minion" && isOwner ? "minion-exhausted" : ""}
        ${className}
      `}
    >
      {/* Mana rune (ice/arcane) */}
      <div className="absolute -top-2 -left-2 md:-top-2.5 md:-left-2.5 w-5 h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-b from-mg-frost to-mg-frost-deep border border-mg-bronze-bright md:border-2 flex items-center justify-center font-display font-bold text-[9px] md:text-xs text-mg-frost-text shadow-[0_0_8px_rgba(95,168,214,0.5)] z-10">
        {card.cost}
      </div>

      {/* Divine Shield Overlay Indicator */}
      {card.hasDivineShield && (
        <div className="absolute inset-0.5 rounded-lg border-2 border-dashed border-mg-bronze-bright/80 pointer-events-none animate-spin-slow" />
      )}

      {/* Card Header & Type Icon */}
      <div className="flex items-center justify-between text-[8px] md:text-[11px] font-bold text-mg-fog">
        <span className={`truncate max-w-[50px] md:max-w-[85px] leading-tight ${isMarc ? "text-mg-ember font-rune tracking-wide" : "text-mg-frost-text font-display"}`}>{card.name}</span>
        <span className="text-[10px] md:text-xs" title={card.type}>
          {card.type === "minion" ? "👾" : "🔮"}
        </span>
      </div>

      {/* Card art space */}
      <div className={`h-8 md:h-16 rounded md:rounded-lg my-0.5 md:my-1 flex items-center justify-center text-xl md:text-4xl shadow-inner relative overflow-hidden
        ${card.type === "minion" ? "bg-mg-void" : "bg-mg-frost-deep/20"}`}
      >
        <span>{card.emoji}</span>
        {/* Keyword Quick Badges */}
        <div className="absolute bottom-0 left-0 flex gap-0.5 pointer-events-none">
          {card.hasTaunt && (
            <span className="bg-mg-blood-bright text-mg-frost-text text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">T</span>
          )}
          {card.hasCharge && (
            <span className="bg-mg-bronze text-mg-void text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">C</span>
          )}
          {card.hasDivineShield && (
            <span className="bg-mg-frost text-mg-void text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">S</span>
          )}
        </div>
      </div>

      {/* Card Description / Ability Texts */}
      <div className="flex-1 overflow-y-auto px-0.5 leading-tight text-[6px] md:text-[9px] text-mg-fog font-sans tracking-wide">
        {card.description}
      </div>

      {/* Bottom stats indicators for Minions */}
      {card.type === "minion" ? (
        <div className="flex justify-between items-center mt-0.5 md:mt-1 pt-0.5 md:pt-1 border-t border-mg-stone-light/60 font-display font-bold text-[9px] md:text-xs">
          {/* Attack Rating */}
          <div className="flex items-center gap-0.5 bg-mg-blood/25 text-mg-frost-text px-1 md:px-1.5 py-0.5 rounded-md border border-mg-blood-bright/40">
            <span className="text-[7px] md:text-[10px]">⚔️</span>
            <span>{card.attack}</span>
          </div>

          {/* Exhausted State */}
          {isExhausted && (
            <span className="text-[6px] md:text-[7px] text-mg-fog uppercase tracking-widest font-sans">zZ</span>
          )}

          {/* Health Rating */}
          <div className={`flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded-md border ${
            isWounded
              ? "bg-mg-blood/30 text-mg-blood-bright border-mg-blood-bright/50 font-extrabold animate-pulse"
              : "bg-mg-poison/15 text-mg-poison border-mg-poison/30"
          }`}>
            <span className="text-[7px] md:text-[10px]">❤️</span>
            <span>{card.health}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-[5px] md:text-[7px] font-mono tracking-widest text-indigo-400 uppercase font-bold mt-0.5 md:mt-1">
          ZAUBER WIRKEN
        </div>
      )}

      {/* Active Hover Tooltips Popup overlay */}
      {isHovered && tooltips.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-900 text-stone-100 border border-mg-bronze/30 rounded-lg p-2 shadow-2xl scale-95 transition-all text-[9.5px] space-y-1 z-50 animate-fade-in font-sans">
          <div className="font-bold border-b border-stone-850 pb-1 text-center text-mg-bronze-bright text-[10px] tracking-wide uppercase font-serif">Marcgard Kodex</div>
          {tooltips.map((tip, i) => (
            <div key={i} className="leading-snug text-left text-mg-fog">
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
