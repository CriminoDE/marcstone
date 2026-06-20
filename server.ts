import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { Card, PlayerState, RoomState, ChatMessage, HeroClass, ClientAction, GameEvent } from "./src/types";
import { CARD_TEMPLATES, createCardInstance, HERO_POWER_COST, HERO_POWERS, HERO_POWERS_LIST, STANDARD_CLASS_CARDS } from "./src/constants";

// Local practice bot id. No external AI / API is used - the bot plays via simple
// heuristics, so testing solo is free and has zero cost/abuse surface.
const BOT_ID = "AI_GEMINI_OPPONENT";

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Global server state
const rooms = new Map<string, RoomState>();
const clients = new Map<string, WebSocket>();
const clientRooms = new Map<string, string>(); // connectionId -> roomId
const onlinePlayerNames = new Map<string, string>(); // connectionId -> nickname
const globalLeaderboard = new Map<string, number>(); // lowercase name -> score

function recordWin(winnerName: string) {
    const norm = winnerName.trim().toLowerCase();
    // Bot nicht ins Leaderboard (Holgar = Uebungsgegner). Kein startsWith("ai") mehr,
    // das filterte faelschlich echte Namen wie "Aiko".
    if (norm === "ai_gemini_opponent" || norm.includes("übungsgegner")) return;
    const current = globalLeaderboard.get(norm) || 0;
    globalLeaderboard.set(norm, current + 1);
}

// Broadcast Lobby details to everyone
function broadcastLobbyState() {
  const lobbyRooms = Array.from(rooms.values()).map(buildRoomInfo);

  const onlinePlayers = Array.from(clients.keys()).map(id => ({
    id,
    name: onlinePlayerNames.get(id) || "Suchender Magier 🪄"
  }));

  const msg = JSON.stringify({
    type: "LOBBY_STATE_UPDATE",
    payload: {
      rooms: lobbyRooms,
      onlinePlayers: onlinePlayers,
      leaderboard: Array.from(globalLeaderboard.entries()).map(([name, score]) => ({ name, score })).sort((a,b) => b.score - a.score)
    }
  });

  for (const clientWs of clients.values()) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(msg);
    }
  }
}

// Generates a 6-letter room code
function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars like 0/O or 1/I
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Fisher-Yates shuffle
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate starting deck based on Class (25 cards)
function generateClassDeck(heroClass: HeroClass): Card[] {
  const list = STANDARD_CLASS_CARDS[heroClass] || STANDARD_CLASS_CARDS["Mage"];
  const deck: Card[] = [];
  
  // Choose up to 25 cards
  for (let i = 0; i < 25; i++) {
    const templateId = list[i % list.length];
    const instanceId = `card-${heroClass}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    deck.push(createCardInstance(templateId, instanceId));
  }
  return shuffleDeck(deck);
}

// All connection ids that should receive a room's state (duel: p1/p2, ffa: players[]).
function roomMemberIds(room: RoomState): string[] {
  const ids = new Set<string>();
  if (room.player1) ids.add(room.player1.id);
  if (room.player2) ids.add(room.player2.id);
  (room.players ?? []).forEach(p => ids.add(p.id));
  return [...ids];
}

// Broadcast game state to every player in a room (duel = 2, ffa = 3-4)
function broadcastToRoom(roomId: string, message: GameEvent) {
  const room = rooms.get(roomId);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const id of roomMemberIds(room)) {
    const ws = clients.get(id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Single source of truth for the lobby room cards (handles duel + ffa display).
function buildRoomInfo(r: RoomState) {
  if (r.mode === "ffa") {
    const seats = r.players ?? [];
    return {
      roomId: r.roomId,
      p1Name: seats[0]?.name || null,
      p2Name: seats[1]?.name || null,
      p1Class: seats[0]?.heroClass || null,
      p2Class: seats[1]?.heroClass || null,
      p1Online: seats[0] ? clients.has(seats[0].id) : false,
      p2Online: seats[1] ? clients.has(seats[1].id) : false,
      phase: r.phase,
      creatorId: seats[0]?.id || "",
      mode: r.mode,
      playerCount: seats.length,
      maxPlayers: r.maxPlayers,
    };
  }
  return {
    roomId: r.roomId,
    p1Name: r.player1?.name || null,
    p2Name: r.player2?.name || null,
    p1Class: r.player1?.heroClass || null,
    p2Class: r.player2?.heroClass || null,
    p1Online: r.player1 ? clients.has(r.player1.id) : false,
    p2Online: r.player2 ? clients.has(r.player2.id) : false,
    phase: r.phase,
    creatorId: r.player1?.id || "",
    mode: r.mode ?? "duel",
    playerCount: undefined,
    maxPlayers: undefined,
  };
}

// Helper to add message logs
function addLog(room: RoomState, actionText: string) {
  room.history.unshift(`[${new Date().toLocaleTimeString()}] ${actionText}`);
  if (room.history.length > 50) {
    room.history.pop();
  }
}

// Goetter-Wuerfel: erzeugt eine ZUFAELLIGE, aber gebalancte Karte - garantiert ~1 Manastufe
// ueber dem Einsatz (nie Muell, kein Cherry-Picking weil random). diceManaCost = was der Wurf kostet.
const FORGE_NAMES_MINION = ["Frostgeborener", "Runenwächter", "Blutaxt-Berserker", "Eisjarl", "Schattenwolf", "Sturmschmied", "Grabhüter", "Nebelseher", "Knochenbrecher", "Fjordriese", "Wolfsblut-Krieger", "Aschejarl"];
const FORGE_NAMES_SPELL = ["Runenfluch", "Frostbann", "Blutopfer", "Götterfunke", "Wolfsruf", "Nordlicht", "Aschehauch", "Hela's Gabe"];
const FORGE_EMOJI_MINION = ["🪓", "🐺", "🛡️", "❄️", "⚒️", "💀", "🐗", "🦅", "🐉", "👹", "🏹", "⚔️"];
function forgePick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function rollForgedCard(diceManaCost: number): Card {
  const printedCost = Math.min(10, Math.max(0, diceManaCost));
  const tier = Math.min(10, diceManaCost + 1); // ~1 Stufe ueber dem Einsatz
  const id = `dice-${Math.random().toString(36).substring(2, 7)}`;
  const isSpell = Math.random() < 0.25;

  if (isSpell) {
    const roll = Math.random();
    let spellEffect: "damage" | "heal" | "draw";
    let spellValue: number;
    let emoji: string, desc: string;
    if (roll < 0.6) { spellEffect = "damage"; spellValue = tier + 1; emoji = "🔥"; desc = `🔥 Füge ${spellValue} Schaden zu (beliebiges Ziel).`; }
    else if (roll < 0.85) { spellEffect = "heal"; spellValue = tier + 3; emoji = "💚"; desc = `💚 Heile ${spellValue} Leben (beliebiges Ziel).`; }
    else { spellEffect = "draw"; spellValue = Math.max(1, Math.round(tier / 3)); emoji = "📖"; desc = `🃏 Ziehe ${spellValue} Karte(n).`; }
    return {
      id, templateId: "custom_magic", name: forgePick(FORGE_NAMES_SPELL), type: "spell",
      cost: printedCost, attack: 0, health: 0, maxHealth: 0, emoji, description: desc,
      hasTaunt: false, hasCharge: false, hasDivineShield: false,
      spellEffect, spellValue, isReady: false,
    };
  }

  // Diener: Stat-Budget tier*2+1, evtl. 1 Keyword (Tier-Gates + Punktkosten), Rest auf Attack/Health.
  let statPoints = tier * 2 + 1;
  let hasTaunt = false, hasCharge = false, hasDivineShield = false;
  const kw = Math.random();
  if (kw < 0.18 && tier >= 3 && statPoints > 5) { hasDivineShield = true; statPoints -= 3; }
  else if (kw < 0.36 && tier >= 2 && statPoints > 4) { hasCharge = true; statPoints -= 2; }
  else if (kw < 0.58 && statPoints > 3) { hasTaunt = true; statPoints -= 1; }
  if (statPoints < 2) statPoints = 2;
  let atk = 1 + Math.floor(Math.random() * Math.max(1, statPoints - 1));
  let hp = Math.max(1, statPoints - atk);
  atk = Math.min(12, atk); hp = Math.min(12, hp);
  const tags = [hasTaunt ? "🛡️ Spott" : "", hasCharge ? "⚡ Ansturm" : "", hasDivineShield ? "✨ Gottesschild" : ""].filter(Boolean).join(", ");
  return {
    id, templateId: "custom_magic", name: forgePick(FORGE_NAMES_MINION), type: "minion",
    cost: printedCost, attack: atk, health: hp, maxHealth: hp, emoji: forgePick(FORGE_EMOJI_MINION),
    description: tags ? `${tags}. Vom Würfel der Götter geschmiedet.` : "Vom Würfel der Götter geschmiedet.",
    hasTaunt, hasCharge, hasDivineShield, isReady: false,
  };
}

// Trigger automatic rage and trash-talk insults when a minion dies or major hit occurs
function triggerRageChat(room: RoomState, offendingPlayer: PlayerState, triggerType: "minion_died" | "high_damage") {
  const insults = {
    minion_died: [
      "Beim Blut Odins! Du wirst in Hel verrotten dafür, Wurm! 🪓",
      "Mein Krieger zieht nach Walhall. Du ziehst gleich unter meine Axt, feiger Hund! ⚔️",
      "Die Raben fressen noch DEINE Augen, nicht meine! 🐦‍⬛",
      "Du schlachtest meine Männer wie ein Bauer die Schweine. Thor sieht dich, Made. ⚡",
      "Heul nur. Ich nähre Fenrir mit deinen Knochen! 🐺",
      "Ein guter Mann gefallen, und du grinst? Dein Grab ist schon geschaufelt. 💀",
      "Beim Met meiner Ahnen, dafür blutest du bis Ragnarök! 🩸"
    ],
    high_damage: [
      "Das kitzelt, du milchgesichtiger Wicht! Schlag fester oder geh heim zu Mutter! 😤",
      "Ein Mückenstich. Meine Großmutter trifft härter mit der Schöpfkelle. 🥄",
      "SO sieht ein Mann aus, der nicht jammert. Lern was, Weichei. 🛡️",
      "Spar dir die Tricks, Zauberbeutel. Stahl gewinnt, nicht dein Gewinsel. 🗡️",
      "Brüll ruhig, kleiner Skalde. Walhall lacht über dich. 🍺",
      "Du blutest mich, ich blute dich doppelt. So ist das Gesetz des Nordens. ❄️",
      "Glückstreffer, Bauer. Beim nächsten Mal hack ich dir den Bart ab! 🪓"
    ]
  };

  const pool = insults[triggerType];
  const insultText = pool[Math.floor(Math.random() * pool.length)];

  const message: ChatMessage = {
    id: `rage-${Math.random().toString(36).substring(2, 6)}`,
    senderId: offendingPlayer.id,
    senderName: offendingPlayer.name,
    text: insultText,
    timestamp: new Date().toLocaleTimeString(),
  };

  room.messages.push(message);
  if (room.messages.length > 40) {
    room.messages.shift();
  }
}

// Bereitmachen am Zugstart: eingefrorene Diener bleiben diesen Zug exhausted und tauen dann auf,
// temporaere Angriffs-Debuffs (Mind Spike) werden zurueckgegeben. Geteilt von Duell + FFA.
function readyUpBoard(board: Card[]) {
  board.forEach(m => {
    if (m.frozen) { m.isReady = false; m.frozen = false; }
    else m.isReady = true;
    if (m.tempAttackDebuff) { m.attack += m.tempAttackDebuff; m.tempAttackDebuff = 0; }
  });
}

function processEndTurn(room: RoomState, currentTurnConnectionId: string) {
  const player = room.player1?.id === currentTurnConnectionId ? room.player1 : room.player2;
  const opponent = player === room.player1 ? room.player2 : room.player1;
  if (!player || !opponent) return;

  // Reentrancy-Schutz: wenn der Zug bereits gewechselt wurde (Timer-Ablauf + manuelles
  // END_TURN feuern fast gleichzeitig), nicht ein zweites Mal weiterschalten.
  if (room.turn !== currentTurnConnectionId) return;

  // Swap turn
  room.turn = opponent.id;
  room.turnEndTime = Date.now() + 45000;

  // Upgrade active opponent's Mana
  if (opponent.maxMana < 10) {
    opponent.maxMana += 1;
  }
  opponent.mana = opponent.maxMana;
  opponent.heroPowerUsed = false;

  // Draw standard card for opponent
  if (opponent.deck.length > 0) {
    const drawn = opponent.deck.pop()!;
    if (opponent.hand.length < 10) {
      opponent.hand.push(drawn);
      addLog(room, `🃏 ${opponent.name} zog eine Karte.`);
    } else {
      addLog(room, `🤢 ${opponent.name}s Hand ist voll (10)! Verbrannte Karte: ${drawn.name}.`);
    }
  } else {
    // Fatigue damage!
    opponent.health -= 2;
    addLog(room, `💀 ${opponent.name} hat KEINE Karten mehr! 2 Erschöpfungsschaden.`);
  }

  // Ready up all minions of the active opponent (Freeze + Temp-Debuff beachten)
  readyUpBoard(opponent.board);

  addLog(room, `⏳ Die Zeit ist abgelaufen oder Zug wurde beendet! Nun ist ${opponent.name} am Zug!`);

  checkGameVictory(room);

  broadcastToRoom(room.roomId, {
    type: "ROOM_STATE_UPDATE",
    payload: room,
  });

  if (room.phase === "playing" && room.turn === "AI_GEMINI_OPPONENT") {
    playAITurn(room);
  }
}

// Simple spell resolution for the practice bot (no targeting AI - sensible defaults).
function botPlaySpell(room: RoomState, bot: PlayerState, human: PlayerState, card: Card) {
  const dmgFace = (n: number) => resolveDamage(room, bot, human, n, undefined, true, card.name);
  const wipe = (n: number) => {
    human.board.forEach((m) => { if (m.hasDivineShield) m.hasDivineShield = false; else m.health -= n; });
    human.board = human.board.filter((m) => m.health > 0);
  };
  const draw = (n: number) => {
    for (let i = 0; i < n; i++) { if (bot.deck.length > 0) { const d = bot.deck.pop()!; if (bot.hand.length < 10) bot.hand.push(d); } }
  };
  switch (card.templateId) {
    case "arc_shot": dmgFace(2); break;
    case "fireball": dmgFace(6); break;
    case "meteor": dmgFace(8); break;
    case "pyroblast": dmgFace(10); break;
    case "heal_touch": resolveHeal(room, bot, human, 6, undefined, true); break;
    case "consecration": wipe(2); break;
    case "flamestrike": wipe(4); break;
    case "pot_greed": draw(2); break;
    case "mind_control":
      if (human.board.length > 0 && bot.board.length < 7) bot.board.push(human.board.splice(Math.floor(Math.random() * human.board.length), 1)[0]);
      break;
    case "custom_magic":
      if (card.spellEffect === "heal") resolveHeal(room, bot, human, card.spellValue || 1, undefined, true);
      else if (card.spellEffect === "draw") draw(card.spellValue || 1);
      else dmgFace(card.spellValue || 1);
      break;
    default: dmgFace(2);
  }
  addLog(room, `🔮 ${bot.name} wirkt ${card.name}.`);
}

// Resolve a minion's Battlecry. Shared by human PLAY_CARD and the practice bot, so Holgar
// actually triggers Firelord / Dr. Marc / Marc's Breath / Ragnaros / Sylvanas instead of
// playing them as vanilla bodies. For targeted battlecries (alexstrasza) pass the chosen
// targetId/isTargetHero; the bot computes a sensible default before calling.
function resolveBattlecry(
  room: RoomState,
  player: PlayerState,
  opponent: PlayerState,
  card: Card,
  targetId?: string,
  isTargetHero?: boolean,
) {
  if (card.templateId === "m_firelord") {
    addLog(room, `👑🔥 Marc the Firelord entfesselt ein Inferno!`);
    const hpBefore = opponent.health;
    opponent.health -= 4;
    addLog(room, `🔥 ${opponent.name}s Held nimmt 4 Schaden (${hpBefore} → ${opponent.health}).`);
    opponent.board.forEach(m => {
      if (m.hasDivineShield) {
        m.hasDivineShield = false;
      } else {
        m.health -= 4;
      }
    });
    opponent.board = opponent.board.filter(m => m.health > 0);
    triggerRageChat(room, opponent, "high_damage");
  } else if (card.templateId === "dr_boom") {
    addLog(room, `💣💥 Dr. Marc unleashes chaotic Boom-Bots!`);
    for (let k = 0; k < 3; k++) {
      const targets = [opponent, ...opponent.board];
      if (targets.length > 0) {
        const randTarget = targets[Math.floor(Math.random() * targets.length)];
        if ("heroClass" in randTarget) {
          const hpBefore = randTarget.health;
          randTarget.health -= 1;
          addLog(room, `💥 Boom-Bot trifft ${randTarget.name}s Held für 1 (${hpBefore} → ${randTarget.health}).`);
        } else {
          if (randTarget.hasDivineShield) {
            randTarget.hasDivineShield = false;
          } else {
            randTarget.health -= 1;
          }
          addLog(room, `💥 Boom-Bot hits ${randTarget.name}!`);
        }
      }
    }
    opponent.board = opponent.board.filter(m => m.health > 0);
  } else if (card.templateId === "alexstrasza") {
    // Marc's Breath: setzt das Leben EINES beliebigen Helden auf 15 (Ziel waehlt der Spieler).
    const targetHero = isTargetHero
      ? (targetId === player.id ? player : opponent)
      : opponent;
    const before = targetHero.health;
    targetHero.health = 15;
    const verb = before > 15 ? "faellt auf" : before < 15 ? "steigt auf" : "bleibt bei";
    addLog(room, `🐉❤️ Marc's Breath: ${targetHero.name}s Held ${verb} 15 (${before} → 15).`);
    if (before > 15) triggerRageChat(room, targetHero, "high_damage");
  } else if (card.templateId === "ragnaros") {
    addLog(room, `🔥 DIE INSECT! Ragnaros blasts a random enemy for 8 damage!`);
    const targets = [opponent, ...opponent.board];
    if (targets.length > 0) {
        const randTarget = targets[Math.floor(Math.random() * targets.length)];
        if ("heroClass" in randTarget) {
           randTarget.health -= 8;
           addLog(room, `🔥 Ragnaros hits enemy Hero for 8 damage!`);
        } else {
           if (randTarget.hasDivineShield) {
              randTarget.hasDivineShield = false;
           } else {
              randTarget.health -= 8;
           }
           addLog(room, `🔥 Ragnaros hits ${randTarget.name} for 8 damage!`);
        }
    }
    opponent.board = opponent.board.filter(m => m.health > 0);
    triggerRageChat(room, opponent, "high_damage");
  } else if (card.templateId === "sylvanas") {
    if (opponent.board.length > 0 && player.board.length < 7) {
      const stealIdx = Math.floor(Math.random() * opponent.board.length);
      const stolen = opponent.board.splice(stealIdx, 1)[0];
      player.board.push(stolen);
      addLog(room, `🏹 Sylvanas stole ${stolen.name} to your side!`);
      triggerRageChat(room, opponent, "high_damage");
    }
  }
}

