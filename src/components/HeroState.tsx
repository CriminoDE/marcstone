import React from "react";
import { PlayerState, HeroClass } from "../types";
import { HERO_POWER_COST, HERO_POWERS, HERO_POWERS_LIST } from "../constants";

interface HeroStateProps {
  player: PlayerState;
  isActiveTurn: boolean;
  isEnemy?: boolean;
  onHeroPowerClick?: () => void;
  isHeroPowerSelected?: boolean;
  onHeroClick?: () => void;
  canBeTargeted?: boolean;
}

const CLASS_EMOJIS: Record<HeroClass, string> = {
  Mage: "🧙‍♀️",
  Priest: "🛐",
  Hunter: "🏹",
  Paladin: "🫡",
};

export function HeroState({
  player,
  isActiveTurn,
  isEnemy = false,
  onHeroPowerClick,
  isHeroPowerSelected = false,
  onHeroClick,
  canBeTargeted = false,
}: HeroStateProps) {
  const hpPercent = (player.health / player.maxHealth) * 100;
  const isWounded = player.health < player.maxHealth;
  const isDanger = player.health <= 10;
  
  const classPowers = HERO_POWERS_LIST[player.heroClass] || [];
  const classPower = classPowers[player.selectedHeroPowerIndex || 0] || classPowers[0];
  const canUseHeroPower = isActiveTurn && !player.heroPowerUsed && player.mana >= HERO_POWER_COST && !isEnemy;

  // Generate Mana Crystal Gems Array
  const renderManaCrystals = () => {
    const crystals = [];
    for (let i = 1; i <= 10; i++) {
      if (i <= player.maxMana) {
        if (i <= player.mana) {
          crystals.push(
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.8)] inline-block transition-all"
              title="Verfügbares Mana"
            />
          );
        } else {
          crystals.push(
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-mg-stone-light/80 border border-mg-fog inline-block"
              title="Verbrauchtes Mana"
            />
          );
        }
      }
    }
    return crystals;
  };

  return (
    <div
      id={`hero-${player.id}`}
      onClick={(e) => {
        if (canBeTargeted && onHeroClick) {
          e.stopPropagation(); // nicht zum Board-Klick (Targeting abbrechen) durchblubbern
          onHeroClick();
        }
      }}
      className={`p-3 rounded-2xl flex items-center justify-between gap-4 transition-all border-2 max-w-sm w-full
        ${isActiveTurn 
          ? "bg-mg-slate border-mg-bronze shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
          : "bg-mg-void border-mg-stone"
        }
        ${canBeTargeted ? "glow-selected border-mg-bronze-bright cursor-pointer scale-102" : ""}
      `}
    >
      <div className="flex gap-3 items-center">
        {/* Hero Portrait Circle */}
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl select-none relative shadow-md border-2
            ${isActiveTurn ? "border-mg-bronze-bright bg-mg-slate/40" : "border-mg-stone-light bg-mg-slate/60"}`}
        >
          <span>{CLASS_EMOJIS[player.heroClass] || "🃏"}</span>
          
          {/* Active Turn Indicator Spark */}
          {isActiveTurn && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
            </span>
          )}
        </div>

        {/* Hero Info Texts */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-white leading-tight font-sans text-sm truncate max-w-[120px]">
              {player.name}
            </h4>
            <span className="text-[10px] bg-mg-stone px-1.5 py-0.2 rounded font-mono text-mg-fog">
              {player.heroClass}
            </span>
          </div>

          {/* Mana Crystals Visual bar */}
          <div className="flex flex-col mt-1 font-mono">
            <span className="text-[11px] text-blue-400 font-bold leading-none">
              {player.mana}/{player.maxMana} Mana
            </span>
            <div className="flex flex-wrap gap-0.5 mt-1 min-h-[14px]">
              {player.maxMana > 0 ? renderManaCrystals() : (
                <span className="text-[9px] text-mg-fog uppercase tracking-widest leading-none">Lobby-Phase</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero HP & Active Power Controls */}
      <div className="flex items-center gap-3">
        {/* HP Pill Indicator */}
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center relative shadow-md border-2 bg-mg-slate
              ${isDanger ? "border-red-500 animate-pulse bg-red-950/20" : isWounded ? "border-orange-500" : "border-emerald-500"}`}
          >
            <span className="text-[10px] font-sans absolute top-1 leading-none">❤️</span>
            <span className={`font-mono font-extrabold text-sm ${isDanger ? "text-red-400" : isWounded ? "text-orange-400" : "text-emerald-400"} mt-2 leading-none`}>
              {player.health}
            </span>
          </div>
        </div>

        {/* Hero Power Button (Only interactive for local owner player) */}
        {!isEnemy && onHeroPowerClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canUseHeroPower) onHeroPowerClick();
            }}
            disabled={!canUseHeroPower}
            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all text-center select-none w-20
              ${isHeroPowerSelected 
                ? "border-mg-bronze-bright bg-mg-slate/60 text-mg-bronze-bright glow-selected scale-105" 
                : canUseHeroPower 
                  ? "border-blue-500/50 bg-blue-950/40 text-blue-200 hover:border-blue-400 hover:scale-103 cursor-pointer" 
                  : "border-mg-stone bg-mg-slate/40 text-mg-fog cursor-not-allowed opacity-60"
              }`}
            title={`Heldenkraft: ${classPower.name}. ${classPower.description}`}
          >
            <div className="flex items-center gap-1 text-[11px] font-mono leading-none font-bold">
              <span>{classPower.emoji}</span>
              <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1 py-0.2 rounded-md">2☄️</span>
            </div>
            <span className="text-[8px] font-bold font-sans tracking-wide leading-none truncate w-full mt-1">
              {player.heroPowerUsed ? "Verbraucht" : classPower.name}
            </span>
          </button>
        )}

        {/* Display-only Hero power description for enemies */}
        {isEnemy && (
          <div className="w-14 p-1 rounded-xl bg-mg-slate/60 border border-mg-stone flex flex-col items-center justify-center opacity-75" title={`Gegnerische Heldenkraft: ${classPower.name}. ${classPower.description}`}>
            <span className="text-sm leading-none">{classPower.emoji}</span>
            <span className="text-[8px] font-mono font-bold text-mg-fog truncate w-full mt-1 text-center">
              {classPower.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
