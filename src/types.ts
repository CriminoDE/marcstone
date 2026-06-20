export type CardType = "minion" | "spell";

export interface Card {
  id: string; // unique instance ID (uuid or short id)
  templateId: string; // which pre-made card this is
  name: string;
  type: CardType;
  cost: number;
  attack: number;
  health: number;
  maxHealth: number;
  emoji: string;
  description: string;
  hasTaunt?: boolean;
  hasCharge?: boolean;
  hasDivineShield?: boolean;
  battlecryNeedsTarget?: boolean; // Diener-Battlecry braucht ein Ziel (z.B. Marc's Breath -> Held)
  isReady?: boolean; // can attack this turn
  spellEffect?: "damage" | "heal" | "draw";
  spellValue?: number;
}

export type HeroClass = "Mage" | "Priest" | "Hunter" | "Paladin";

export interface PlayerState {
  id: string; // connection/user ID
  name: string;
  heroClass: HeroClass;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: Card[];
  heroPowerUsed: boolean;
  hasForgedThisGame?: boolean;
  forgeDiceCount?: number; // wie oft der Goetter-Wuerfel diese Partie genutzt wurde (steigende Kosten)
  isReady: boolean;
  isOnline?: boolean; // True if player currently connected to WebSocket server
  selectedHeroPowerIndex?: number; // 0, 1, or 2 (undefined means they still need to choose)
  isEliminated?: boolean; // FFA: Held tot -> raus aus der Zug-Rotation, Brett geleert
  seat?: number; // FFA: Sitzplatz-Index (0 = Ersteller), bestimmt Anordnung im Dreieck/Kreis
}

export type GameMode = "duel" | "ffa"; // duel = 1v1 (Haupt), ffa = Free-for-All 3-4 Spieler (Spassmodus)

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface RoomState {
  roomId: string;
  player1: PlayerState | null;
  player2: PlayerState | null;
  turn: string | null; // socket ID of active player
  turnEndTime?: number; // epoch timestamp when turn ends
  heroSelectionEndTime?: number; // epoch timestamp for hero selection countdown
  phase: "lobby" | "hero_selection" | "playing" | "victory";
  mode?: GameMode; // undefined/"duel" = 1v1 (Standard), "ffa" = Free-for-All
  players?: PlayerState[]; // FFA: alle Sitze (3-4). Im Duell ungenutzt (player1/player2 bleiben Wahrheit).
  maxPlayers?: number; // FFA: 3 oder 4
  isAIGame?: boolean;
  winnerId: string | null;
  history: string[]; // server action log e.g., "Player A summoned Boulderfist Ogre"
  messages: ChatMessage[];
  creatorId?: string; // Socket ID of room creator
  createdAt?: number; // Epoch timestamp of room creation
  lastActiveAt?: number; // Epoch timestamp of last active action
}

export interface OpenRoomInfo {
  roomId: string;
  p1Name: string | null;
  p2Name: string | null;
  p1Class: HeroClass | null;
  p2Class: HeroClass | null;
  p1Online: boolean;
  p2Online: boolean;
  phase: "lobby" | "hero_selection" | "playing" | "victory";
  creatorId: string;
  mode?: GameMode; // "ffa" => Free-for-All-Raum
  playerCount?: number; // FFA: aktuelle Sitz-Belegung
  maxPlayers?: number; // FFA: 3 oder 4
}

export interface OnlinePlayerInfo {
  id: string;
  name: string;
}

export type GameEvent =
  | { type: "ROOM_STATE_UPDATE"; payload: RoomState }
  | { type: "ERROR"; payload: { message: string } }
  | { type: "CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "LOBBY_STATE_UPDATE"; payload: { rooms: OpenRoomInfo[]; onlinePlayers: OnlinePlayerInfo[]; leaderboard: {name: string, score: number}[] } };

export type ClientAction =
  | { type: "CREATE_ROOM"; payload: { playerName: string; heroClass: HeroClass; playAgainstAI?: boolean; mode?: GameMode; maxPlayers?: number } }
  | { type: "JOIN_ROOM"; payload: { roomId: string; playerName: string; heroClass: HeroClass } }
  | { type: "START_GAME"; payload: { roomId: string } }
  | { type: "PLAY_CARD"; payload: { roomId: string; cardId: string; targetId?: string; isTargetHero?: boolean; targetPlayerId?: string } }
  | { type: "ATTACK"; payload: { roomId: string; attackerCardId: string; targetCardId?: string; isTargetHero?: boolean; targetPlayerId?: string } }
  | { type: "USE_HERO_POWER"; payload: { roomId: string; targetId?: string; isTargetHero?: boolean; targetPlayerId?: string } }
  | { type: "SELECT_HERO_POWER"; payload: { roomId: string; powerIndex: number } }
  | { type: "CREATE_CUSTOM_CARD"; payload: { roomId: string; name: string; type: "minion" | "spell"; cost: number; attack: number; health: number; emoji: string; description: string; hasTaunt: boolean; hasCharge: boolean; hasDivineShield: boolean; spellEffect?: "damage" | "heal" | "draw"; spellValue?: number } }
  | { type: "END_TURN"; payload: { roomId: string } }
  | { type: "SEND_CHAT"; payload: { roomId: string; text: string } }
  | { type: "RESTART_GAME"; payload: { roomId: string } }
  | { type: "ROLL_FORGE_DICE"; payload: { roomId: string } }
  | { type: "LEAVE_ROOM"; payload: { roomId: string } }
  | { type: "REGISTER_NAME"; payload: { name: string } }
  | { type: "ADD_BOT"; payload: { roomId: string } }
  | { type: "DELETE_ROOM"; payload: { roomId: string } };