// Server-authoritative forge cost. Mirrors the client formula (App.tsx) so a manipulated
// client cannot send a 0-Mana 10/10. The client-supplied `cost` is ignored on the server.
function computeForgeCost(p: {
  type: "minion" | "spell";
  attack?: number; health?: number;
  hasTaunt?: boolean; hasCharge?: boolean; hasDivineShield?: boolean;
  spellEffect?: "damage" | "heal" | "draw"; spellValue?: number;
}): number {
  const clamp = (n: number) => Math.min(10, Math.max(1, Math.floor(n) || 1));
  if (p.type === "minion") {
    const atk = clamp(Number(p.attack) || 1);
    const hp = clamp(Number(p.health) || 1);
    const baseStatCost = Math.ceil((atk + hp) / 2);
    const abilityCount = (p.hasTaunt ? 1 : 0) + (p.hasCharge ? 1 : 0) + (p.hasDivineShield ? 1 : 0);
    const abilityCost = (p.hasTaunt ? 1 : 0) + (p.hasCharge ? 2 : 0) + (p.hasDivineShield ? 1 : 0);
    let scalingPenalty = abilityCount > 1 ? abilityCount * 2 : 0;
    if (atk >= 5 && abilityCount >= 2) scalingPenalty += 4;
    return Math.max(1, baseStatCost + abilityCost + scalingPenalty - 1);
  }
  const spVal = clamp(Number(p.spellValue) || 1);
  if (p.spellEffect === "heal") return Math.ceil(spVal / 2);
  if (p.spellEffect === "draw") return Math.ceil(spVal * 2.5);
  return Math.ceil(spVal); // damage (default)
}

// Local practice bot: pure heuristics, no external API. Plays affordable cards
// (minions first while there is room), then attacks (taunts first, else the hero), then ends.
async function playAITurn(room: RoomState) {
  const bot = room.player2;
  const human = room.player1;
  if (!bot || !human || bot.id !== BOT_ID) return;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    await sleep(1200);
    if (room.phase !== "playing" || room.turn !== bot.id) return;

    // 1) Play cards while we can afford something
    for (let guard = 0; guard < 25; guard++) {
      if (room.phase !== "playing") break;
      const affordable = bot.hand.filter((c) => c.cost <= bot.mana);
      if (affordable.length === 0) break;
      let pick = bot.board.length < 7 ? affordable.find((c) => c.type === "minion") : undefined;
      if (!pick) pick = affordable.find((c) => c.type === "spell");
      if (!pick) break;

      bot.mana -= pick.cost;
      bot.hand.splice(bot.hand.indexOf(pick), 1);
      if (pick.type === "minion") {
        pick.isReady = pick.hasCharge || false;
        bot.board.push(pick);
        addLog(room, `🛡️ ${bot.name} stellt ${pick.name} auf (${pick.attack}/${pick.health}).`);
        // Battlecry ausloesen. Marc's Breath braucht ein Ziel: Bot heilt sich, wenn er
        // unter 15 und nicht ueber dem Menschen liegt, sonst nukt er den Menschen auf 15 runter.
        if (pick.templateId === "alexstrasza") {
          const healSelf = bot.health < 15 && bot.health <= human.health;
          resolveBattlecry(room, bot, human, pick, healSelf ? bot.id : human.id, true);
        } else {
          resolveBattlecry(room, bot, human, pick);
        }
      } else {
        botPlaySpell(room, bot, human, pick);
      }
      checkGameVictory(room);
    }

    // 2) Attack with every ready minion
    if (room.phase === "playing") {
      for (const attacker of [...bot.board]) {
        if (room.phase !== "playing") break;
        if (!bot.board.includes(attacker) || !attacker.isReady) continue;

        const taunts = human.board.filter((m) => m.hasTaunt);
        if (taunts.length > 0) {
          const target = [...taunts].sort((a, b) => a.health - b.health)[0];
          if (target.hasDivineShield) target.hasDivineShield = false; else target.health -= attacker.attack;
          if (attacker.hasDivineShield) attacker.hasDivineShield = false; else attacker.health -= target.attack;
          attacker.isReady = false;
          addLog(room, `⚔️ ${attacker.name} prallt auf ${target.name}.`);
          if (target.health <= 0) triggerRageChat(room, human, "minion_died");
          bot.board = bot.board.filter((m) => m.health > 0);
          human.board = human.board.filter((m) => m.health > 0);
        } else {
          human.health -= attacker.attack;
          attacker.isReady = false;
          addLog(room, `⚔️ ${attacker.name} trifft ${human.name} fuer ${attacker.attack}.`);
          if (attacker.attack >= 4) triggerRageChat(room, human, "high_damage");
        }
        checkGameVictory(room);
      }
    }
  } catch (err) {
    console.error("Bot turn error", err);
  } finally {
    broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
    await sleep(1000);
    if (room.phase === "playing" && room.turn === bot.id) {
      processEndTurn(room, bot.id);
    }
  }
}

