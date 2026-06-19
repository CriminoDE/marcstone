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
}: CardItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isFaceDown) {
    return (
      <div className={`w-32 h-44 rounded-xl border-2 border-amber-900/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-2 relative shadow-lg ${className}`}>
        {/* Intricate Card Back Frame */}
        <div className="absolute inset-1 border border-amber-700/30 rounded-lg flex flex-col items-center justify-center p-1 bg-indigo-950/20">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500 bg-amber-950/80 flex items-center justify-center shadow-inner text-lg animate-pulse">
            🌀
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-amber-500/70 mt-3 uppercase text-center leading-none">
            Arcane<br />Duel
          </span>
        </div>
      </div>
    );
  }

  // Is minion dead or wounded?
  const isWounded = card.type === "minion" && card.health < card.maxHealth;
  const isExhausted = card.type === "minion" && !card.isReady;

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
      className={`relative rounded-xl border-2 flex flex-col justify-between shadow-lg transition-all duration-300 select-none shrink-0
        w-[4.8rem] h-[6.8rem] p-1 sm:w-28 sm:h-36 sm:p-1.5 md:w-36 md:h-48 md:p-2
        ${card.type === "minion" ? "bg-slate-800" : "bg-gradient-to-b from-indigo-950 to-slate-800"} 
        ${isSelected 
          ? "border-amber-400 scale-105 md:scale-110 glow-selected z-30" 
          : card.hasTaunt 
            ? "border-red-600/70 glow-taunt" 
            : "border-slate-700/80"
        }
        ${canBePlayed && isOwner ? "hover:-translate-y-2 hover:border-green-400 cursor-pointer shadow-green-500/10 hover:z-20 md:hover:-translate-y-3" : ""}
        ${canAttack && isOwner ? "hover:-translate-y-2 hover:border-yellow-400 cursor-pointer glow-ready hover:z-20 md:hover:-translate-y-3" : ""}
        ${(!canBePlayed && !canAttack) && onClick ? "cursor-pointer hover:z-20" : ""}
        ${isHovered ? "z-40 scale-110 md:scale-110" : "z-10"}
        ${isExhausted && card.type === "minion" && isOwner ? "opacity-90" : ""}
        ${className}
      `}
    >
      {/* Royal Blue Mana Crystal Cost badge */}
      <div className="absolute -top-2 -left-2 md:-top-2.5 md:-left-2.5 w-5 h-5 md:w-7 md:h-7 rounded-full bg-blue-600 border border-amber-400 md:border-2 flex items-center justify-center font-mono font-bold text-[9px] md:text-xs text-white shadow-md z-10">
        {card.cost}
      </div>

      {/* Divine Shield Overlay Indicator */}
      {card.hasDivineShield && (
        <div className="absolute inset-0.5 rounded-lg border-2 border-dashed border-yellow-400/80 pointer-events-none animate-spin-slow" />
      )}

      {/* Card Header & Type Icon */}
      <div className="flex items-center justify-between text-[8px] md:text-[11px] font-bold text-slate-300">
        <span className="truncate max-w-[50px] md:max-w-[85px] leading-tight text-white font-sans">{card.name}</span>
        <span className="text-[10px] md:text-xs" title={card.type}>
          {card.type === "minion" ? "👾" : "🔮"}
        </span>
      </div>

      {/* Card art space */}
      <div className={`h-8 md:h-16 rounded md:rounded-lg my-0.5 md:my-1 flex items-center justify-center text-xl md:text-4xl shadow-inner relative overflow-hidden
        ${card.type === "minion" ? "bg-slate-900/60" : "bg-indigo-900/40"}`}
      >
        <span>{card.emoji}</span>
        {/* Keyword Quick Badges */}
        <div className="absolute bottom-0 left-0 flex gap-0.5 pointer-events-none">
          {card.hasTaunt && (
            <span className="bg-red-600 text-white text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">T</span>
          )}
          {card.hasCharge && (
            <span className="bg-amber-500 text-slate-900 text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">C</span>
          )}
          {card.hasDivineShield && (
            <span className="bg-blue-500 text-white text-[5px] md:text-[7px] font-bold px-0.5 md:px-1 rounded shadow">S</span>
          )}
        </div>
      </div>

      {/* Card Description / Ability Texts */}
      <div className="flex-1 overflow-y-auto px-0.5 leading-tight text-[6px] md:text-[9px] text-slate-300 font-sans tracking-wide">
        {card.description}
      </div>

      {/* Bottom stats indicators for Minions */}
      {card.type === "minion" ? (
        <div className="flex justify-between items-center mt-0.5 md:mt-1 pt-0.5 md:pt-1 border-t border-slate-700/60 font-mono font-bold text-[9px] md:text-xs">
          {/* Attack Rating */}
          <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-400 px-1 md:px-1.5 py-0.5 rounded-md border border-amber-500/20">
            <span className="text-[7px] md:text-[10px]">⚔️</span>
            <span>{card.attack}</span>
          </div>

          {/* Exhausted State */}
          {isExhausted && (
            <span className="text-[6px] md:text-[7px] text-slate-500 uppercase tracking-widest font-sans">zZ</span>
          )}

          {/* Health Rating */}
          <div className={`flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded-md border ${
            isWounded
              ? "bg-red-600/20 text-red-400 border-red-500/30 font-extrabold animate-pulse"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            <span className="text-[7px] md:text-[10px]">❤️</span>
            <span>{card.health}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-[5px] md:text-[7px] font-mono tracking-widest text-indigo-400 uppercase font-bold mt-0.5 md:mt-1">
          SPELL CAST
        </div>
      )}

      {/* Active Hover Tooltips Popup overlay */}
      {isHovered && tooltips.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-900 text-stone-100 border border-amber-500/30 rounded-lg p-2 shadow-2xl scale-95 transition-all text-[9.5px] space-y-1 z-50 animate-fade-in font-sans">
          <div className="font-bold border-b border-stone-850 pb-1 text-center text-amber-400 text-[10px] tracking-wide uppercase font-serif">Marcgard Kodex</div>
          {tooltips.map((tip, i) => (
            <div key={i} className="leading-snug text-left text-slate-300">
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