function beginGamePhase(room: RoomState) {
  if (room.phase === "playing") return;

  // FFA: eigener Start (erster Sitz beginnt, Mana-Ramp + 5. Karte via beginFfaTurn).
  if (room.mode === "ffa") {
    room.phase = "playing";
    room.heroSelectionEndTime = undefined;
    ffaSeats(room).forEach(p => { if (p.selectedHeroPowerIndex === undefined) p.selectedHeroPowerIndex = 0; });
    const first = ffaSeats(room).find(p => p.id === room.turn) || ffaAlive(room)[0];
    addLog(room, `⚔️ Free-for-All beginnt! ${first?.name ?? "Niemand"} eröffnet.`);
    if (first) beginFfaTurn(room, first);
    broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
    return;
  }

  room.phase = "playing";
  room.heroSelectionEndTime = undefined;
  room.turnEndTime = Date.now() + 45000;

  // Auto-assign random hero powers if not selected
  if (room.player1 && room.player1.selectedHeroPowerIndex === undefined) {
      room.player1.selectedHeroPowerIndex = 0;
  }
  if (room.player2 && room.player2.selectedHeroPowerIndex === undefined) {
      room.player2.selectedHeroPowerIndex = 0;
  }

  const activePlayerName = room.turn === room.player1?.id ? room.player1?.name : room.player2?.name;
  addLog(room, `⚔️ The Battle Begins! Let the magic flow! ${activePlayerName} is starting!`);

  broadcastToRoom(room.roomId, {
    type: "ROOM_STATE_UPDATE",
    payload: room,
  });

  if (room.turn === "AI_GEMINI_OPPONENT") {
    playAITurn(room);
  }
}

// Global loop checking turn timers
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room) => {
    if (room.phase === "playing" && room.turn && room.turnEndTime && now >= room.turnEndTime) {
      if (room.mode === "ffa") advanceFfaTurn(room, room.turn);
      else processEndTurn(room, room.turn);
    } else if (room.phase === "hero_selection" && room.heroSelectionEndTime && now >= room.heroSelectionEndTime) {
      beginGamePhase(room);
    }
  });
}, 1000);

// ============================================================================
// FREE-FOR-ALL (FFA) ENGINE - eigener, paralleler Pfad neben dem 1v1-Duell.
// Das Duell (player1/player2) bleibt komplett unangetastet. FFA nutzt room.players[].
// Alle gemeinsamen Helfer (resolveDamage-Stil, triggerRageChat, addLog, Decks) werden
// wiederverwendet; FFA-spezifisch ist nur: mehrere Gegner, Ziel-Spieler-Wahl, last-standing.
// ============================================================================

function ffaSeats(room: RoomState): PlayerState[] { return room.players ?? []; }
function ffaAlive(room: RoomState): PlayerState[] { return ffaSeats(room).filter(p => !p.isEliminated && p.health > 0); }
function ffaActor(room: RoomState, connId: string): PlayerState | undefined { return ffaSeats(room).find(p => p.id === connId); }
function ffaOpponents(room: RoomState, actor: PlayerState): PlayerState[] { return ffaAlive(room).filter(p => p.id !== actor.id); }
function ffaHeroById(room: RoomState, playerId?: string): PlayerState | undefined {
  if (!playerId) return undefined;
  return ffaSeats(room).find(p => p.id === playerId && !p.isEliminated);
}
function ffaFindMinion(room: RoomState, minionId: string): { owner: PlayerState; minion: Card } | null {
  for (const owner of ffaSeats(room)) {
    const minion = owner.board.find(m => m.id === minionId);
    if (minion) return { owner, minion };
  }
  return null;
}

function ffaHitHero(room: RoomState, target: PlayerState, amount: number, src: string) {
  const before = target.health;
  target.health -= amount;
  addLog(room, `💥 ${src} trifft ${target.name}s Held für ${amount} (${before} → ${target.health}).`);
  if (amount >= 4) triggerRageChat(room, target, "high_damage");
}
function ffaHitMinion(room: RoomState, owner: PlayerState, minion: Card, amount: number, src: string) {
  if (minion.hasDivineShield) {
    minion.hasDivineShield = false;
    addLog(room, `🛡️ Gottesschild von ${minion.name} fängt ${src} ab!`);
  } else {
    const before = minion.health;
    minion.health -= amount;
    addLog(room, `💥 ${src} trifft ${minion.name} für ${amount} (${before} → ${Math.max(0, minion.health)}).`);
    if (minion.health <= 0) triggerRageChat(room, owner, "minion_died");
  }
  owner.board = owner.board.filter(m => m.health > 0);
}
// Einzelziel-Schaden (Zauber/Heldenkräfte): Held via targetPlayerId, Diener via Besitzer-Suche.
function ffaDamageTarget(room: RoomState, amount: number, src: string, targetPlayerId?: string, targetId?: string, isTargetHero?: boolean) {
  if (isTargetHero) {
    const t = ffaHeroById(room, targetPlayerId);
    if (t) ffaHitHero(room, t, amount, src);
  } else if (targetId) {
    const found = ffaFindMinion(room, targetId);
    if (found) ffaHitMinion(room, found.owner, found.minion, amount, src);
  }
}
function ffaHealTarget(room: RoomState, caster: PlayerState, amount: number, targetPlayerId?: string, targetId?: string, isTargetHero?: boolean) {
  if (isTargetHero) {
    const t = ffaHeroById(room, targetPlayerId) || caster;
    t.health = Math.min(t.maxHealth || 30, t.health + amount);
    addLog(room, `💚 ${t.name}s Held wird um ${amount} geheilt.`);
  } else if (targetId) {
    const found = ffaFindMinion(room, targetId);
    if (found) {
      found.minion.health = Math.min(found.minion.maxHealth, found.minion.health + amount);
      addLog(room, `💚 ${found.minion.name} wird um ${amount} geheilt.`);
    }
  } else {
    caster.health = Math.min(caster.maxHealth || 30, caster.health + amount);
    addLog(room, `💚 ${caster.name}s Held wird um ${amount} geheilt.`);
  }
}
// Zufälliges Feind-Ziel quer über ALLE Gegner (Held oder Diener) - für Ragnaros/Dr. Marc.
function ffaRandomEnemyTarget(room: RoomState, actor: PlayerState): { hero?: PlayerState; owner?: PlayerState; minion?: Card } | null {
  const pool: { hero?: PlayerState; owner?: PlayerState; minion?: Card }[] = [];
  for (const o of ffaOpponents(room, actor)) {
    pool.push({ hero: o });
    o.board.forEach(m => pool.push({ owner: o, minion: m }));
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function beginFfaTurn(room: RoomState, p: PlayerState) {
  if (p.maxMana < 10) p.maxMana += 1;
  p.mana = p.maxMana;
  p.heroPowerUsed = false;
  if (p.deck.length > 0) {
    const drawn = p.deck.pop()!;
    if (p.hand.length < 10) { p.hand.push(drawn); addLog(room, `🃏 ${p.name} zieht eine Karte.`); }
    else addLog(room, `🤢 ${p.name}s Hand ist voll (10)! Verbrannt: ${drawn.name}.`);
  } else {
    p.health -= 2;
    addLog(room, `💀 ${p.name} hat keine Karten mehr! 2 Erschöpfungsschaden.`);
  }
  readyUpBoard(p.board);
  room.turn = p.id;
  room.turnEndTime = Date.now() + 45000;
  addLog(room, `⏳ ${p.name} ist am Zug!`);
}

// Gibt true zurück, wenn das Spiel vorbei ist (auch wenn schon vorher beendet).
function checkFfaVictory(room: RoomState): boolean {
  if (room.phase === "victory") return true;
  // Frisch Gefallene ausscheiden lassen (Brett leeren, einmal loggen).
  ffaSeats(room).forEach(p => {
    if (!p.isEliminated && p.health <= 0) {
      p.isEliminated = true;
      p.board = [];
      addLog(room, `☠️ ${p.name} wurde vernichtet und scheidet aus!`);
    }
  });
  const alive = ffaAlive(room);
  if (alive.length <= 1) {
    room.phase = "victory";
    const winner = alive[0] || null;
    room.winnerId = winner ? winner.id : "DRAW";
    if (winner) {
      addLog(room, `👑 ${winner.name} ist der letzte Überlebende und gewinnt Marcgard!`);
      recordWin(winner.name);
    } else {
      addLog(room, `💀 Alle gefallen. Unentschieden!`);
    }
    broadcastLobbyState();
    return true;
  }
  return false;
}

// Nächsten lebenden, online Spieler ans Ruder. Tote werden übersprungen, Offline auch
// (sonst stockt das Spiel bei einem Disconnect). Reentrancy-geschützt wie beim Duell.
function advanceFfaTurn(room: RoomState, fromConnId: string) {
  if (room.phase !== "playing") return;
  if (room.turn !== fromConnId) return; // Doppel-Auslösung (Timer + manuelles END_TURN)

  if (checkFfaVictory(room)) { broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room }); return; }

  const seats = ffaSeats(room);
  let idx = seats.findIndex(s => s.id === fromConnId);
  if (idx === -1) idx = 0;

  let next: PlayerState | null = null;
  for (let step = 1; step <= seats.length; step++) {
    const cand = seats[(idx + step) % seats.length];
    if (!cand || cand.isEliminated || cand.health <= 0) continue;
    if (!clients.has(cand.id)) continue; // offline überspringen
    next = cand;
    break;
  }
  // Fallback: niemand online außer evtl. dem Aktuellen -> irgendeinen Lebenden nehmen.
  if (!next) next = ffaAlive(room).find(p => p.id !== fromConnId) || ffaAlive(room)[0] || null;
  if (!next) { broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room }); return; }

  beginFfaTurn(room, next);

  // Erschöpfung kann den neuen Spieler sofort töten -> ausscheiden + weiterrücken.
  if (next.health <= 0) {
    if (!checkFfaVictory(room)) { advanceFfaTurn(room, next.id); return; }
  }

  checkFfaVictory(room);
  broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
}

// FFA-Battlecries: AoE trifft ALLE Gegner, Random quer über alle Gegner, alexstrasza zielbar.
function resolveFfaBattlecry(room: RoomState, actor: PlayerState, card: Card, targetPlayerId?: string, targetId?: string, isTargetHero?: boolean) {
  const opp = ffaOpponents(room, actor);
  if (card.templateId === "m_firelord") {
    addLog(room, `👑🔥 Marc the Firelord entfesselt ein Inferno über ALLE Gegner!`);
    opp.forEach(o => {
      ffaHitHero(room, o, 4, "Inferno");
      o.board.forEach(m => { if (m.hasDivineShield) m.hasDivineShield = false; else m.health -= 4; });
      o.board = o.board.filter(m => m.health > 0);
    });
  } else if (card.templateId === "dr_boom") {
    addLog(room, `💣💥 Dr. Marc entfesselt 3 Boom-Bots auf zufällige Feinde!`);
    for (let k = 0; k < 3; k++) {
      const t = ffaRandomEnemyTarget(room, actor);
      if (!t) break;
      if (t.hero) ffaHitHero(room, t.hero, 1, "Boom-Bot");
      else if (t.owner && t.minion) ffaHitMinion(room, t.owner, t.minion, 1, "Boom-Bot");
    }
  } else if (card.templateId === "ragnaros") {
    const t = ffaRandomEnemyTarget(room, actor);
    addLog(room, `🔥 Ragnaros schleudert 8 Schaden auf einen zufälligen Feind!`);
    if (t?.hero) ffaHitHero(room, t.hero, 8, "Ragnaros");
    else if (t?.owner && t?.minion) ffaHitMinion(room, t.owner, t.minion, 8, "Ragnaros");
  } else if (card.templateId === "sylvanas") {
    const withMinions = opp.filter(o => o.board.length > 0);
    if (withMinions.length > 0 && actor.board.length < 7) {
      const victim = withMinions[Math.floor(Math.random() * withMinions.length)];
      const stolen = victim.board.splice(Math.floor(Math.random() * victim.board.length), 1)[0];
      stolen.isReady = false;
      actor.board.push(stolen);
      addLog(room, `🏹 Sylvanas reißt ${stolen.name} von ${victim.name} auf deine Seite!`);
      triggerRageChat(room, victim, "high_damage");
    }
  } else if (card.templateId === "alexstrasza") {
    const targetHero = ffaHeroById(room, targetPlayerId) || actor;
    const before = targetHero.health;
    targetHero.health = 15;
    const verb = before > 15 ? "fällt auf" : before < 15 ? "steigt auf" : "bleibt bei";
    addLog(room, `🐉❤️ Marc's Breath: ${targetHero.name}s Held ${verb} 15 (${before} → 15).`);
    if (before > 15) triggerRageChat(room, targetHero, "high_damage");
  }
}

function resolveFfaSpell(room: RoomState, actor: PlayerState, card: Card, targetPlayerId?: string, targetId?: string, isTargetHero?: boolean) {
  const t = card.templateId;
  const drawN = (n: number) => {
    for (let i = 0; i < n; i++) {
      if (actor.deck.length > 0) {
        const d = actor.deck.pop()!;
        if (actor.hand.length < 10) actor.hand.push(d);
        else addLog(room, `Hand voll! Verbrannt: ${d.name}.`);
      }
    }
  };
  const aoe = (dmg: number) => {
    ffaOpponents(room, actor).forEach(o => {
      o.board.forEach(m => { if (m.hasDivineShield) m.hasDivineShield = false; else m.health -= dmg; });
      o.board = o.board.filter(m => m.health > 0);
    });
    addLog(room, `${card.name} trifft alle gegnerischen Diener für ${dmg}.`);
  };

  if (t === "arc_shot") ffaDamageTarget(room, 2, card.name, targetPlayerId, targetId, isTargetHero);
  else if (t === "fireball") ffaDamageTarget(room, 6, card.name, targetPlayerId, targetId, isTargetHero);
  else if (t === "meteor") ffaDamageTarget(room, 8, card.name, targetPlayerId, targetId, isTargetHero);
  else if (t === "pyroblast") ffaDamageTarget(room, 10, card.name, targetPlayerId, targetId, isTargetHero);
  else if (t === "heal_touch") ffaHealTarget(room, actor, 6, targetPlayerId, targetId, isTargetHero);
  else if (t === "consecration") aoe(2);
  else if (t === "flamestrike") aoe(4);
  else if (t === "pot_greed") { addLog(room, `📖 Tome of Marc: 2 Karten gezogen.`); drawN(2); }
  else if (t === "mind_control") {
    if (!isTargetHero && targetId) {
      const found = ffaFindMinion(room, targetId);
      if (found && found.owner.id !== actor.id) {
        found.owner.board = found.owner.board.filter(m => m.id !== targetId);
        if (actor.board.length < 7) {
          found.minion.isReady = false;
          actor.board.push(found.minion);
          addLog(room, `👁️ Gedankenkontrolle übernimmt ${found.minion.name}!`);
        } else {
          addLog(room, `👁️ Gedankenkontrolle zerstört ${found.minion.name} (Brett voll).`);
        }
      }
    }
  } else if (t === "custom_magic") {
    if (card.spellEffect === "damage") ffaDamageTarget(room, card.spellValue || 1, card.name, targetPlayerId, targetId, isTargetHero);
    else if (card.spellEffect === "heal") ffaHealTarget(room, actor, card.spellValue || 1, targetPlayerId, targetId, isTargetHero);
    else if (card.spellEffect === "draw") { addLog(room, `📖 Alchemie-Zauber zieht ${card.spellValue || 1} Karten.`); drawN(card.spellValue || 1); }
  }
}

function handleFfaPlayCard(room: RoomState, actor: PlayerState, payload: any, ws: WebSocket) {
  const { cardId, targetId, isTargetHero, targetPlayerId } = payload;
  const cardIdx = actor.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return;
  const card = actor.hand[cardIdx];

  if (actor.mana < card.cost) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Nicht genug Mana!" } })); return; }

  if (card.type === "minion") {
    if (actor.board.length >= 7) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dein Brett ist voll (max 7)!" } })); return; }
    actor.mana -= card.cost;
    actor.hand.splice(cardIdx, 1);
    card.isReady = card.hasCharge || false;
    actor.board.push(card);
    addLog(room, `${actor.name} beschwört ${card.name} (${card.cost} Mana, ${card.attack}/${card.health}).`);
    resolveFfaBattlecry(room, actor, card, targetPlayerId, targetId, isTargetHero);
  } else {
    actor.mana -= card.cost;
    actor.hand.splice(cardIdx, 1);
    addLog(room, `${actor.name} wirkt ${card.name} (${card.cost} Mana).`);
    resolveFfaSpell(room, actor, card, targetPlayerId, targetId, isTargetHero);
  }

  checkFfaVictory(room);
  broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
}

function handleFfaAttack(room: RoomState, actor: PlayerState, payload: any, ws: WebSocket) {
  const { attackerCardId, targetCardId, isTargetHero, targetPlayerId } = payload;
  const attacker = actor.board.find(c => c.id === attackerCardId);
  if (!attacker) return;
  if (!attacker.isReady) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dieser Diener kann diesen Zug nicht angreifen!" } })); return; }

  if (isTargetHero) {
    const target = ffaHeroById(room, targetPlayerId);
    if (!target || target.id === actor.id) return;
    if (target.board.some(m => m.hasTaunt)) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dieser Gegner hat Spott - greif zuerst einen Spott-Diener an!" } })); return; }
    target.health -= attacker.attack;
    attacker.isReady = false;
    addLog(room, `⚔️ ${attacker.name} greift ${target.name}s Held für ${attacker.attack} an.`);
    if (attacker.attack >= 4) triggerRageChat(room, target, "high_damage");
  } else if (targetCardId) {
    const found = ffaFindMinion(room, targetCardId);
    if (!found || found.owner.id === actor.id) return;
    const { owner, minion: defender } = found;
    if (owner.board.some(m => m.hasTaunt) && !defender.hasTaunt) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Du musst einen Spott-Diener angreifen!" } })); return; }

    addLog(room, `⚔️ ${attacker.name} (${attacker.attack}/${attacker.health}) greift ${defender.name} (${defender.attack}/${defender.health}) an.`);
    if (defender.hasDivineShield) { defender.hasDivineShield = false; addLog(room, `🌟 Gottesschild von ${defender.name} fängt den Angriff ab!`); }
    else defender.health -= attacker.attack;
    if (attacker.hasDivineShield) { attacker.hasDivineShield = false; addLog(room, `🌟 Gottesschild von ${attacker.name} fängt den Konter ab!`); }
    else attacker.health -= defender.attack;
    attacker.isReady = false;

    if (defender.health <= 0) triggerRageChat(room, owner, "minion_died");
    if (attacker.health <= 0) triggerRageChat(room, actor, "minion_died");
    actor.board = actor.board.filter(m => m.health > 0);
    owner.board = owner.board.filter(m => m.health > 0);
  }

  checkFfaVictory(room);
  broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
}

function handleFfaHeroPower(room: RoomState, actor: PlayerState, payload: any, ws: WebSocket) {
  const { targetId, isTargetHero, targetPlayerId } = payload;
  if (actor.heroPowerUsed) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Heldenkraft schon genutzt!" } })); return; }
  if (actor.mana < HERO_POWER_COST) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: `Heldenkraft kostet ${HERO_POWER_COST} Mana!` } })); return; }

  actor.mana -= HERO_POWER_COST;
  actor.heroPowerUsed = true;

  const pClass = actor.heroClass;
  const powerIdx = actor.selectedHeroPowerIndex ?? 0;
  const classPowers = HERO_POWERS_LIST[pClass];
  const power = classPowers[powerIdx] || classPowers[0];
  addLog(room, `${actor.name} nutzt Heldenkraft: ${power.name}.`);

  const summon = (tpl: string, name: string, emoji: string, charge: boolean, desc: string) => {
    if (actor.board.length >= 7) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dein Brett ist voll!" } })); return; }
    actor.board.push({ id: `${tpl}-${Math.random().toString(36).substring(2, 6)}`, templateId: tpl, name, type: "minion", cost: 1, attack: 1, health: 1, maxHealth: 1, emoji, description: desc, hasCharge: charge, isReady: charge });
    addLog(room, `${emoji} ${actor.name} beschwört ${name}.`);
  };

  if (pClass === "Mage") {
    if (powerIdx === 0) ffaDamageTarget(room, 1, power.name, targetPlayerId, targetId, isTargetHero);
    else if (powerIdx === 1) {
      ffaDamageTarget(room, 1, power.name, targetPlayerId, targetId, isTargetHero);
      if (targetId && !isTargetHero) { const f = ffaFindMinion(room, targetId); if (f) { f.minion.isReady = false; f.minion.frozen = true; addLog(room, `❄️ ${f.minion.name} ist eingefroren und überspringt seinen nächsten Angriff!`); } }
    } else {
      const enemyMinions = ffaOpponents(room, actor).flatMap(o => o.board.map(m => ({ owner: o, minion: m })));
      if (enemyMinions.length > 0) { const pick = enemyMinions[Math.floor(Math.random() * enemyMinions.length)]; ffaHitMinion(room, pick.owner, pick.minion, Math.floor(Math.random() * 3) + 1, power.name); }
      else { const t = ffaRandomEnemyTarget(room, actor); if (t?.hero) ffaHitHero(room, t.hero, 1, power.name); }
    }
  } else if (pClass === "Priest") {
    if (powerIdx === 0) ffaHealTarget(room, actor, 2, targetPlayerId, targetId, isTargetHero);
    else if (powerIdx === 1) {
      if (targetId) { const m = actor.board.find(x => x.id === targetId); if (m) { m.health += 2; m.maxHealth += 2; addLog(room, `✨ Power Infusion gibt ${m.name} +2 Leben.`); } }
      else { actor.health = Math.min(30, actor.health + 2); addLog(room, `✨ ${actor.name} heilt sich um 2.`); }
    } else {
      ffaDamageTarget(room, 1, power.name, targetPlayerId, targetId, isTargetHero);
      if (targetId && !isTargetHero) { const f = ffaFindMinion(room, targetId); if (f) { const b = f.minion.attack; f.minion.attack = Math.max(0, f.minion.attack - 1); f.minion.tempAttackDebuff = (f.minion.tempAttackDebuff || 0) + (b - f.minion.attack); addLog(room, `🔮 Mind Spike senkt ${f.minion.name}s Angriff vorübergehend um 1.`); } }
    }
  } else if (pClass === "Hunter") {
    if (powerIdx === 0) { const t = ffaHeroById(room, targetPlayerId); if (t && t.id !== actor.id) { ffaHitHero(room, t, 2, power.name); } else { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Wähle einen gegnerischen Helden!" } })); actor.heroPowerUsed = false; actor.mana += HERO_POWER_COST; return; } }
    else if (powerIdx === 1) summon("fast_boar", "Fast Boar", "🐗", true, "🐗 Ansturm. Schnelles Tier.");
    else { ffaOpponents(room, actor).forEach(o => { o.board.forEach(m => { if (m.hasDivineShield) m.hasDivineShield = false; else m.health -= 1; }); o.board = o.board.filter(m => m.health > 0); }); addLog(room, `💣 Sprengfalle trifft alle gegnerischen Diener für 1.`); }
  } else if (pClass === "Paladin") {
    if (powerIdx === 0) summon("sh_recruit", "Silver Hand Recruit", "🫡", false, "Von der Heldenkraft beschworen.");
    else if (powerIdx === 1) { if (targetId) { const m = actor.board.find(x => x.id === targetId); if (m) { m.hasDivineShield = true; addLog(room, `🛡️ ${m.name} erhält Gottesschild.`); } } else ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Ziel für Aegis nötig!" } })); }
    else {
      if (targetId && !isTargetHero) { const f = ffaFindMinion(room, targetId); if (f && f.owner.id !== actor.id) { ffaHitMinion(room, f.owner, f.minion, 1, power.name); actor.health = Math.min(30, actor.health + 1); addLog(room, `☀️ Holy Light: 1 Schaden + 1 Heilung.`); } }
      else { actor.health = Math.min(30, actor.health + 1); addLog(room, `☀️ Holy Light heilt deinen Helden um 1.`); }
    }
  }

  checkFfaVictory(room);
  broadcastToRoom(room.roomId, { type: "ROOM_STATE_UPDATE", payload: room });
}

// FFA-Raum frisch aufsetzen + Decks austeilen (genutzt von START_GAME und RESTART_GAME).
function setupFfaGame(room: RoomState) {
  room.phase = "hero_selection";
  room.heroSelectionEndTime = Date.now() + 10000;
  room.winnerId = null;
  room.history = [];
  const seats = ffaSeats(room);
  seats.forEach((p, i) => {
    p.deck = generateClassDeck(p.heroClass);
    p.health = 30; p.maxHealth = 30;
    p.mana = 0; p.maxMana = 0;
    p.board = []; p.hand = [];
    p.heroPowerUsed = false;
    p.isEliminated = false;
    p.isReady = false;
    p.selectedHeroPowerIndex = undefined;
    p.hasForgedThisGame = false;
    p.forgeDiceCount = 0;
    p.seat = i;
    for (let k = 0; k < 4; k++) { if (p.deck.length > 0) p.hand.push(p.deck.pop()!); }
  });
  // Zufälliger Startspieler.
  const first = seats[Math.floor(Math.random() * seats.length)];
  room.turn = first.id;
  addLog(room, `🎴 Free-for-All gestartet mit ${seats.length} Spielern! ${first.name} beginnt. Wählt eure Heldenkraft.`);
}

// Handle all core game actions
function handleGameAction(connectionId: string, action: ClientAction) {
  const ws = clients.get(connectionId);
  if (!ws) return;

  console.log(`Received action from ${connectionId}:`, action.type);

  switch (action.type) {
    case "CREATE_ROOM": {
      const { playerName, heroClass, playAgainstAI, mode, maxPlayers } = action.payload;

      // Enforce the 10 rooms limit asked by the user
      if (rooms.size >= 10) {
        ws.send(JSON.stringify({
          type: "ERROR",
          payload: { message: "Auslastungsgrenze erreicht! Es sind bereits 10 Spielräume offen. Bitte lösche einen ungenutzten Raum oder warte ab." }
        }));
        return;
      }

      // FFA-Raum: eigener Pfad (room.players[] statt player1/player2).
      if (mode === "ffa") {
        const cap = maxPlayers === 4 ? 4 : 3;
        const ffaRoomId = generateRoomCode();
        const seat0: PlayerState = {
          id: connectionId, name: playerName || "Spike", heroClass: heroClass || "Mage",
          health: 30, maxHealth: 30, mana: 0, maxMana: 0, deck: [], hand: [], board: [],
          heroPowerUsed: false, isReady: false, isOnline: true, seat: 0,
        };
        const ffaRoom: RoomState = {
          roomId: ffaRoomId, player1: null, player2: null, turn: null, phase: "lobby",
          mode: "ffa", maxPlayers: cap, players: [seat0],
          winnerId: null, history: [], messages: [], creatorId: connectionId,
          createdAt: Date.now(), lastActiveAt: Date.now(),
        };
        rooms.set(ffaRoomId, ffaRoom);
        clientRooms.set(connectionId, ffaRoomId);
        if (playerName) onlinePlayerNames.set(connectionId, playerName.trim());
        addLog(ffaRoom, `${seat0.name} eröffnet ein Free-for-All (bis ${cap} Spieler)! Teilt den Code: ${ffaRoomId}`);
        ws.send(JSON.stringify({ type: "ROOM_STATE_UPDATE", payload: ffaRoom }));
        broadcastLobbyState();
        return;
      }

      const roomId = generateRoomCode();

      const player1: PlayerState = {
        id: connectionId,
        name: playerName || "Spike",
        heroClass: heroClass || "Mage",
        health: 30,
        maxHealth: 30,
        mana: 0,
        maxMana: 0,
        deck: [],
        hand: [],
        board: [],
        heroPowerUsed: false,
        isReady: false,
        isOnline: true,
      };

      const newRoom: RoomState = {
        roomId,
        player1,
        player2: null,
        turn: null,
        phase: "lobby",
        isAIGame: playAgainstAI,
        winnerId: null,
        history: [],
        messages: [],
        creatorId: connectionId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      if (playAgainstAI) {
        newRoom.player2 = {
          id: "AI_GEMINI_OPPONENT",
          name: "Gemini AI",
          heroClass: "Mage",
          health: 30,
          maxHealth: 30,
          mana: 0,
          maxMana: 0,
          deck: [],
          hand: [],
          board: [],
          heroPowerUsed: false,
          isReady: false,
          isOnline: true,
          selectedHeroPowerIndex: 0,
        };
        addLog(newRoom, "🤖 Gemini AI has entered the arena!");
      }

      rooms.set(roomId, newRoom);
      clientRooms.set(connectionId, roomId);

      addLog(newRoom, `${player1.name} created the room! Class Selected: ${player1.heroClass}`);

      ws.send(JSON.stringify({
        type: "ROOM_STATE_UPDATE",
        payload: newRoom,
      }));

      // Update name map so online listing has current name
      if (playerName) {
        onlinePlayerNames.set(connectionId, playerName.trim());
      }

      broadcastLobbyState();
      break;
    }

    case "JOIN_ROOM": {
      const { roomId, playerName, heroClass } = action.payload;
      const cleanRoomId = roomId.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);

      if (!room) {
        ws.send(JSON.stringify({
          type: "ERROR",
          payload: { message: `Game room "${cleanRoomId}" not found!` },
        }));
        return;
      }

      // FFA-Beitritt: eigener Pfad (Sitz in players[] belegen oder per Name reconnecten).
      if (room.mode === "ffa") {
        const normFfa = (playerName || "").trim().toLowerCase();
        const seats = ffaSeats(room);
        const existing = seats.find(p => p.name.trim().toLowerCase() === normFfa);
        if (existing) {
          if (existing.heroClass !== heroClass) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: `Reconnect: deine Klasse war ${existing.heroClass}. Bitte erst die wählen.` } }));
            return;
          }
          const oldId = existing.id;
          existing.id = connectionId;
          existing.isOnline = true;
          if (room.turn === oldId) room.turn = connectionId;
          clientRooms.set(connectionId, cleanRoomId);
          if (playerName) onlinePlayerNames.set(connectionId, playerName.trim());
          addLog(room, `🪄 ${existing.name} hat sich wieder verbunden!`);
          ws.send(JSON.stringify({ type: "ROOM_STATE_UPDATE", payload: room }));
          broadcastToRoom(cleanRoomId, { type: "ROOM_STATE_UPDATE", payload: room });
          broadcastLobbyState();
          return;
        }
        if (room.phase !== "lobby") {
          ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dieses Free-for-All läuft bereits!" } }));
          return;
        }
        if (seats.length >= (room.maxPlayers ?? 3)) {
          ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Dieser Raum ist voll!" } }));
          return;
        }
        const seat: PlayerState = {
          id: connectionId, name: playerName || `Spieler ${seats.length + 1}`, heroClass: heroClass || "Mage",
          health: 30, maxHealth: 30, mana: 0, maxMana: 0, deck: [], hand: [], board: [],
          heroPowerUsed: false, isReady: false, isOnline: true, seat: seats.length,
        };
        seats.push(seat);
        clientRooms.set(connectionId, cleanRoomId);
        if (playerName) onlinePlayerNames.set(connectionId, playerName.trim());
        addLog(room, `🛡️ ${seat.name} (${seat.heroClass}) betritt das Free-for-All! (${seats.length}/${room.maxPlayers})`);
        ws.send(JSON.stringify({ type: "ROOM_STATE_UPDATE", payload: room }));
        broadcastToRoom(cleanRoomId, { type: "ROOM_STATE_UPDATE", payload: room });
        broadcastLobbyState();
        return;
      }

      const normName = (playerName || "").trim().toLowerCase();

      // RECONNECTION TAKEOVER ENGINE
      // Check if player is reconnecting with the same name as P1 or P2 in this room
      const isP1Match = room.player1 && room.player1.name.trim().toLowerCase() === normName;
      const isP2Match = room.player2 && room.player2.name.trim().toLowerCase() === normName;

      if (isP1Match) {
        if (room.player1!.heroClass !== heroClass) {
          ws.send(JSON.stringify({
            type: "ERROR",
            payload: { message: `Reconnect failed! Your original class was ${room.player1!.heroClass}. Please select it first!` },
          }));
          return;
        }
        const oldId = room.player1!.id;
        room.player1!.id = connectionId;
        room.player1!.isOnline = true;
        if (room.turn === oldId) {
          room.turn = connectionId;
        }
        clientRooms.set(connectionId, cleanRoomId);
        
        addLog(room, `🪄 Ersteller ${room.player1!.name} hat sich wieder verbunden!`);
        
        ws.send(JSON.stringify({ type: "ROOM_STATE_UPDATE", payload: room }));
        
        // Notify other player in the active game match
        broadcastToRoom(cleanRoomId, {
          type: "ROOM_STATE_UPDATE",
          payload: room,
        });

        if (playerName) {
          onlinePlayerNames.set(connectionId, playerName.trim());
        }
        broadcastLobbyState();
        return;
      }

      if (isP2Match) {
        if (room.player2!.heroClass !== heroClass) {
          ws.send(JSON.stringify({
            type: "ERROR",
            payload: { message: `Reconnect failed! Your original class was ${room.player2!.heroClass}. Please select it first!` },
          }));
          return;
        }
        const oldId = room.player2!.id;
        room.player2!.id = connectionId;
        room.player2!.isOnline = true;
        if (room.turn === oldId) {
          room.turn = connectionId;
        }
        clientRooms.set(connectionId, cleanRoomId);
        
        addLog(room, `🪄 Herausforderer ${room.player2!.name} hat sich wieder verbunden!`);
        
        ws.send(JSON.stringify({ type: "ROOM_STATE_UPDATE", payload: room }));
        
        broadcastToRoom(cleanRoomId, {
          type: "ROOM_STATE_UPDATE",
          payload: room,
        });

        if (playerName) {
          onlinePlayerNames.set(connectionId, playerName.trim());
        }
        broadcastLobbyState();
        return;
      }

      if (room.player1 && room.player2) {
        ws.send(JSON.stringify({
          type: "ERROR",
          payload: { message: "Spielraum ist bereits voll! Falls du beitreten wolltest, nutze denselben Namen für Reconnect." },
        }));
        return;
      }

      const player2: PlayerState = {
        id: connectionId,
        name: playerName || "Sibling",
        heroClass: heroClass || "Priest",
        health: 30,
        maxHealth: 30,
        mana: 0,
        maxMana: 0,
        deck: [],
        hand: [],
        board: [],
        heroPowerUsed: false,
        isReady: false,
        isOnline: true,
      };

      room.player2 = player2;
      clientRooms.set(connectionId, cleanRoomId);

      addLog(room, `${player2.name} joined the room! Class Selected: ${player2.heroClass}`);

      broadcastToRoom(cleanRoomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });

      if (playerName) {
        onlinePlayerNames.set(connectionId, playerName.trim());
      }
      broadcastLobbyState();
      break;
    }

    case "START_GAME": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      // FFA-Start: nur der Ersteller (Sitz 0) darf starten, mind. 3 Spieler.
      if (room.mode === "ffa") {
        if (ffaSeats(room)[0]?.id !== connectionId) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Nur der Ersteller kann starten." } })); return; }
        if (ffaSeats(room).length < 3) { ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Free-for-All braucht mindestens 3 Spieler!" } })); return; }
        setupFfaGame(room);
        broadcastToRoom(roomId, { type: "ROOM_STATE_UPDATE", payload: room });
        broadcastLobbyState();
        break;
      }

      if (!room.player1 || !room.player2) return;

      room.phase = "hero_selection";
      room.heroSelectionEndTime = Date.now() + 10000;
      room.winnerId = null;
      room.history = [];

      // Generate custom decks (25 cards)
      room.player1.deck = generateClassDeck(room.player1.heroClass);
      room.player2.deck = generateClassDeck(room.player2.heroClass);

      room.player1.health = 30;
      room.player2.health = 30;
      room.player1.board = [];
      room.player2.board = [];
      room.player1.hand = [];
      room.player2.hand = [];
      // Schmiede pro Partie zuruecksetzen (Spieler-Objekte werden wiederverwendet!)
      room.player1.hasForgedThisGame = false;
      room.player2.hasForgedThisGame = false;
      room.player1.forgeDiceCount = 0;
      room.player2.forgeDiceCount = 0;

      // Auto-assign AI power
      if (room.isAIGame && room.player2.id === "AI_GEMINI_OPPONENT") {
         room.player2.selectedHeroPowerIndex = 0;
      }

      // Draw 4 starting cards for both players
      for (let i = 0; i < 4; i++) {
        if (room.player1.deck.length > 0) {
          room.player1.hand.push(room.player1.deck.pop()!);
        }
        if (room.player2.deck.length > 0) {
          room.player2.hand.push(room.player2.deck.pop()!);
        }
      }

      // Roll active player randomly
      const goesFirst = Math.random() < 0.5 ? room.player1 : room.player2;
      const goesSecond = goesFirst === room.player1 ? room.player2 : room.player1;

      room.turn = goesFirst.id;
      
      // First player stats
      goesFirst.maxMana = 1;
      goesFirst.mana = 1;
      goesFirst.heroPowerUsed = false;
      
      // First player draws a 5th card to start the turn
      if (goesFirst.deck.length > 0) {
        goesFirst.hand.push(goesFirst.deck.pop()!);
      }

      // Second player stats
      goesSecond.maxMana = 0;
      goesSecond.mana = 0;
      goesSecond.heroPowerUsed = false;

      addLog(room, `Game initialized! 🚀 Form your strategy! Select your hero power.`);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "PLAY_CARD": {
      const { roomId, cardId, targetId, isTargetHero } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "playing" || room.turn !== connectionId) return;

      if (room.mode === "ffa") {
        const actor = ffaActor(room, connectionId);
        if (actor && !actor.isEliminated) handleFfaPlayCard(room, actor, action.payload, ws);
        break;
      }

      const player = room.player1?.id === connectionId ? room.player1 : room.player2;
      const opponent = player === room.player1 ? room.player2 : room.player1;
      if (!player || !opponent) return;

      const cardIdx = player.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;

      const card = player.hand[cardIdx];

      // Mana validation
      if (player.mana < card.cost) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Not enough Mana!" } }));
        return;
      }

      if (card.type === "minion") {
        // Board limit validation
        if (player.board.length >= 7) {
          ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Your board is full (max 7 minions)!" } }));
          return;
        }

        // Play minion
        player.mana -= card.cost;
        player.hand.splice(cardIdx, 1);
        
        // Summons can attack immediately if they have Charge
        card.isReady = card.hasCharge || false;
        player.board.push(card);

        addLog(room, `${player.name} played ${card.name} (${card.cost} Mana, stats: ${card.attack}/${card.health}).`);

        // Resolve Hearthstone card Battlecries (shared with the bot via resolveBattlecry).
        resolveBattlecry(room, player, opponent, card, targetId, isTargetHero);
      } else {
        // Play spell card
        player.mana -= card.cost;
        player.hand.splice(cardIdx, 1);

        addLog(room, `${player.name} casted Spell: ${card.name} (${card.cost} Mana).`);

        // Resolve spelling effect
        if (card.templateId === "arc_shot") {
          // deal 2 damage to any target
          resolveDamage(room, player, opponent, 2, targetId, isTargetHero, card.name);
        } else if (card.templateId === "heal_touch") {
          // heal 6 to any target
          resolveHeal(room, player, opponent, 6, targetId, isTargetHero);
        } else if (card.templateId === "fireball") {
          // deal 6 damage to any target
          resolveDamage(room, player, opponent, 6, targetId, isTargetHero, card.name);
        } else if (card.templateId === "meteor") {
          resolveDamage(room, player, opponent, 8, targetId, isTargetHero, card.name);
        } else if (card.templateId === "pyroblast") {
          // deal 10 damage to any target
          resolveDamage(room, player, opponent, 10, targetId, isTargetHero, card.name);
        } else if (card.templateId === "mind_control") {
          if (!isTargetHero && targetId) {
             const enemyIdx = opponent.board.findIndex(m => m.id === targetId);
             if (enemyIdx !== -1) {
                if (player.board.length < 7) {
                   const stolen = opponent.board.splice(enemyIdx, 1)[0];
                   player.board.push(stolen);
                   addLog(room, `👁️ Mind Control took over ${stolen.name}!`);
                } else {
                   opponent.board.splice(enemyIdx, 1);
                   addLog(room, `👁️ Mind Control destroyed target (board full).`);
                }
             }
          }
        } else if (card.templateId === "consecration") {
          // deal 2 damage to all enemy board minions
          opponent.board.forEach(m => {
            if (m.hasDivineShield) {
              m.hasDivineShield = false;
            } else {
              m.health -= 2;
            }
          });
          opponent.board = opponent.board.filter(m => m.health > 0);
          addLog(room, `Consecration deals 2 damage to ALL enemy minions!`);
        } else if (card.templateId === "flamestrike") {
          // deal 4 damage to all enemy board minions
          opponent.board.forEach(m => {
            if (m.hasDivineShield) {
              m.hasDivineShield = false;
            } else {
              m.health -= 4;
            }
          });
          opponent.board = opponent.board.filter(m => m.health > 0);
          addLog(room, `Flamestrike deals 4 damage to ALL enemy minions!`);
        } else if (card.templateId === "pot_greed") {
          // Draw 2 cards
          addLog(room, `📖 Tome of Marc: Draw 2 cards.`);
          for (let f = 0; f < 2; f++) {
            if (player.deck.length > 0) {
              const drawn = player.deck.pop()!;
              if (player.hand.length < 10) {
                player.hand.push(drawn);
              } else {
                addLog(room, `Burned drawn card ${drawn.name} (hand limit).`);
              }
            }
          }
        } else if (card.templateId === "custom_magic") {
          addLog(room, `✨ Alchemie-Zauber gewirkt! Effekt: ${card.spellEffect}`);
          if (card.spellEffect === "damage") {
            resolveDamage(room, player, opponent, card.spellValue || 1, targetId, isTargetHero, card.name);
          } else if (card.spellEffect === "heal") {
            resolveHeal(room, player, opponent, card.spellValue || 1, targetId, isTargetHero);
          } else if (card.spellEffect === "draw") {
            const draws = card.spellValue || 1;
            addLog(room, `📖 Alchemie-Zauber zieht ${draws} Karten.`);
            for (let f = 0; f < draws; f++) {
              if (player.deck.length > 0) {
                const drawn = player.deck.pop()!;
                if (player.hand.length < 10) {
                  player.hand.push(drawn);
                } else {
                  addLog(room, `Zu viele Karten! Verbrannt: ${drawn.name}.`);
                }
              }
            }
          }
        }
      }

      checkGameVictory(room);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "ATTACK": {
      const { roomId, attackerCardId, targetCardId, isTargetHero } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "playing" || room.turn !== connectionId) return;

      if (room.mode === "ffa") {
        const actor = ffaActor(room, connectionId);
        if (actor && !actor.isEliminated) handleFfaAttack(room, actor, action.payload, ws);
        break;
      }

      const player = room.player1?.id === connectionId ? room.player1 : room.player2;
      const opponent = player === room.player1 ? room.player2 : room.player1;
      if (!player || !opponent) return;

      const attacker = player.board.find(c => c.id === attackerCardId);
      if (!attacker) return;

      if (!attacker.isReady) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "This minion cannot attack this turn!" } }));
        return;
      }

      // Check Taunt rule: if direct opponent board has ANY taunt minions, you MUST attack one of them!
      const hasTaunts = opponent.board.some(m => m.hasTaunt);
      if (hasTaunts) {
        const isTargetingTaunt = targetCardId && opponent.board.find(m => m.id === targetCardId)?.hasTaunt;
        if (!isTargetingTaunt) {
          ws.send(JSON.stringify({ type: "ERROR", payload: { message: "You MUST target a minion with Taunt!" } }));
          return;
        }
      }

      // Combat resolution
      if (isTargetHero) {
        // Attack Enemy Hero directly
        opponent.health -= attacker.attack;
        addLog(room, `⚔️ ${attacker.name} attacked the enemy Hero for ${attacker.attack} damage.`);
        
        attacker.isReady = false;
      } else if (targetCardId) {
        const defender = opponent.board.find(c => c.id === targetCardId);
        if (!defender) return;

        addLog(room, `⚔️ ${attacker.name} (${attacker.attack}/${attacker.health}) attacks ${defender.name} (${defender.attack}/${defender.health}).`);

        // Attacker deals damage to defender (checking Divine Shield)
        if (defender.hasDivineShield) {
          defender.hasDivineShield = false;
          addLog(room, `🌟 ${defender.name}'s Divine Shield absorbed the attack!`);
        } else {
          defender.health -= attacker.attack;
        }

        // Defender deals damage back to attacker (checking Divine Shield on attacker)
        if (attacker.hasDivineShield) {
          attacker.hasDivineShield = false;
          addLog(room, `🌟 ${attacker.name}'s Divine Shield absorbed the retaliation!`);
        } else {
          attacker.health -= defender.attack;
        }

        // Mark attacker exhausted
        attacker.isReady = false;

        // Trigger automated rage talk for dead minions
        const playerMinionsDied = player.board.filter(m => m.health <= 0);
        const opponentMinionsDied = opponent.board.filter(m => m.health <= 0);
        if (playerMinionsDied.length > 0) {
          triggerRageChat(room, player, "minion_died");
        }
        if (opponentMinionsDied.length > 0) {
          triggerRageChat(room, opponent, "minion_died");
        }

        // Clean dead minions
        player.board = player.board.filter(m => m.health > 0);
        opponent.board = opponent.board.filter(m => m.health > 0);
      }

      checkGameVictory(room);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "USE_HERO_POWER": {
      const { roomId, targetId, isTargetHero } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "playing" || room.turn !== connectionId) return;

      if (room.mode === "ffa") {
        const actor = ffaActor(room, connectionId);
        if (actor && !actor.isEliminated) handleFfaHeroPower(room, actor, action.payload, ws);
        break;
      }

      const player = room.player1?.id === connectionId ? room.player1 : room.player2;
      const opponent = player === room.player1 ? room.player2 : room.player1;
      if (!player || !opponent) return;

      if (player.heroPowerUsed) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "You already used your Hero Power this turn!" } }));
        return;
      }

      if (player.mana < HERO_POWER_COST) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: `Hero Power costs ${HERO_POWER_COST} Mana!` } }));
        return;
      }

      player.mana -= HERO_POWER_COST;
      player.heroPowerUsed = true;

      const pClass = player.heroClass;
      const powerIdx = player.selectedHeroPowerIndex ?? 0;
      const classPowers = HERO_POWERS_LIST[pClass];
      const activePower = classPowers[powerIdx] || classPowers[0];

      addLog(room, `${player.name} used Hero Power: ${activePower.name}.`);

      if (pClass === "Mage") {
        if (powerIdx === 0) {
          // Fireblast: deal 1 damage to any target
          resolveDamage(room, player, opponent, 1, targetId, isTargetHero, activePower.name);
        } else if (powerIdx === 1) {
          // Chilled Arcana: 1 Schaden + echtes Einfrieren (ueberspringt naechsten Angriff)
          resolveDamage(room, player, opponent, 1, targetId, isTargetHero, activePower.name);
          if (targetId && !isTargetHero) {
            const minion = opponent.board.find(m => m.id === targetId) || player.board.find(m => m.id === targetId);
            if (minion) {
              minion.isReady = false;
              minion.frozen = true;
              addLog(room, `❄️ ${minion.name} ist eingefroren und überspringt seinen nächsten Angriff!`);
            }
          }
        } else {
          // Unstable Magic: Deals 1-3 random damage to a random enemy minion
          const enemyMinions = opponent.board;
          if (enemyMinions.length > 0) {
            const randomMinion = enemyMinions[Math.floor(Math.random() * enemyMinions.length)];
            const randDmg = Math.floor(Math.random() * 3) + 1;
            if (randomMinion.hasDivineShield) {
              randomMinion.hasDivineShield = false;
            } else {
              randomMinion.health -= randDmg;
            }
            addLog(room, `🌀 Unstable Magic deals ${randDmg} damage to ${randomMinion.name}.`);
            opponent.board = opponent.board.filter(m => m.health > 0);
          } else {
            opponent.health -= 1;
            addLog(room, `🌀 Unstable Magic deals 1 damage directly to ${opponent.name}.`);
          }
        }
      } else if (pClass === "Priest") {
        if (powerIdx === 0) {
          // Lesser Heal: restore 2 health to any target
          resolveHeal(room, player, opponent, 2, targetId, isTargetHero);
        } else if (powerIdx === 1) {
          // Power Infusion: Give a friendly minion +2 Health
          if (targetId) {
            const minion = player.board.find(m => m.id === targetId);
            if (minion) {
              minion.health += 2;
              minion.maxHealth += 2;
              addLog(room, `✨ Power Infusion gave +2 Max Health to ${minion.name}.`);
            }
          } else {
            player.health = Math.min(30, player.health + 2);
            addLog(room, `✨ Power Infusion healed ${player.name} for 2 Health.`);
          }
        } else {
          // Mind Spike: 1 Schaden + temporaerer Angriffs-Debuff (-1 bis zum naechsten Zug des Diener)
          resolveDamage(room, player, opponent, 1, targetId, isTargetHero, activePower.name);
          if (targetId && !isTargetHero) {
            const minion = opponent.board.find(m => m.id === targetId);
            if (minion) {
              const before = minion.attack;
              minion.attack = Math.max(0, minion.attack - 1);
              minion.tempAttackDebuff = (minion.tempAttackDebuff || 0) + (before - minion.attack);
              addLog(room, `🔮 Mind Spike senkt ${minion.name}s Angriff vorübergehend um 1.`);
            }
          }
        }
      } else if (pClass === "Hunter") {
        if (powerIdx === 0) {
          // Steady Shot: deal 2 damage to enemy hero
          opponent.health -= 2;
          addLog(room, `🏹 Steady Shot dealt 2 damage directly to ${opponent.name}.`);
          triggerRageChat(room, opponent, "high_damage");
        } else if (powerIdx === 1) {
          // Call Pet: Summon a 1/1 Fast Boar with Charge
          if (player.board.length < 7) {
            const boarId = `boar-${Math.random().toString(36).substring(2, 6)}`;
            const boar: Card = {
              id: boarId,
              templateId: "fast_boar",
              name: "Fast Boar",
              type: "minion",
              cost: 1,
              attack: 1,
              health: 1,
              maxHealth: 1,
              emoji: "🐗",
              description: "🐗 Charge. Fast pet.",
              hasCharge: true,
              isReady: true,
            };
            player.board.push(boar);
            addLog(room, `🐗 Summoned a 1/1 Fast Boar with Charge.`);
          } else {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Your board is full!" } }));
          }
        } else {
          // Explosive Trap: Deal 1 damage to all enemy minions
          opponent.board.forEach(m => {
            if (m.hasDivineShield) {
              m.hasDivineShield = false;
            } else {
              m.health -= 1;
            }
          });
          opponent.board = opponent.board.filter(m => m.health > 0);
          addLog(room, `💣 Explosive Trap deals 1 damage to all enemy minions.`);
        }
      } else if (pClass === "Paladin") {
        if (powerIdx === 0) {
          // Reinforce: summon 1/1 Silver Hand recruit
          if (player.board.length < 7) {
            const recruitId = `recruit-${Math.random().toString(36).substring(2, 6)}`;
            const recruit: Card = {
              id: recruitId,
              templateId: "sh_recruit",
              name: "Silver Hand Recruit",
              type: "minion",
              cost: 1,
              attack: 1,
              health: 1,
              maxHealth: 1,
              emoji: "🫡",
              description: "Summoned by Recruit Hero Power.",
              isReady: false,
            };
            player.board.push(recruit);
            addLog(room, `🫡 Summoned a 1/1 Silver Hand Recruit.`);
          } else {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Board is full! Recruit couldn't join." } }));
          }
        } else if (powerIdx === 1) {
          // Aegis Armor: Give a friendly minion Divine Shield
          if (targetId) {
            const minion = player.board.find(m => m.id === targetId);
            if (minion) {
              minion.hasDivineShield = true;
              addLog(room, `🛡️ Aegis Armor granted Divine Shield to ${minion.name}.`);
            }
          } else {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Target required for Aegis Armor!" } }));
          }
        } else {
          // Holy Light: Deals 1 damage to an enemy minion and restores 1 health to your hero
          if (targetId && !isTargetHero) {
            const minion = opponent.board.find(m => m.id === targetId);
            if (minion) {
              if (minion.hasDivineShield) {
                minion.hasDivineShield = false;
              } else {
                minion.health -= 1;
              }
              opponent.board = opponent.board.filter(m => m.health > 0);
              player.health = Math.min(30, player.health + 1);
              addLog(room, `☀️ Holy Light dealt 1 damage to ${minion.name} and healed your hero by 1.`);
            }
          } else {
            player.health = Math.min(30, player.health + 1);
            addLog(room, `☀️ Holy Light healed your hero by 1.`);
          }
        }
      }

      checkGameVictory(room);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "SELECT_HERO_POWER": {
      const { roomId, powerIndex } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "hero_selection") return;

      const player = room.mode === "ffa"
        ? ffaActor(room, connectionId)
        : (room.player1?.id === connectionId ? room.player1 : room.player2);
      if (!player) return;

      player.selectedHeroPowerIndex = powerIndex;
      const cPowers = HERO_POWERS_LIST[player.heroClass];
      const selectedPower = cPowers[powerIndex] || cPowers[0];
      
      addLog(room, `🛡️ ${player.name} selected magic path: ${selectedPower.name}.`);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });

      if (room.player1?.selectedHeroPowerIndex !== undefined && room.player2?.selectedHeroPowerIndex !== undefined) {
          beginGamePhase(room);
      }
      break;
    }

    case "CREATE_CUSTOM_CARD": {
      const { roomId, name, type, attack, health, emoji, description, hasTaunt, hasCharge, hasDivineShield, spellEffect, spellValue } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.mode === "ffa"
        ? ffaActor(room, connectionId)
        : (room.player1?.id === connectionId ? room.player1 : room.player2);
      if (!player) return;

      if (player.hasForgedThisGame) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Du kannst die Alchemie-Schmiede nur einmal pro Spiel nutzen!" } }));
        return;
      }

      if (player.hand.length >= 10) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Deine Hand ist voll!" } }));
        return;
      }

      // Stats serverseitig auf 1-10 clampen + Kosten autoritativ berechnen (Client-`cost` ignorieren).
      const cardType: "minion" | "spell" = type === "spell" ? "spell" : "minion";
      const clampStat = (n: number) => Math.min(10, Math.max(1, Math.floor(Number(n)) || 1));
      const safeAttack = cardType === "minion" ? clampStat(attack) : undefined;
      const safeHealth = cardType === "minion" ? clampStat(health) : undefined;
      const safeSpellValue = cardType === "spell" ? clampStat(spellValue) : undefined;
      const serverCost = computeForgeCost({
        type: cardType,
        attack: safeAttack, health: safeHealth,
        hasTaunt: !!hasTaunt, hasCharge: !!hasCharge, hasDivineShield: !!hasDivineShield,
        spellEffect, spellValue: safeSpellValue,
      });
      if (serverCost > 10) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Diese Karte ist zu maechtig (max 10 Mana)." } }));
        return;
      }

      const customCard: Card = {
        id: `custom-${Math.random().toString(36).substring(2, 6)}`,
        templateId: "custom_magic",
        name: name || (cardType === "spell" ? "Custom Spell" : "Custom Minion"),
        type: cardType,
        cost: serverCost,
        attack: safeAttack,
        health: safeHealth,
        maxHealth: safeHealth,
        emoji: emoji || "🔮",
        description: description || "Ein meisterhaft geschmiedeter Zauber.",
        hasTaunt: cardType === "minion" ? !!hasTaunt : false,
        hasCharge: cardType === "minion" ? !!hasCharge : false,
        hasDivineShield: cardType === "minion" ? !!hasDivineShield : false,
        spellEffect: cardType === "spell" ? spellEffect : undefined,
        spellValue: safeSpellValue,
        isReady: false,
      };

      player.hand.push(customCard);
      player.hasForgedThisGame = true;
      addLog(room, `🧪 Alchemy Success! ${player.name} hat eine geheime Karte erschaffen: ${customCard.name} (${customCard.cost} Mana)!`);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "ROLL_FORGE_DICE": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "playing" || room.turn !== connectionId) return;

      const player = room.mode === "ffa"
        ? ffaActor(room, connectionId)
        : (room.player1?.id === connectionId ? room.player1 : room.player2);
      if (!player) return;

      const diceManaCost = (player.forgeDiceCount ?? 0) + 1;
      if (player.mana < diceManaCost) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: `Der Götter-Würfel kostet ${diceManaCost} Mana.` } }));
        return;
      }
      if (player.hand.length >= 10) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Deine Hand ist voll!" } }));
        return;
      }

      player.mana -= diceManaCost;
      player.forgeDiceCount = (player.forgeDiceCount ?? 0) + 1;
      const diceCard = rollForgedCard(diceManaCost);
      player.hand.push(diceCard);
      const stats = diceCard.type === "minion" ? `${diceCard.attack}/${diceCard.health}` : "Zauber";
      addLog(room, `🎲 Götter-Würfel (${diceManaCost} Mana): ${player.name} erhält ${diceCard.name} (${stats}, ${diceCard.cost} Mana).`);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "END_TURN": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.phase !== "playing" || room.turn !== connectionId) return;

      if (room.mode === "ffa") advanceFfaTurn(room, room.turn);
      else processEndTurn(room, room.turn);
      break;
    }

    case "SEND_CHAT": {
      const { roomId, text } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      const senderState = room.mode === "ffa"
        ? ffaActor(room, connectionId)
        : (room.player1?.id === connectionId ? room.player1 : room.player2);
      if (!senderState) return;

      const message: ChatMessage = {
        id: `chat-${Math.random().toString(36).substring(2, 6)}`,
        senderId: connectionId,
        senderName: senderState.name,
        text: text.trim().substring(0, 150),
        timestamp: new Date().toLocaleTimeString(),
      };

      room.messages.push(message);
      if (room.messages.length > 40) {
        room.messages.shift();
      }

      broadcastToRoom(roomId, {
        type: "CHAT_MESSAGE",
        payload: message,
      });
      break;
    }

    case "RESTART_GAME": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      // FFA: zurück in die Lobby, Sitze behalten (Ersteller startet neu).
      if (room.mode === "ffa") {
        room.phase = "lobby";
        room.turn = null;
        room.winnerId = null;
        room.history = [];
        room.messages = [];
        ffaSeats(room).forEach(p => {
          p.health = 30; p.maxHealth = 30; p.board = []; p.hand = []; p.deck = [];
          p.mana = 0; p.maxMana = 0; p.isEliminated = false; p.heroPowerUsed = false;
          p.hasForgedThisGame = false; p.forgeDiceCount = 0; p.selectedHeroPowerIndex = undefined;
        });
        addLog(room, `Free-for-All zurückgesetzt. Der Ersteller kann neu starten!`);
        broadcastToRoom(roomId, { type: "ROOM_STATE_UPDATE", payload: room });
        broadcastLobbyState();
        break;
      }

      room.phase = "lobby";
      room.winnerId = null;
      room.history = [];
      room.messages = [];
      if (room.player1) {
        room.player1.health = 30;
        room.player1.board = [];
        room.player1.hand = [];
        room.player1.deck = [];
        room.player1.mana = 0;
        room.player1.maxMana = 0;
        room.player1.hasForgedThisGame = false;
        room.player1.forgeDiceCount = 0;
      }
      if (room.player2) {
        room.player2.health = 30;
        room.player2.board = [];
        room.player2.hand = [];
        room.player2.deck = [];
        room.player2.mana = 0;
        room.player2.maxMana = 0;
        room.player2.hasForgedThisGame = false;
        room.player2.forgeDiceCount = 0;
      }

      addLog(room, `Game reset by player request. Ready for a new duel!`);

      broadcastToRoom(roomId, {
        type: "ROOM_STATE_UPDATE",
        payload: room,
      });
      break;
    }

    case "LEAVE_ROOM": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (room && room.mode === "ffa") {
        const seats = ffaSeats(room);
        const seat = seats.find(p => p.id === connectionId);
        if (seat) {
          if (room.phase === "lobby") {
            // In der Lobby: Sitz ganz entfernen + Sitze neu nummerieren.
            room.players = seats.filter(p => p.id !== connectionId).map((p, i) => ({ ...p, seat: i }));
            addLog(room, `${seat.name} hat das Free-for-All verlassen.`);
          } else {
            // Im Spiel: als ausgeschieden markieren (gibt den Rest frei).
            seat.isEliminated = true;
            seat.health = 0;
            seat.board = [];
            addLog(room, `${seat.name} hat aufgegeben und scheidet aus.`);
            checkFfaVictory(room);
            if (room.turn === connectionId && room.phase === "playing") advanceFfaTurn(room, connectionId);
          }
        }
        if ((room.players?.length ?? 0) === 0) rooms.delete(roomId);
        else broadcastToRoom(roomId, { type: "ROOM_STATE_UPDATE", payload: room });
        clientRooms.delete(connectionId);
        broadcastLobbyState();
        break;
      }
      if (room) {
        if (room.player1 && room.player1.id === connectionId) {
          room.player1 = null;
        } else if (room.player2 && room.player2.id === connectionId) {
          room.player2 = null;
        }
        addLog(room, `Ein Spieler hat die Lobby verlassen.`);
        if (!room.player1 && !room.player2) {
          rooms.delete(roomId);
        } else {
          broadcastToRoom(roomId, {
            type: "ROOM_STATE_UPDATE",
            payload: room,
          });
        }
      }
      clientRooms.delete(connectionId);
      handleCleanDisconnect(connectionId, roomId);
      broadcastLobbyState();
      break;
    }

    case "REGISTER_NAME": {
      const { name } = action.payload;
      if (name && typeof name === "string") {
        onlinePlayerNames.set(connectionId, name.trim());
      }
      broadcastLobbyState();
      break;
    }

    case "ADD_BOT": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;
      // Only the host of an empty, not-yet-started room may add the practice bot.
      if (!room.player1 || room.player1.id !== connectionId) return;
      if (room.player2 || room.phase !== "lobby") return;

      room.player2 = {
        id: BOT_ID,
        name: "Holgar (Übungsgegner)",
        heroClass: "Hunter",
        health: 30,
        maxHealth: 30,
        mana: 0,
        maxMana: 0,
        deck: [],
        hand: [],
        board: [],
        heroPowerUsed: false,
        isReady: false,
        isOnline: true,
        selectedHeroPowerIndex: 0,
      };
      room.isAIGame = true;
      addLog(room, "🛡️ Holgar der Übungsgegner betritt die Halle!");

      broadcastToRoom(roomId, { type: "ROOM_STATE_UPDATE", payload: room });
      broadcastLobbyState();
      break;
    }

    case "DELETE_ROOM": {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (room) {
        const myName = onlinePlayerNames.get(connectionId) || "";
        const isCreator = (room.player1 && room.player1.id === connectionId) || 
                          (room.player1 && room.player1.name === myName) || 
                          (room.creatorId === connectionId);

        if (isCreator) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted by creator.`);
          broadcastToRoom(roomId, {
            type: "ROOM_STATE_UPDATE",
            payload: {
              ...room,
              phase: "lobby",
              player1: null,
              player2: null,
              winnerId: null,
              history: ["Raum vom Ersteller gelöscht."],
            }
          });
          broadcastLobbyState();
        } else {
          ws.send(JSON.stringify({
            type: "ERROR",
            payload: { message: "Nur der Ersteller dieses Raums darf diesen löschen!" }
          }));
        }
      }
      break;
    }
  }
}

// Target damage resolver (Spells and target-based Hero Powers).
// sourceName = was den Schaden verursacht (Zauber-/Kraft-Name), damit der Log
// klar sagt WER WIE VIEL Schaden gemacht hat (+ HP von/bis).
function resolveDamage(room: RoomState, player: PlayerState, opponent: PlayerState, amount: number, targetId?: string, isTargetHero?: boolean, sourceName?: string) {
  const src = sourceName ?? "Zauber";
  if (isTargetHero) {
    const hpBefore = opponent.health;
    opponent.health -= amount;
    addLog(room, `💥 ${src} trifft ${opponent.name}s Held für ${amount} (${hpBefore} → ${opponent.health}).`);
    if (amount >= 4) {
      triggerRageChat(room, opponent, "high_damage");
    }
  } else if (targetId) {
    // Search both boards
    let targetMinion = player.board.find(m => m.id === targetId);
    let mine = true;
    if (!targetMinion) {
      targetMinion = opponent.board.find(m => m.id === targetId);
      mine = false;
    }

    if (targetMinion) {
      if (targetMinion.hasDivineShield) {
        targetMinion.hasDivineShield = false;
        addLog(room, `🛡️ Gottesschild von ${targetMinion.name} fängt ${src} ab!`);
      } else {
        const hpBefore = targetMinion.health;
        targetMinion.health -= amount;
        addLog(room, `💥 ${src} trifft ${targetMinion.name} für ${amount} (${hpBefore} → ${Math.max(0, targetMinion.health)}).`);
        if (targetMinion.health <= 0) {
          triggerRageChat(room, mine ? player : opponent, "minion_died");
        }
      }

      // Filter out dead minions
      player.board = player.board.filter(m => m.health > 0);
      opponent.board = opponent.board.filter(m => m.health > 0);
    }
  }
}

// Target heal resolver (Healing touch, Lesser Heals)
function resolveHeal(room: RoomState, player: PlayerState, opponent: PlayerState, amount: number, targetId?: string, isTargetHero?: boolean) {
  if (isTargetHero) {
    player.health = Math.min(30, player.health + amount);
    addLog(room, `💚 Healed Hero ${player.name} for ${amount} Health.`);
  } else if (targetId) {
    let targetMinion = player.board.find(m => m.id === targetId);
    if (!targetMinion) {
      targetMinion = opponent.board.find(m => m.id === targetId);
    }
    if (targetMinion) {
      targetMinion.health = Math.min(targetMinion.maxHealth, targetMinion.health + amount);
      addLog(room, `💚 Healed ${targetMinion.name} for ${amount} Health.`);
    }
  }
}

// Verify if hero health is 0 or less
function checkGameVictory(room: RoomState) {
  if (!room.player1 || !room.player2) return;
  if (room.phase === "victory") return; // Already recorded

  if (room.player1.health <= 0 && room.player2.health <= 0) {
    room.phase = "victory";
    room.winnerId = "DRAW";
    addLog(room, `💀 Mutual destruction! The duel ends in a tie!`);
  } else if (room.player1.health <= 0) {
    room.phase = "victory";
    room.winnerId = room.player2.id;
    addLog(room, `👑 ${room.player2.name} is Victorous! ${room.player1.name}'s hero has fallen!`);
    recordWin(room.player2.name);
    broadcastLobbyState();
  } else if (room.player2.health <= 0) {
    room.phase = "victory";
    room.winnerId = room.player1.id;
    addLog(room, `👑 ${room.player1.name} is Victorous! ${room.player2.name}'s hero has fallen!`);
    recordWin(room.player1.name);
    broadcastLobbyState();
  }
}

// Disconnect helper with game retention logic
function handleCleanDisconnect(connectionId: string, manualRoomId?: string) {
  const roomId = manualRoomId || clientRooms.get(connectionId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  let anyChange = false;

  if (room.mode === "ffa") {
    const seat = ffaSeats(room).find(p => p.id === connectionId);
    if (seat) {
      seat.isOnline = false;
      addLog(room, `${seat.name} hat die Verbindung verloren.`);
      anyChange = true;
      // Falls der Spieler am Zug war: weiterrücken, sonst stockt das Spiel bis Timer.
      if (room.phase === "playing" && room.turn === connectionId) advanceFfaTurn(room, connectionId);
    }
  } else if (room.player1 && room.player1.id === connectionId) {
    room.player1.isOnline = false;
    addLog(room, `${room.player1.name} hat die Verbindung verloren.`);
    anyChange = true;
  } else if (room.player2 && room.player2.id === connectionId) {
    room.player2.isOnline = false;
    addLog(room, `${room.player2.name} hat die Verbindung verloren.`);
    anyChange = true;
  }

  clientRooms.delete(connectionId);

  // We DO NOT set player to null or set phase = lobby inside handleCleanDisconnect
  // during active gameplay! This allows players to reconnect and continue!
  if (anyChange) {
    broadcastToRoom(roomId, {
      type: "ROOM_STATE_UPDATE",
      payload: room,
    });
  }

  broadcastLobbyState();
}

// Periodic cleanup timer to prevent leak of stagnant rooms
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [roomId, room] of rooms.entries()) {
    const isRoomExpired = (room.createdAt || Date.now()) < oneHourAgo;

    // Mitglieds-basiert (deckt Duell p1/p2 UND FFA players[] ab).
    const memberIds = roomMemberIds(room);
    const noPlayers = memberIds.length === 0;
    const anyOnline = memberIds.some(id => clients.has(id));

    if (noPlayers || (isRoomExpired && !anyOnline)) {
      rooms.delete(roomId);
      console.log(`Garbage Collector: Room ${roomId} removed (Expired or empty).`);
    }
  }
  broadcastLobbyState();
}, 2 * 60 * 1000); // Check every 2 minutes

// Handle WebSocket upgrades and messaging
wss.on("connection", (ws) => {
  const connectionId = `usr-${Math.random().toString(36).substring(2, 8)}`;
  clients.set(connectionId, ws);

  // Heartbeat: browsers auto-reply to protocol pings. We mark the socket alive on every pong;
  // the heartbeat interval below terminates sockets that stopped answering (half-open connections).
  (ws as any).isAlive = true;
  ws.on("pong", () => {
    (ws as any).isAlive = true;
  });

  console.log(`Client connected: ${connectionId}`);

  // Push latest lobby state on new connection
  ws.send(JSON.stringify({
    type: "LOBBY_STATE_UPDATE",
    payload: {
      rooms: Array.from(rooms.values()).map(buildRoomInfo),
      onlinePlayers: Array.from(clients.keys()).map(id => ({
        id,
        name: onlinePlayerNames.get(id) || "Suchender Magier 🪄"
      })),
      leaderboard: Array.from(globalLeaderboard.entries()).map(([name, score]) => ({ name, score })).sort((a,b) => b.score - a.score)
    }
  }));

  ws.on("message", (msg) => {
    try {
      const action = JSON.parse(msg.toString()) as ClientAction;
      handleGameAction(connectionId, action);
    } catch (e) {
      console.error("Failed to parse websocket message:", e);
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${connectionId}`);
    handleCleanDisconnect(connectionId);
    clients.delete(connectionId);
    onlinePlayerNames.delete(connectionId);
    broadcastLobbyState();
  });
});

// Heartbeat sweep: ping every client every 30s, terminate the ones that didn't pong since last sweep.
// Keeps connections warm through idle proxies and frees rooms from dead sockets fast.
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if ((ws as any).isAlive === false) {
      ws.terminate();
      return;
    }
    (ws as any).isAlive = false;
    try {
      ws.ping();
    } catch {
      // socket already gone; the close handler cleans up
    }
  });
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

// API health endpoint (required/standard). Also used by the keep-alive ping to stop the host sleeping.
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", rooms: rooms.size, clients: clients.size });
});

// Serve modern React frontend
async function startServer() {
  // Render (and most hosts) inject the port via env. Fall back to 3000 for local dev.
  const PORT = Number(process.env.PORT) || 3000;

  // Handle ES Modules vs CommonJS compat safely for both dev and bundled production
  let currentFilename = "";
  try {
    currentFilename = __filename;
  } catch {
    currentFilename = new URL(import.meta.url).pathname;
  }

  let currentDirname = "";
  try {
    currentDirname = __dirname;
  } catch {
    currentDirname = path.dirname(currentFilename);
  }

  // Robustly detect production mode
  const isProduction =
    process.env.NODE_ENV === "production" ||
    currentFilename.includes("server.cjs") ||
    currentFilename.includes("dist");

  if (!isProduction) {
    // Serve development builds with HMR turned off
    // Dynamically import Vite to prevent startup errors in production environment where Vite is not needed
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve single-page production builds
    // Ensure distPath is correct whether process.cwd() is project root or inside dist/
    const distPath =
      currentFilename.includes("server.cjs") || currentFilename.includes("dist")
        ? currentDirname
        : path.join(process.cwd(), "dist");

    console.log(`Serving static files from production path: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen on port 3000 and binding host '0.0.0.0' for Cloud Run containers
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
  });
}

startServer();
