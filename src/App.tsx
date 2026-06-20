import React, { useState, useEffect, useRef } from "react";
import { Lobby } from "./components/Lobby";
import { CardItem } from "./components/CardItem";
import { HeroState } from "./components/HeroState";
import { ChatPanel } from "./components/ChatPanel";
import { EndTurnButton } from "./components/EndTurnButton";
import { FuseTimer } from "./components/FuseTimer";
import { Atmosphere } from "./components/Atmosphere";
import { MusicToggle } from "./components/MusicToggle";
import { FfaGame } from "./components/FfaGame";
import { Glossary } from "./components/Glossary";
import { Card, RoomState, HeroClass, ClientAction, GameEvent, OpenRoomInfo, OnlinePlayerInfo, PlayerState, FinishingBlow } from "./types";
import { HERO_POWER_COST, HERO_POWERS, HERO_POWERS_LIST } from "./constants";
import { playSound, playRaven } from "./utils/audio";
import { generateVikingName } from "./utils/names";
import { flashDamage, deathPoof, screenFlash, lungeAttack, spellCast, castProjectile, roundStartFlare, diceRoll, heroDeathExplosion, playFinisherCinematic, type SpellElement } from "./utils/combatFx";

// Element/Farbe fuer das Sieg-Kino aus dem Finisher ableiten (templateId -> Element).
function finisherElement(b: FinishingBlow): SpellElement {
  if (b.kind === "attack") return "fire"; // physischer Schlag -> brutaler roter Impact
  if (b.templateId && SPELL_ELEMENT[b.templateId]) return SPELL_ELEMENT[b.templateId];
  if (b.kind === "power") return "arcane";
  return "fire";
}

// Zauber/Heldenkraft -> Element fuer die VFX (Runenkreis + Partikel).
const SPELL_ELEMENT: Record<string, SpellElement> = {
  arc_shot: "arcane",
  heal_touch: "heal",
  fireball: "fire",
  consecration: "holy",
  meteor: "fire",
  flamestrike: "fire",
  pyroblast: "fire",
  mind_control: "shadow",
  pot_greed: "arcane",
  blizzard: "frost",
  holy_nova: "holy",
  multi_shot: "arcane",
  divine_storm: "holy",
};
const HERO_POWER_ELEMENT: Record<HeroClass, SpellElement[]> = {
  Mage: ["fire", "frost", "arcane"],
  Priest: ["heal", "holy", "arcane"],
  Hunter: ["arcane", "arcane", "fire"],
  Paladin: ["holy", "holy", "holy"],
};

export default function App() {
  // Connection states
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionId, setConnectionId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Player configurations
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem("arcanum_playerName") || generateVikingName();
  });
  const [selectedClass, setSelectedClass] = useState<HeroClass>("Mage");
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  // Game active state
  const [room, setRoom] = useState<RoomState | null>(null);
  const [openRooms, setOpenRooms] = useState<OpenRoomInfo[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayerInfo[]>([]);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);

  // Targeting UI states
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null); // from hand
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null); // from board
  const [targetingMode, setTargetingMode] = useState<"none" | "spell_target" | "attack_target" | "heropower_target" | "battlecry_target">("none");
  const [toast, setToast] = useState<{ message: string; type: "info" | "warning" | "success" } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Karten-Vorschau: Handkarte antippen -> gross lesen -> erst dann spielen.
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);

  // Sieg-Zeitlupen-Kino: solange es laeuft, ist der Sieg-Screen ausgeblendet.
  const [cinematicActive, setCinematicActive] = useState<boolean>(false);
  const prevCinePhaseRef = useRef<string | null>(null);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);

  // Alchemy Forge dynamic form states
  const [showAlchemyForge, setShowAlchemyForge] = useState(false);
  const [forgeName, setForgeName] = useState("Flammen-gezeichneter Knappe");
  const [forgeType, setForgeType] = useState<"minion" | "spell">("minion");
  const [forgeCost, setForgeCost] = useState(3);
  const [forgeAttack, setForgeAttack] = useState<string>("3");
  const [forgeHealth, setForgeHealth] = useState<string>("3");
  const [forgeEmoji, setForgeEmoji] = useState("⚔️");
  const [forgeDesc, setForgeDesc] = useState("Speichert feurige Funken der Magie.");
  const [forgeTaunt, setForgeTaunt] = useState(false);
  const [forgeCharge, setForgeCharge] = useState(false);
  const [forgeShield, setForgeShield] = useState(false);
  
  const [forgeSpellEffect, setForgeSpellEffect] = useState<"damage" | "heal" | "draw">("damage");
  const [forgeSpellValue, setForgeSpellValue] = useState<string>("3");

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [heroSelectionTimeRemaining, setHeroSelectionTimeRemaining] = useState<number>(0);
  
  const lastTickPlayed = React.useRef<number>(-1);

  // Combat-FX: letzter HP-Stand + Position pro Figur/Held, um Treffer/Tode zu erkennen.
  const prevHpRef = useRef<Map<string, { hp: number; rect: DOMRect | null }>>(new Map());
  const prevPhaseRef = useRef<string | null>(null);
  const prevTurnRef = useRef<string | null>(null);

  // Connection refs for robust auto-reconnect + auto-rejoin
  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef<boolean>(true);
  // Nach bewusstem Verlassen: Raum-Updates ignorieren, bis wir wieder absichtlich beitreten.
  // Sonst zieht ein nachzuegelnder ROOM_STATE_UPDATE (v.a. nach FFA-Sieg) zurueck in den Raum.
  const hasLeftRoomRef = useRef<boolean>(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const playerNameRef = useRef<string>(playerName);
  const connectionIdRef = useRef<string>("");

  // Determine local orientation roles
  const isP1 = room && room.player1 && (room.player1.id === connectionId || room.player1.name === playerName);
  const me = isP1 ? room?.player1 : room?.player2;
  const opponent = isP1 ? room?.player2 : room?.player1;
  const isActiveTurn = room && room.turn === me?.id;

  // Turn timers countdown effect
  useEffect(() => {
    if (!room) return;
    
    lastTickPlayed.current = -1; // reset on new turn
    
    const interval = setInterval(() => {
      if (room.phase === "playing" && room.turnEndTime) {
         const remaining = Math.max(0, Math.floor((room.turnEndTime - Date.now()) / 1000));
         setTimeRemaining(remaining);
         
         // Play warning sounds if active turn on our side.
         // 10s = deep gong, then a loud tick on each of the last 5 seconds (5,4,3,2,1).
         if (room.turn === me?.id) {
             if (remaining === 10 && lastTickPlayed.current !== 10) {
                 lastTickPlayed.current = 10;
                 playSound("countdown_warning");
             } else if (remaining <= 5 && remaining >= 1 && lastTickPlayed.current !== remaining) {
                 lastTickPlayed.current = remaining;
                 playSound("countdown_urgent");
             }
         }
      } else if (room.phase === "hero_selection" && room.heroSelectionEndTime) {
         const remaining = Math.max(0, Math.floor((room.heroSelectionEndTime - Date.now()) / 1000));
         setHeroSelectionTimeRemaining(remaining);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room?.turnEndTime, room?.phase, room?.heroSelectionEndTime, me?.id]);

  // Combat-FX: laeuft NACH dem Render (Elemente existieren + zeigen neue HP).
  // Vergleicht den letzten HP-Stand mit dem aktuellen -> Treffer-Wackeln, roter
  // Flash + Schadenszahl, Tod-Rauch, und voller Bildschirm-Flash beim eigenen Helden.
  useEffect(() => {
    if (!room) {
      prevHpRef.current.clear();
      prevPhaseRef.current = null;
      return;
    }

    const rectOf = (id: string): DOMRect | null => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect() : null;
    };

    const cur = new Map<string, { hp: number; rect: DOMRect | null }>();
    const scan = (p: PlayerState | null) => {
      if (!p) return;
      const hk = `hero-${p.id}`;
      cur.set(hk, { hp: p.health, rect: rectOf(hk) });
      for (const m of p.board) {
        const ck = `card-${m.id}`;
        cur.set(ck, { hp: m.health, rect: rectOf(ck) });
      }
    };
    scan(room.player1);
    scan(room.player2);

    const prev = prevHpRef.current;
    // Nur waehrend laufendem Kampf animieren - nicht beim Austeilen oder Neustart.
    const canAnimate = room.phase === "playing" && prevPhaseRef.current === "playing";

    if (canAnimate) {
      const myHeroKey = me ? `hero-${me.id}` : "";
      let myHeroHit = false;
      let anyHit = false;
      // Treffer (HP gesunken, Figur lebt noch)
      cur.forEach((now, key) => {
        const before = prev.get(key);
        if (!before || now.hp >= before.hp) return;
        const dmg = before.hp - now.hp;
        const isHero = key.startsWith("hero-");
        flashDamage(document.getElementById(key), dmg, { big: isHero || dmg >= 5 });
        anyHit = true;
        if (isHero && key === myHeroKey) {
          screenFlash(0.5 + dmg / 14);
          myHeroHit = true;
        }
        // Entscheidender Schlag: Held faellt auf 0 -> epische Todes-Explosion + Boom.
        // Ausnahme: beim Sieg mit Finisher uebernimmt das Zeitlupen-Kino die Explosion.
        const cinematicTakesOver = room.phase === "victory" && !!room.finisher;
        if (isHero && now.hp <= 0 && before.hp > 0 && !cinematicTakesOver) { heroDeathExplosion(document.getElementById(key)); playSound("hero_death"); }
      });
      // Tode (Figur war da, jetzt weg) -> Rauch an letzter Position
      prev.forEach((before, key) => {
        if (cur.has(key) || !key.startsWith("card-") || !before.rect) return;
        const r = before.rect;
        deathPoof(r.left + r.width / 2, r.top + r.height / 2);
      });
      // Ein Treffer-Geraeusch pro Ereignis (kein Spam bei Flaechenschaden).
      if (myHeroHit) playSound("hurt");
      else if (anyHit) playSound("hit");
    }

    prevPhaseRef.current = room.phase;
    prevHpRef.current = cur;
  }, [room, me?.id]);

  // Rundenstart: gekreuzte Schwerter, wenn der Zug wechselt (Gold = ich, Rot = Gegner).
  useEffect(() => {
    if (!room || room.phase !== "playing") {
      prevTurnRef.current = room?.turn ?? null;
      return;
    }
    const t = room.turn ?? null;
    if (t && prevTurnRef.current !== null && prevTurnRef.current !== t) {
      const mine = t === me?.id;
      roundStartFlare(mine ? "Dein Zug" : `${opponent?.name || "Gegner"} am Zug`, mine);
    }
    prevTurnRef.current = t;
  }, [room?.turn, room?.phase, me?.id, opponent?.name]);

  // Sieg-Zeitlupen-Kino: spielt den entscheidenden Schlag gross + in Slow-Mo nach.
  // Danach (oder per Button) erscheint der Sieg-Screen. Fanfare kommt nach dem Kino.
  const runFinisher = (b: FinishingBlow, outcome: "win" | "loss" | "draw") => {
    setCinematicActive(true);
    playFinisherCinematic(
      {
        actorName: b.actorName,
        victimName: b.victimName,
        kind: b.kind,
        name: b.name,
        emoji: b.emoji,
        damage: b.damage,
        cardType: b.cardType,
        attack: b.attack,
        element: finisherElement(b),
      },
      { onImpact: () => playSound("hero_death") }
    ).finally(() => {
      setCinematicActive(false);
      if (outcome === "win") playSound("victory");
      else if (outcome === "loss") playSound("loss");
    });
  };

  // Auto-Trigger beim Wechsel in den Sieg-Zustand (nur echte Transition, nicht beim Reconnect).
  useEffect(() => {
    if (!room) { prevCinePhaseRef.current = null; return; }
    const prev = prevCinePhaseRef.current;
    if (room.phase === "victory" && prev && prev !== "victory" && room.finisher) {
      const outcome: "win" | "loss" | "draw" =
        room.winnerId === "DRAW" ? "draw" : room.winnerId === me?.id ? "win" : "loss";
      runFinisher(room.finisher, outcome);
    }
    prevCinePhaseRef.current = room.phase ?? null;
  }, [room?.phase]);

  // Auto save playerName to localStorage + keep ref in sync for the long-lived socket handlers
  useEffect(() => {
    localStorage.setItem("arcanum_playerName", playerName);
    playerNameRef.current = playerName;
  }, [playerName]);

  // Live register client duelist name with server for lobby displays
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && playerName) {
      ws.send(JSON.stringify({
        type: "REGISTER_NAME",
        payload: { name: playerName }
      }));
    }
  }, [ws, isConnected, playerName]);

  // Connect to authoritative WebSocket server, with auto-reconnect + auto-rejoin.
  useEffect(() => {
    shouldReconnectRef.current = true;

    const KEY_ROOM = "marc_roomId";
    const KEY_CLASS = "marc_heroClass";

    const handleMessage = (event: MessageEvent) => {
      try {
        const gameEvent = JSON.parse(event.data) as GameEvent;
        const myName = playerNameRef.current;

        switch (gameEvent.type) {
          case "ROOM_STATE_UPDATE": {
            const updatedRoom = gameEvent.payload;
            // Bewusst verlassen -> keine Raum-Updates mehr annehmen (sonst Lobby-Haenger nach FFA-Sieg).
            if (hasLeftRoomRef.current) break;

            // Identify my player slot (by current id or by name) and keep connectionId fresh.
            // Matching by name is what makes reconnect work: after a rejoin the server hands us a new id.
            // FFA/2v2: das eigene Seat steckt in players[] (nicht player1/player2).
            const mine =
              updatedRoom.mode === "ffa" || updatedRoom.mode === "2v2"
                ? (updatedRoom.players || []).find(p => p.id === connectionIdRef.current || p.name === myName) || null
                : updatedRoom.player1 && (updatedRoom.player1.id === connectionIdRef.current || updatedRoom.player1.name === myName)
                ? updatedRoom.player1
                : updatedRoom.player2 && (updatedRoom.player2.id === connectionIdRef.current || updatedRoom.player2.name === myName)
                ? updatedRoom.player2
                : null;

            if (mine && mine.id !== connectionIdRef.current) {
              connectionIdRef.current = mine.id;
              setConnectionId(mine.id);
            }

            // Remember where we are, so a disconnect can auto-rejoin the same room + class.
            if (mine) {
              localStorage.setItem(KEY_ROOM, updatedRoom.roomId);
              localStorage.setItem(KEY_CLASS, mine.heroClass);
            }

            setRoom((prev) => {
              if (prev && prev.phase !== updatedRoom.phase && updatedRoom.phase === "victory") {
                const myId = mine?.id;
                // Mit Finisher kommt die Fanfare erst NACH dem Zeitlupen-Kino (siehe runFinisher).
                if (!updatedRoom.finisher) {
                  if (myId && updatedRoom.winnerId === myId) {
                    playSound("victory");
                  } else if (updatedRoom.winnerId !== "DRAW") {
                    playSound("loss");
                  }
                }
              }
              return updatedRoom;
            });

            clearTargeting();
            break;
          }
          case "CHAT_MESSAGE": {
            setRoom((prev) => {
              if (!prev) return null;
              const exists = prev.messages.some((m) => m.id === gameEvent.payload.id);
              if (exists) return prev;
              return { ...prev, messages: [...prev.messages, gameEvent.payload] };
            });
            break;
          }
          case "ERROR": {
            setErrorMsg(gameEvent.payload.message);
            showToast(gameEvent.payload.message, "warning");
            // If a rejoin failed because the room is gone or full, stop trying to rejoin it.
            const m = gameEvent.payload.message.toLowerCase();
            if (m.includes("not found") || m.includes("nicht gefunden") || m.includes("voll")) {
              localStorage.removeItem(KEY_ROOM);
              localStorage.removeItem(KEY_CLASS);
            }
            break;
          }
          case "LOBBY_STATE_UPDATE": {
            setOpenRooms(gameEvent.payload.rooms);
            setOnlinePlayers(gameEvent.payload.onlinePlayers);
            if (gameEvent.payload.leaderboard) {
              setLeaderboard(gameEvent.payload.leaderboard);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error processing server message:", error);
      }
    };

    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${proto}//${window.location.host}`;
      console.log(`Connecting to WebSocket card server at: ${wsUrl}`);

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        console.log("WebSocket connection established!");
        setIsConnected(true);
        setErrorMsg(null);

        // Register name for the lobby list.
        socket.send(JSON.stringify({ type: "REGISTER_NAME", payload: { name: playerNameRef.current } }));

        // Auto-rejoin a game we were in before the disconnect.
        const savedRoom = localStorage.getItem(KEY_ROOM);
        const savedClass = (localStorage.getItem(KEY_CLASS) as HeroClass) || "Mage";
        if (savedRoom) {
          console.log(`Auto-rejoining room ${savedRoom} as ${savedClass}`);
          socket.send(JSON.stringify({
            type: "JOIN_ROOM",
            payload: { roomId: savedRoom, playerName: playerNameRef.current, heroClass: savedClass },
          }));
        }
      };

      socket.onmessage = handleMessage;

      socket.onclose = () => {
        console.warn("WebSocket disconnected. Will attempt to reconnect...");
        setIsConnected(false);
        if (shouldReconnectRef.current) {
          if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
        socket.close(); // triggers onclose -> reconnect
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const sendAction = (action: ClientAction) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Play local tactile sound effects on action dispatch
      if (action.type === "PLAY_CARD") {
        playSound("play_card");
      } else if (action.type === "ATTACK") {
        playSound("attack");
      } else if (action.type === "USE_HERO_POWER") {
        playSound("spell");
      } else if (action.type === "SELECT_HERO_POWER" || action.type === "CREATE_CUSTOM_CARD") {
        playSound("heal");
      }
      socket.send(JSON.stringify(action));
    } else {
      showToast("Verbindung zum Server verloren. Verbinde neu...", "warning");
    }
  };

  // Targeting & Actions flow helpers
  const clearTargeting = () => {
    setSelectedCardId(null);
    setSelectedAttackerId(null);
    setTargetingMode("none");
  };

  // Bildschirm-Mittelpunkt eines Karten-/Helden-DOM-Knotens (fuer Zauber-VFX).
  const centerOf = (domId: string): { x: number; y: number } | null => {
    const el = document.getElementById(domId);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const spellElementOf = (card: Card): SpellElement => {
    if (SPELL_ELEMENT[card.templateId]) return SPELL_ELEMENT[card.templateId];
    if (card.spellEffect === "heal") return "heal";
    if (card.spellEffect === "draw") return "arcane";
    return "fire"; // geschmiedeter Schadenszauber
  };

  const showToast = (message: string, type: "info" | "warning" | "success" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Copy room link
  const copyRoomCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomId);
    setCopiedCode(true);
    showToast(`Code ${room.roomId} kopiert! Schick ihn deinem Bruder!`, "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1. Core Lobby Buttons
  const handleCreateRoom = (vsAI: boolean = false, mode: "duel" | "ffa" | "2v2" = "duel", maxPlayers?: number) => {
    setErrorMsg(null);
    hasLeftRoomRef.current = false; // absichtlich Raum betreten -> Updates wieder annehmen
    sendAction({
      type: "CREATE_ROOM",
      payload: mode === "ffa"
        ? { playerName, heroClass: selectedClass, mode: "ffa", maxPlayers }
        : mode === "2v2"
        ? { playerName, heroClass: selectedClass, mode: "2v2", maxPlayers: 4 }
        : { playerName, heroClass: selectedClass, playAgainstAI: vsAI },
    });
  };

  const handleJoinRoom = () => {
    setErrorMsg(null);
    hasLeftRoomRef.current = false;
    const cleanRid = roomIdInput.trim().toUpperCase();
    if (!cleanRid) {
      setErrorMsg("Gib einen gültigen 6-stelligen Raum-Code ein!");
      return;
    }
    
    let activeClass = selectedClass;
    const existingRoom = openRooms.find(r => r.roomId === cleanRid);
    if (existingRoom) {
      const normName = playerName.trim().toLowerCase();
      if (existingRoom.p1Name?.trim().toLowerCase() === normName && existingRoom.p1Class) {
        activeClass = existingRoom.p1Class;
        setSelectedClass(existingRoom.p1Class);
      } else if (existingRoom.p2Name?.trim().toLowerCase() === normName && existingRoom.p2Class) {
        activeClass = existingRoom.p2Class;
        setSelectedClass(existingRoom.p2Class);
      }
    }

    sendAction({
      type: "JOIN_ROOM",
      payload: { roomId: cleanRid, playerName, heroClass: activeClass },
    });
  };

  const handleQuickJoinRoom = (rid: string) => {
    setErrorMsg(null);
    hasLeftRoomRef.current = false;
    const cleanRid = rid.trim().toUpperCase();
    setRoomIdInput(cleanRid);

    let activeClass = selectedClass;
    const existingRoom = openRooms.find(r => r.roomId === cleanRid);
    if (existingRoom) {
      const normName = playerName.trim().toLowerCase();
      if (existingRoom.p1Name?.trim().toLowerCase() === normName && existingRoom.p1Class) {
        activeClass = existingRoom.p1Class;
        setSelectedClass(existingRoom.p1Class);
      } else if (existingRoom.p2Name?.trim().toLowerCase() === normName && existingRoom.p2Class) {
        activeClass = existingRoom.p2Class;
        setSelectedClass(existingRoom.p2Class);
      }
    }

    sendAction({
      type: "JOIN_ROOM",
      payload: { roomId: cleanRid, playerName, heroClass: activeClass },
    });
  };

  const handleDeleteRoom = (rid: string) => {
    sendAction({
      type: "DELETE_ROOM",
      payload: { roomId: rid },
    });
  };

  const handleStartGame = () => {
    if (!room) return;
    sendAction({
      type: "START_GAME",
      payload: { roomId: room.roomId },
    });
  };

  const handleAddBot = () => {
    if (!room) return;
    sendAction({
      type: "ADD_BOT",
      payload: { roomId: room.roomId },
    });
  };

  const handleLeaveRoom = () => {
    if (!room) return;
    sendAction({
      type: "LEAVE_ROOM",
      payload: { roomId: room.roomId },
    });
    // Deliberate leave: forget the room so auto-rejoin doesn't drag us back in.
    localStorage.removeItem("marc_roomId");
    localStorage.removeItem("marc_heroClass");
    connectionIdRef.current = "";
    hasLeftRoomRef.current = true; // nachzuegelnde Raum-Updates ignorieren
    setRoom(null);
    clearTargeting();
  };

  const handleRestartGame = () => {
    if (!room) return;
    sendAction({
      type: "RESTART_GAME",
      payload: { roomId: room.roomId },
    });
  };

  // Goetter-Wuerfel: gebalancte Zufallskarte, steigende Mana-Kosten, mehrfach pro Spiel.
  const handleRollDice = () => {
    if (!room || !me || !isActiveTurn) return;
    const cost = (me.forgeDiceCount ?? 0) + 1;
    if (me.mana < cost) {
      showToast(`Der Götter-Würfel kostet ${cost} Mana.`, "warning");
      return;
    }
    if (me.hand.length >= 10) {
      showToast("Deine Hand ist voll!", "warning");
      return;
    }
    setShowAlchemyForge(false); // schliessen, damit die Wuerfel-Animation auf dem Brett sichtbar ist
    diceRoll();
    playSound("spell");
    sendAction({ type: "ROLL_FORGE_DICE", payload: { roomId: room.roomId } });
  };

  // 2. Play Actions
  // Wird aus der Karten-Vorschau heraus aufgerufen ("Spielen"-Knopf). Spielt jetzt.
  const playCardNow = (card: Card) => {
    if (!room || room.phase !== "playing" || !isActiveTurn || !me) return;

    // Validate mana
    if (me.mana < card.cost) {
      showToast(`Zu wenig Mana! Diese Karte kostet ${card.cost} Mana.`, "warning");
      return;
    }

    setPreviewCardId(null); // Vorschau schliessen, damit Ziel/Board sichtbar ist

    if (card.type === "minion") {
      // Minions are played directly on battlefield instantly
      if (me.board.length >= 7) {
        showToast("Dein Brett ist voll (max 7 Diener)!", "warning");
        return;
      }
      if (card.battlecryNeedsTarget) {
        // z.B. Marc's Breath: erst einen Helden waehlen, dann ausspielen.
        setSelectedCardId(card.id);
        setSelectedAttackerId(null);
        setTargetingMode("battlecry_target");
        showToast(`${card.name}: Wähle einen Helden (deinen oder den Gegner)!`, "info");
        return;
      }
      sendAction({
        type: "PLAY_CARD",
        payload: { roomId: room.roomId, cardId: card.id },
      });
    } else {
      // Spell cards - diese brauchen ein Ziel (inkl. meteor + mind_control, vorher vergessen!)
      const targetSpells = ["arc_shot", "heal_touch", "fireball", "pyroblast", "meteor", "mind_control"];
      if (targetSpells.includes(card.templateId)) {
        // Toggle/Establish targeting mode for spell
        setSelectedCardId(card.id);
        setSelectedAttackerId(null);
        setTargetingMode("spell_target");
        if (card.templateId === "mind_control") {
          showToast(`${card.name}: Wähle einen GEGNERISCHEN Diener zum Übernehmen!`, "info");
        } else {
          showToast(`${card.name} wird gewirkt! Wähle einen aktiven Diener oder einen der beiden Helden als Ziel!`, "info");
        }
      } else {
        // Spells like Consecration, Flamestrike (AOE, no targets) -> Zauber-Flare sofort
        const el = spellElementOf(card);
        const friendly = el === "heal" || card.templateId === "pot_greed" || card.spellEffect === "draw";
        const c = friendly
          ? centerOf(`hero-${me.id}`)
          : centerOf(opponent ? `hero-${opponent.id}` : `hero-${me.id}`);
        if (c) spellCast(c.x, c.y, el);
        sendAction({
          type: "PLAY_CARD",
          payload: { roomId: room.roomId, cardId: card.id },
        });
      }
    }
  };

  const handleFriendlyMinionClick = (card: Card) => {
    if (!room || room.phase !== "playing" || !isActiveTurn) return;

    if (!card.isReady) {
      showToast(`${card.name} ist erschöpft! Er kann in der Runde, in der er beschworen wird, nicht angreifen.`, "warning");
      return;
    }

    // Toggle/Establish attacker
    setSelectedAttackerId(card.id);
    setSelectedCardId(null);
    setTargetingMode("attack_target");
    showToast(`⚔️ Angriffsmodus: Wähle einen gegnerischen Diener zum Kämpfen, oder klick auf den gegnerischen Helden!`, "info");
  };

  const handleHeroPowerClick = () => {
    if (!room || room.phase !== "playing" || !isActiveTurn || !me) return;

    if (me.heroPowerUsed) {
      showToast("Du hast deine Heldenkraft in dieser Runde schon genutzt!", "warning");
      return;
    }

    if (me.mana < HERO_POWER_COST) {
      showToast(`Die Heldenkraft kostet ${HERO_POWER_COST} Mana!`, "warning");
      return;
    }

    const hClass = me.heroClass;
    const powerIdx = me.selectedHeroPowerIndex ?? 0;
    let requiresTarget = false;
    if (hClass === "Mage") {
      requiresTarget = powerIdx === 0 || powerIdx === 1;
    } else if (hClass === "Priest") {
      requiresTarget = true;
    } else if (hClass === "Hunter") {
      requiresTarget = false;
    } else if (hClass === "Paladin") {
      requiresTarget = powerIdx === 1 || powerIdx === 2;
    }

    if (!requiresTarget) {
      const el = (HERO_POWER_ELEMENT[hClass] || ["arcane"])[powerIdx] ?? "arcane";
      // Hunter Steady Shot (idx 0) schiesst einen Pfeil auf den Gegner-Helden.
      if (hClass === "Hunter" && powerIdx === 0 && opponent) {
        castProjectile(
          document.getElementById(`hero-${me.id}`),
          document.getElementById(`hero-${opponent.id}`),
          el,
          true
        );
      } else {
        // Sonst: Zauber-Flare am eigenen Helden (Summons/Zufallseffekte).
        const c = centerOf(`hero-${me.id}`);
        if (c) spellCast(c.x, c.y, el);
      }
      sendAction({
        type: "USE_HERO_POWER",
        payload: { roomId: room.roomId },
      });
    } else {
      // Target based spellcasts
      setSelectedCardId(null);
      setSelectedAttackerId(null);
      setTargetingMode("heropower_target");
      if (hClass === "Paladin" && powerIdx === 1) {
        showToast(`Wähle einen BEFREUNDETEN Diener, dem du Gottesschild verleihst! ✨`, "info");
      } else {
        showToast(`Wähle eine Diener-Karte oder ein Helden-Portrait zum Verbrennen/Heilen!`, "info");
      }
    }
  };

  // 3. Targeting Clicks Handler!
  const handleTargetSelection = (targetId: string, isTargetHero: boolean) => {
    if (!room || !me) return;

    if (targetingMode === "spell_target" && selectedCardId) {
      const sc = me.hand.find((c) => c.id === selectedCardId);
      // Mind Control kann NUR einen gegnerischen Diener uebernehmen (kein Held, kein eigener Diener).
      if (sc?.templateId === "mind_control") {
        const validEnemyMinion = !isTargetHero && !!opponent?.board.some((m) => m.id === targetId);
        if (!validEnemyMinion) {
          showToast("Mind Control: nur ein gegnerischer Diener!", "warning");
          return;
        }
      }
      if (sc) {
        castProjectile(
          document.getElementById(`hero-${me.id}`),
          document.getElementById(isTargetHero ? `hero-${targetId}` : `card-${targetId}`),
          spellElementOf(sc),
          sc.templateId === "arc_shot"
        );
      }
      sendAction({
        type: "PLAY_CARD",
        payload: {
          roomId: room.roomId,
          cardId: selectedCardId,
          targetId: isTargetHero ? undefined : targetId,
          isTargetHero,
        },
      });
      clearTargeting();
    } else if (targetingMode === "attack_target" && selectedAttackerId) {
      // Validate Taunt rule on client side before hitting server
      const oppositionBoardHasTaunt = opponent?.board.some((m) => m.hasTaunt);
      if (oppositionBoardHasTaunt) {
        if (isTargetHero) {
          showToast("Ein Diener mit Spott beschützt den gegnerischen Helden!", "warning");
          return;
        }
        // Is target a taunt?
        const targetedMinion = opponent?.board.find((m) => m.id === targetId);
        if (!targetedMinion?.hasTaunt) {
          showToast("Du MUSST zuerst einen gegnerischen Diener mit Spott angreifen!", "warning");
          return;
        }
      }

      // Sofortiges, taktiles Feedback: die angreifende Figur stoesst zum Ziel.
      // Der Treffer (Wackeln/Schaden) folgt ueber den Zustands-Diff, sobald der
      // Server den Angriff bestaetigt.
      lungeAttack(
        document.getElementById(`card-${selectedAttackerId}`),
        document.getElementById(isTargetHero ? `hero-${targetId}` : `card-${targetId}`)
      );

      sendAction({
        type: "ATTACK",
        payload: {
          roomId: room.roomId,
          attackerCardId: selectedAttackerId,
          targetCardId: isTargetHero ? undefined : targetId,
          isTargetHero,
        },
      });
      clearTargeting();
    } else if (targetingMode === "heropower_target") {
      const idx = me.selectedHeroPowerIndex ?? 0;
      const el = (HERO_POWER_ELEMENT[me.heroClass] || ["arcane"])[idx] ?? "arcane";
      castProjectile(
        document.getElementById(`hero-${me.id}`),
        document.getElementById(isTargetHero ? `hero-${targetId}` : `card-${targetId}`),
        el,
        me.heroClass === "Hunter"
      );
      sendAction({
        type: "USE_HERO_POWER",
        payload: {
          roomId: room.roomId,
          targetId: isTargetHero ? undefined : targetId,
          isTargetHero,
        },
      });
      clearTargeting();
    } else if (targetingMode === "battlecry_target" && selectedCardId) {
      // Diener-Battlecry mit Ziel (z.B. Marc's Breath): nur Helden erlaubt.
      if (!isTargetHero) {
        showToast("Für diesen Effekt musst du einen Helden wählen!", "warning");
        return;
      }
      const c = centerOf(`hero-${targetId}`);
      if (c) spellCast(c.x, c.y, "holy");
      sendAction({
        type: "PLAY_CARD",
        payload: { roomId: room.roomId, cardId: selectedCardId, targetId, isTargetHero: true },
      });
      clearTargeting();
    }
  };

  const handleEndTurn = () => {
    if (!room || room.phase !== "playing" || !isActiveTurn) return;
    sendAction({
      type: "END_TURN",
      payload: { roomId: room.roomId },
    });
  };

  const handleSendChat = (text: string) => {
    if (!room) return;
    sendAction({
      type: "SEND_CHAT",
      payload: { roomId: room.roomId, text },
    });
  };

  const handleForgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !me) return;

    if (!forgeName.trim()) {
      showToast("Gib deiner Kreation einen Namen!", "warning");
      return;
    }

    if (me.hand.length >= 10) {
      showToast("Deine Hand ist voll! Spiele zuerst Karten aus.", "warning");
      return;
    }

    if (forgeType === "minion") {
      const atkVal = Number(forgeAttack);
      const hpVal = Number(forgeHealth);
      if (isNaN(atkVal) || atkVal < 1 || atkVal > 10) {
        showToast("Die Angriffskraft deiner Kreatur muss eine Zahl von 1 bis 10 sein!", "warning");
        return;
      }
      if (isNaN(hpVal) || hpVal < 1 || hpVal > 10) {
        showToast("Die Lebenspunkte deiner Kreatur müssen eine Zahl von 1 bis 10 sein!", "warning");
        return;
      }
    } else {
      const spVal = Number(forgeSpellValue);
      if (isNaN(spVal) || spVal < 1 || spVal > 10) {
        showToast("Der Zaubereffekt-Wert muss eine Zahl von 1 bis 10 sein!", "warning");
        return;
      }
    }

    let calculatedCost = 0;
    if (forgeType === "minion") {
      const atk = Number(forgeAttack);
      const hp = Number(forgeHealth);
      let baseStatCost = Math.ceil((atk + hp) / 2);
      let abilityCount = (forgeTaunt ? 1 : 0) + (forgeCharge ? 1 : 0) + (forgeShield ? 1 : 0);
      let abilityCost = (forgeTaunt ? 1 : 0) + (forgeCharge ? 2 : 0) + (forgeShield ? 1 : 0);
      
      // Scaling penalty: more abilities make them multiply costs
      let scalingPenalty = abilityCount > 1 ? abilityCount * 2 : 0;
      if (atk >= 5 && abilityCount >= 2) scalingPenalty += 4; // Too much attack and abilities

      calculatedCost = Math.max(1, baseStatCost + abilityCost + scalingPenalty - 1);
    } else {
      const spVal = Number(forgeSpellValue) || 1;
      if (forgeSpellEffect === "damage") calculatedCost = Math.ceil(spVal);
      if (forgeSpellEffect === "heal") calculatedCost = Math.ceil(spVal / 2);
      if (forgeSpellEffect === "draw") calculatedCost = Math.ceil(spVal * 2.5);
    }

    if (calculatedCost > 10) {
      showToast("Deine Karte ist zu mächtig! (Maximal 10 Mana erlaubt). Reduziere die Werte.", "warning");
      return;
    }

    // Submit custom creation to authoritative backend!
    sendAction({
      type: "CREATE_CUSTOM_CARD",
      payload: {
        roomId: room.roomId,
        name: forgeName.trim(),
        type: forgeType,
        cost: calculatedCost,
        attack: Number(forgeAttack),
        health: Number(forgeHealth),
        emoji: forgeEmoji,
        description: forgeDesc.trim() || (forgeType === "spell" ? `Zauber: ${forgeSpellEffect} für ${forgeSpellValue}` : "Ein mysteriöses, alchemistisches Artefakt."),
        hasTaunt: forgeTaunt,
        hasCharge: forgeCharge,
        hasDivineShield: forgeShield,
        spellEffect: forgeType === "spell" ? forgeSpellEffect : undefined,
        spellValue: forgeType === "spell" ? Number(forgeSpellValue) : undefined,
      }
    });

    showToast(`🪄 ${forgeName} wurde in deine Hand beschworen!`, "success");
    setShowAlchemyForge(false);
  };

  const handleCancelTargeting = (e: React.MouseEvent) => {
    // Only cancel if clicking empty background board
    if (targetingMode !== "none") {
      clearTargeting();
      showToast("Zielwahl abgebrochen.", "info");
    }
  };

  const renderSubclassSelection = () => {
    if (!room || !me) return null;
    const classPowers = HERO_POWERS_LIST[me.heroClass] || [];

    return (
      <div className="absolute inset-0 bg-mg-void/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40 rounded-3xl border-2 border-mg-bronze/30">
        
        {/* Large Countdown Timer */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-fade-in">
          <span className="text-[10px] text-mg-bronze/80 font-mono tracking-widest uppercase mb-1">Verbleibende Zeit</span>
          <span className={`text-6xl font-black font-mono tracking-tighter ${heroSelectionTimeRemaining <= 3 ? 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-mg-bronze-bright drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'}`}>
            {heroSelectionTimeRemaining}s
          </span>
        </div>

        <div className="text-center max-w-xl mx-auto mb-8 mt-16">
          <span className="text-[10px] uppercase tracking-widest text-mg-bronze font-mono font-bold px-2 py-0.5 bg-mg-bronze/10 rounded-full border border-mg-bronze/20">💎 Legendäre Spezialisierung 💎</span>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-white mt-3 mb-2 tracking-wide uppercase">
            Wähle deine Heldenkraft
          </h2>
          <p className="text-xs text-mg-fog font-sans leading-relaxed">
            Dein Deck ist kampfbereit! Entscheide dich für eine von drei Heldenkräften, die du den Rest dieses Marcgard-Duells befehligst.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {classPowers.map((power, idx) => (
            <button
              key={idx}
              onClick={() => {
                sendAction({
                  type: "SELECT_HERO_POWER",
                  payload: { roomId: room.roomId, powerIndex: idx }
                });
              }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-mg-slate border border-mg-stone hover:border-mg-bronze-bright hover:bg-mg-slate/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-mg-bronze/10 border border-mg-bronze/20 text-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {power.emoji}
              </div>
              <h3 className="font-serif font-bold text-white text-md tracking-tight group-hover:text-mg-bronze-bright transition-colors">
                {power.name}
              </h3>
              <p className="text-[10px] text-mg-fog mt-2 font-sans leading-normal antialiased">
                {power.description}
              </p>
              <span className="text-[9px] uppercase tracking-wide font-mono text-mg-bronze font-extrabold mt-4 px-2 py-1 bg-mg-bronze/10 border border-mg-bronze/20 rounded-xl group-hover:bg-mg-bronze group-hover:text-mg-void transition-colors">
                Kraft freischalten
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Lobby UI View
  if (!room) {
    return (
      <div className="min-h-screen text-mg-frost-text font-body selection:bg-mg-bronze selection:text-mg-void">
        <Atmosphere onRaven={playRaven} />
        <MusicToggle />
        {/* Banner */}
        <div className="bg-gradient-to-r from-mg-bronze to-mg-bronze py-1.5 px-4 text-center text-xs font-mono font-bold text-mg-void flex items-center justify-center gap-1.5 shadow-md">
          <span>{isConnected ? "🟢 Server läuft & ist aktiv" : "🟡 Verbinde neu mit dem Server..."}</span>
          <span className="opacity-80">| Bereit fürs sofortige Spiel auf Handy und PC!</span>
        </div>

        <Lobby
          playerName={playerName}
          setPlayerName={setPlayerName}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          roomIdInput={roomIdInput}
          setRoomIdInput={setRoomIdInput}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          errorMsg={errorMsg}
          openRooms={openRooms}
          onlinePlayers={onlinePlayers}
          leaderboard={leaderboard}
          onQuickJoin={handleQuickJoinRoom}
          onDeleteRoom={handleDeleteRoom}
        />
      </div>
    );
  }

  // FFA + 2v2: komplett eigener Render-Pfad (FfaGame), lässt die Duell-UI unangetastet.
  if (room.mode === "ffa" || room.mode === "2v2") {
    return (
      <FfaGame
        room={room}
        connectionId={connectionId}
        myName={playerName}
        sendAction={sendAction}
        onLeave={handleLeaveRoom}
        showToast={showToast}
        timeRemaining={timeRemaining}
        heroSelectionTimeRemaining={heroSelectionTimeRemaining}
      />
    );
  }

  // Pre-match game room Lobby View
  if (room.phase === "lobby") {
    return (
      <div className="min-h-screen text-mg-frost-text flex flex-col justify-between py-6 px-4">
        <Atmosphere onRaven={playRaven} />
        <MusicToggle />
        {showGlossary && <Glossary onClose={() => setShowGlossary(false)} />}
        <button type="button" onClick={() => setShowGlossary(true)} className="fixed top-3 right-3 z-40 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-mg-bronze/50 bg-mg-void/70 text-mg-bronze-bright hover:border-mg-bronze cursor-pointer" title="Spielregeln & Begriffe">📖 Glossar</button>
        {/* Header bar */}
        <div className="max-w-4xl mx-auto w-full bg-mg-slate/60 rounded-3xl border border-mg-stone p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 text-center md:text-left">
            <span className="text-[10px] font-mono tracking-widest text-mg-bronze uppercase font-bold">Marcgard Duell-Halle</span>
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider">Vorraum</h2>
          </div>

          {/* Code Board */}
          <div className="flex items-center gap-3 bg-mg-void border border-mg-stone px-4 py-3 rounded-2xl">
            <span className="text-xs font-mono text-mg-fog uppercase">Raum-ID:</span>
            <span className="text-lg font-mono font-bold text-mg-bronze select-all tracking-widest">{room.roomId}</span>
            <button
              onClick={copyRoomCode}
              type="button"
              className="px-3 py-1 bg-mg-bronze/10 text-mg-bronze-bright hover:bg-mg-bronze hover:text-mg-void rounded-xl text-xs font-mono transition-all font-bold cursor-pointer"
            >
              {copiedCode ? "Kopiert!" : "Link teilen"}
            </button>
          </div>
        </div>

        {/* Both Duelists profiles cards */}
        <div className="max-w-4xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player 1 Card */}
          <div className="relative p-6 rounded-3xl border border-mg-stone bg-mg-slate/30 flex flex-col items-center justify-between h-56 shadow-lg overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-mg-bronze" />
            <span className="text-[10px] font-mono font-bold text-mg-fog uppercase tracking-widest mb-2">Gastgeber (1)</span>
            {room.player1 ? (
              <div className="text-center space-y-2">
                <span className="text-5xl">
                  {room.player1.heroClass === "Mage" ? "🧙‍♀️" : room.player1.heroClass === "Priest" ? "🩹" : room.player1.heroClass === "Hunter" ? "🏹" : "🫡"}
                </span>
                <h3 className="text-xl font-black text-white">{room.player1.name}</h3>
                <span className="inline-block px-3 py-1 rounded bg-mg-stone text-xs font-mono font-bold text-mg-bronze-bright">
                  {room.player1.heroClass}
                </span>
              </div>
            ) : (
              <div className="text-mg-fog text-xs italic">Leerer Platz. Warte auf den Gastgeber...</div>
            )}
            <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bereit
            </div>
          </div>

          {/* Player 2 Card */}
          <div className="relative p-6 rounded-3xl border border-mg-stone bg-mg-slate/30 flex flex-col items-center justify-between h-56 shadow-lg overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
            <span className="text-[10px] font-mono font-bold text-mg-fog uppercase tracking-widest mb-2">Herausforderer (2)</span>
            {room.player2 ? (
              <div className="text-center space-y-2">
                <span className="text-5xl">
                  {room.player2.heroClass === "Mage" ? "🧙‍♀️" : room.player2.heroClass === "Priest" ? "🩹" : room.player2.heroClass === "Hunter" ? "🏹" : "🫡"}
                </span>
                <h3 className="text-xl font-black text-white">{room.player2.name}</h3>
                <span className="inline-block px-3 py-1 rounded bg-mg-stone text-xs font-mono font-bold text-indigo-400">
                  {room.player2.heroClass}
                </span>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-mg-fog text-xs italic">Warte auf den Herausforderer...</div>
                <div className="text-[9px] font-mono text-mg-fog py-1 px-3 bg-mg-void rounded-full border border-mg-slate">
                  Code: {room.roomId}
                </div>
              </div>
            )}
            {room.player2 ? (
              <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verbunden
              </div>
            ) : (
              <div className="text-[10px] text-rose-500 font-mono mt-2 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Wartet...
              </div>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-4">
          {room.player1 && room.player2 ? (
            <button
              onClick={handleStartGame}
              type="button"
              className="px-10 py-4 bg-gradient-to-r from-mg-bronze to-mg-bronze hover:from-mg-bronze-bright hover:to-mg-bronze-bright text-mg-void scale-102 hover:scale-105 font-bold font-sans text-sm uppercase tracking-widest rounded-2xl shadow-lg cursor-pointer transition-all"
            >
              🚀 Duell starten!
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs text-mg-fog max-w-sm text-center leading-relaxed font-body">
                Schick den Code an Marc (Handy oder PC). Sobald er beitritt, kannst du das Duell starten.
              </div>
              <div className="flex items-center gap-3 text-[10px] text-mg-stone-light uppercase tracking-widest font-display">
                <span className="h-px w-10 bg-mg-stone" /> oder <span className="h-px w-10 bg-mg-stone" />
              </div>
              <button
                onClick={handleAddBot}
                type="button"
                className="px-7 py-3 font-display font-bold text-xs uppercase tracking-[0.12em] rounded-xl cursor-pointer bg-mg-slate-raised text-mg-frost-text border border-mg-stone hover:border-mg-bronze hover:text-mg-bronze-bright transition-all"
              >
                🛡️ Übungsgegner hinzufügen
              </button>
              <span className="text-[10px] text-mg-fog/70 font-body italic">Zum Testen allein - ein lokaler Bot, kostenlos.</span>
            </div>
          )}

          <button
            onClick={handleLeaveRoom}
            type="button"
            className="text-xs text-mg-fog hover:text-white transition-colors cursor-pointer border-b border-dashed border-mg-stone hover:border-mg-fog pt-1 mt-2"
          >
            Lobby verlassen & zurück zum Haupteingang
          </button>
        </div>

        {/* Live Lobby chat and logging box so brothers can chat before game starts! */}
        <div className="max-w-4xl mx-auto w-full mt-8 bg-mg-slate/30 rounded-3xl border border-mg-stone/80 p-4">
          <ChatPanel room={room} connectionId={connectionId} onSendMessage={handleSendChat} />
        </div>
      </div>
    );
  }

  // Active game play view or Match victory summary screen
  const isWinnerMe = room.phase === "victory" && room.winnerId === connectionId;
  const isWinnerOpponent = room.phase === "victory" && room.winnerId === opponent?.id;
  const isDraw = room.phase === "victory" && room.winnerId === "DRAW";

  // Blutregen, sobald ein Held auf 10 HP oder weniger faellt.
  const bloodRain =
    room.phase === "playing" &&
    (((room.player1?.health ?? 99) <= 10) || ((room.player2?.health ?? 99) <= 10));

  // Live-Karte fuer die Vorschau (verschwindet automatisch, sobald sie die Hand verlaesst).
  const previewCard = me?.hand.find((c) => c.id === previewCardId) || null;
  const previewKeywords: string[] = [];
  if (previewCard) {
    if (previewCard.hasTaunt) previewKeywords.push("🛡️ Spott: Gegner müssen zuerst diesen Diener angreifen.");
    if (previewCard.hasCharge) previewKeywords.push("⚡ Ansturm: Kann sofort im selben Zug angreifen.");
    if (previewCard.hasDivineShield) previewKeywords.push("✨ Gottesschild: Ignoriert die erste Schadensquelle komplett.");
    const d = previewCard.description.toLowerCase();
    if (d.includes("battlecry") || previewCard.description.includes("🔥") || previewCard.description.includes("💣") || previewCard.description.includes("❤️"))
      previewKeywords.push("💥 Kampfschrei: Löst direkt beim Ausspielen einen Einmaleffekt aus.");
    if (previewCard.type === "spell") previewKeywords.push("🔮 Zauber: Einmaliger Effekt, danach verbraucht.");
  }
  const previewAffordable = !!me && previewCard ? me.mana >= previewCard.cost : false;
  const previewBoardFull = !!me && previewCard?.type === "minion" ? me.board.length >= 7 : false;
  const previewCanPlay = !!isActiveTurn && previewAffordable && !previewBoardFull;

  return (
    <div
      onClick={handleCancelTargeting}
      className={`min-h-screen text-mg-frost-text flex flex-col justify-between py-4 px-2 select-none relative overflow-x-hidden ${
        targetingMode !== "none" ? "cursor-crosshair" : ""
      }`}
    >
      <Atmosphere onRaven={playRaven} bloodRain={bloodRain} />
      {showGlossary && <Glossary onClose={() => setShowGlossary(false)} />}
      <button type="button" onClick={(e) => { e.stopPropagation(); setShowGlossary(true); }} className="fixed top-3 right-3 z-40 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-mg-bronze/50 bg-mg-void/70 text-mg-bronze-bright hover:border-mg-bronze cursor-pointer" title="Spielregeln & Begriffe">📖 Glossar</button>
      {/* 1. Global Game HUD Status Bar */}
      <header className="max-w-7xl mx-auto w-full bg-mg-slate/90 border border-mg-stone rounded-2xl p-3 shadow-lg flex flex-wrap gap-4 items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-black text-mg-bronze uppercase tracking-widest font-sans">
            Marcgard Arena
          </h1>
          <span className="text-[10px] bg-mg-stone/80 border border-mg-stone-light font-mono text-mg-fog px-2 py-0.5 rounded-full">
            Code: {room.roomId}
          </span>
        </div>

        {/* Active turn state overlay banner */}
        <div className="text-xs font-mono font-bold">
          {room.phase === "playing" ? (
            isActiveTurn ? (
              <span className="text-emerald-400 animate-pulse bg-emerald-950/30 border border-emerald-500/20 px-3 py-1 rounded-xl">
                🛡️ Du bist am Zug!
              </span>
            ) : (
              <span className="text-mg-fog bg-mg-void/60 px-3 py-1 rounded-xl">
                ⏳ Warte auf {opponent?.name || "Gegner"}...
              </span>
            )
          ) : (
            <span className="text-mg-bronze-bright uppercase tracking-wider font-sans font-black">
              ⚔️ Chronik nach dem Kampf
            </span>
          )}
        </div>

        {/* Exit match buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleLeaveRoom}
            type="button"
            className="text-mg-fog hover:text-rose-400 text-xs px-3 py-1 rounded-xl bg-mg-void border border-mg-stone hover:border-rose-900 transition-all font-sans"
          >
            Kampf verlassen
          </button>
        </div>
      </header>

      {/* Burning-fuse turn timer */}
      {room.phase === "playing" && (
        <div className="max-w-7xl mx-auto w-full mt-2 px-1 z-20 relative">
          <FuseTimer remaining={timeRemaining} total={45} active={!!isActiveTurn} />
        </div>
      )}

      {/* Target choice toast prompt - pointer-events-none, damit es NIE Taps aufs Brett/den Helden blockiert */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 max-w-sm w-full mx-auto px-4 z-50 pointer-events-none">
          <div className={`p-3 rounded-2xl border flex items-center gap-2 text-xs font-sans shadow-xl text-center justify-center animate-bounce ${
            toast.type === "warning"
              ? "bg-red-950 border-red-500 text-red-100"
              : toast.type === "success"
                ? "bg-emerald-950 border-emerald-500 text-emerald-100"
                : "bg-blue-950 border-blue-500 text-blue-100"
          }`}>
            <span>{toast.type === "warning" ? "⚠️" : toast.type === "success" ? "🌟" : "🎯"}</span>
            <span className="font-bold leading-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Game board content */}
      <main className="flex-1 w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-4 mt-2 lg:mt-4 relative px-1 lg:px-4">
        
        {/* Interactive duel arena dashboard (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col justify-between min-h-0 bg-mg-void rounded-2xl md:rounded-3xl border border-mg-stone p-1 md:p-3 shadow-inner relative gap-2 md:gap-4">
          
          {/* Chosen Specialization Modal Overlay Trigger */}
          {room && room.phase === "hero_selection" && me && typeof me.selectedHeroPowerIndex !== "number" && renderSubclassSelection()}

          {/* A. ENEMY OVERHERO AREA */}
          <div className="flex justify-between items-center bg-mg-slate/10 p-1 md:p-2 rounded-xl md:rounded-2xl border border-transparent">
            {opponent ? (
              <HeroState
                player={opponent}
                isActiveTurn={room.turn === opponent.id}
                isEnemy={true}
                canBeTargeted={targetingMode !== "none"}
                onHeroClick={() => handleTargetSelection(opponent.id, true)}
              />
            ) : (
              <div className="text-[10px] md:text-xs text-mg-fog italic">Noch kein Gegner beigetreten.</div>
            )}

            {/* Opponent Card count & deck summary */}
            {opponent && (
              <div className="flex gap-1 md:gap-2 items-center bg-mg-slate/40 p-1 md:p-2 rounded-lg md:rounded-xl border border-mg-stone text-right font-mono">
                <div className="flex flex-col text-[8px] md:text-[10px] text-mg-fog leading-tight">
                  <span>Hand: {opponent.hand.length}/10</span>
                  <span>Deck: {opponent.deck.length}</span>
                  <span className="flex items-center justify-end gap-1 font-bold">
                    <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${opponent.isOnline !== false ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className={opponent.isOnline !== false ? "text-emerald-400" : "text-red-400"}>
                      {opponent.isOnline !== false ? "Online" : "Getrennt"}
                    </span>
                  </span>
                </div>
                {/* Visual Card backs representing opponent's hand - am Handy ausgeblendet (nur Zahlen) */}
                <div className="hidden sm:flex gap-0.5 md:gap-1">
                  {Array.from({ length: Math.min(6, opponent.hand.length) }).map((_, i) => (
                    <div key={i} className="w-3 h-4 md:w-5 md:h-7 rounded-sm md:rounded border border-indigo-900 bg-indigo-950 shadow shadow-indigo-500/10" />
                  ))}
                  {opponent.hand.length > 6 && (
                    <span className="text-[8px] md:text-[10px] font-mono text-mg-fog flex items-center justify-center p-0.5 md:p-1 font-bold">+</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* B. BATTLEFIELD BOARD (MIDDLE SPAN) */}
          <div className="flex-1 rounded-xl md:rounded-2xl bg-mg-slate/20 border border-mg-slate p-1 md:p-2 flex flex-col justify-evenly gap-2 md:gap-6 relative min-h-[160px] md:min-h-[220px] transition-all overflow-visible">
            
            {/* Visual targeting guidelines in center banner */}
            {targetingMode !== "none" && (
              <div className="absolute inset-0 bg-mg-slate/20 rounded-xl md:rounded-2xl border-2 border-dashed border-mg-bronze/50 flex flex-col items-center justify-center pointer-events-none z-30">
                <span className="text-[10px] md:text-xs font-mono text-mg-bronze-bright font-extrabold uppercase animate-pulse px-2 text-center">
                  🎯 Ziel wählen: Klick auf einen beliebigen Diener oder ein Helden-Portrait!
                </span>
                <span className="text-[8px] md:text-[9px] text-mg-fog font-sans mt-0.5 md:mt-1 px-4 text-center">
                  Klick auf einen leeren Bereich des Bretts, um abzubrechen.
                </span>
              </div>
            )}

            {/* 1. Opposition Row Deployed Minions */}
            <div className="flex flex-col items-center gap-0.5 md:gap-1.5 w-full">
              <span className="text-[6px] md:text-[8px] font-mono font-bold text-mg-fog tracking-widest uppercase">Gegnerische Aufstellung (max 7)</span>
              <div className="flex flex-row flex-nowrap md:flex-wrap justify-center gap-1 md:gap-3 w-full overflow-visible">
                {opponent && opponent.board.length === 0 ? (
                  <div className="text-[8px] md:text-[10px] text-mg-stone-light italic py-2 md:py-4 font-mono">Das Brett ist leer und sauber.</div>
                ) : (
                  opponent?.board.map((card) => {
                    const isTauntTargetNeeded = opponent.board.some(m => m.hasTaunt) && !card.hasTaunt;
                    const canOpponentTarget = targetingMode !== "none" && !isTauntTargetNeeded;

                    return (
                      <CardItem
                        key={card.id}
                        card={card}
                        isOwner={false}
                        canBePlayed={false}
                        onClick={() => {
                          if (targetingMode !== "none") {
                            handleTargetSelection(card.id, false);
                          }
                        }}
                        className={canOpponentTarget ? "glow-selected ring-1 md:ring-2 ring-mg-bronze-bright scale-102 cursor-pointer" : ""}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Divider lines representing tactical front line */}
            <div className="border-t border-mg-slate relative my-0.5 md:my-1">
              <span className="absolute left-1/2 -translate-x-1/2 -top-1 md:-top-2 bg-mg-void px-2 md:px-3 text-[6px] md:text-[8px] font-mono text-mg-fog tracking-widest uppercase z-10">
                ⚔️ Frontlinie ⚔️
              </span>
            </div>

            {/* 2. Player Row Deployed Minions */}
            <div className="flex flex-col items-center gap-0.5 md:gap-1.5 w-full">
              <span className="text-[6px] md:text-[8px] font-mono font-bold text-mg-fog tracking-widest uppercase">Deine aufgestellten Einheiten</span>
              <div className="flex flex-row flex-nowrap md:flex-wrap justify-center gap-1 md:gap-3 w-full overflow-visible">
                {me && me.board.length === 0 ? (
                  <div className="text-[8px] md:text-[10px] text-mg-stone-light italic py-2 md:py-4 font-mono">Keine Einheiten aufgestellt. Spiel einen Diener aus deiner Hand.</div>
                ) : (
                  me?.board.map((card) => {
                    const isSelected = selectedAttackerId === card.id;
                    const isTargetableByCurrentSpell = targetingMode === "spell_target" || targetingMode === "heropower_target";

                    return (
                      <CardItem
                        key={card.id}
                        card={card}
                        isOwner={true}
                        isSelected={isSelected}
                        canAttack={isActiveTurn && card.isReady}
                        onClick={() => {
                          if (isTargetableByCurrentSpell) {
                            handleTargetSelection(card.id, false);
                          } else if (isActiveTurn && card.isReady) {
                            handleFriendlyMinionClick(card);
                          }
                        }}
                        className={isTargetableByCurrentSpell ? "glow-selected scale-102 cursor-pointer border-mg-bronze-bright" : ""}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* C. PLAYER ROW CARD HAND OVERVIEW */}
          <div className="flex flex-col gap-2 bg-mg-slate/15 p-2 rounded-2xl border border-mg-stone">
            {me && (
              <div className="flex justify-between items-center flex-wrap gap-2 pb-1 border-b border-mg-slate">
                <HeroState
                  player={me}
                  isActiveTurn={isActiveTurn ?? false}
                  onHeroPowerClick={handleHeroPowerClick}
                  isHeroPowerSelected={targetingMode === "heropower_target"}
                  canBeTargeted={targetingMode !== "none" && targetingMode !== "attack_target"}
                  onHeroClick={() => handleTargetSelection(me.id, true)}
                />

                {/* Hand control counts & End Turn Action buttons */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right font-mono text-[10px] text-mg-fog">
                    <span>Deine Hand: {me.hand.length}/10 Karten</span>
                    <br />
                    <span>Deck: {me.deck.length} übrig</span>
                    <br />
                    <span className="mt-1 inline-flex items-center gap-1.5 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${me.isOnline !== false ? "bg-emerald-500 shadow shadow-emerald-400" : "bg-red-500"}`} />
                      <span className={me.isOnline !== false ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {me.isOnline !== false ? "Online" : "Getrennt"}
                      </span>
                    </span>
                  </div>

                  {isActiveTurn && (
                    <button
                      onClick={() => setShowAlchemyForge(true)}
                      type="button"
                      title="Alchemie-Schmiede: Götter-Würfel (zufällig, mehrfach) oder eigene Karte bauen (1x/Spiel)"
                      className="px-4 py-3 font-bold font-sans text-xs tracking-wide uppercase rounded-xl transition-all shadow-md bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-purple-100 cursor-pointer shadow-purple-950/20"
                    >
                      🔮 Schmiede
                    </button>
                  )}

                  {isActiveTurn ? (
                    <EndTurnButton timeRemaining={timeRemaining} onEndTurn={handleEndTurn} />
                  ) : (
                    <button
                      disabled
                      type="button"
                      className="px-6 py-3 bg-mg-slate text-mg-fog border border-mg-stone font-bold font-sans text-xs tracking-wider uppercase rounded-xl cursor-not-allowed opacity-60 flex items-center gap-2"
                    >
                      <span>⏳ Gegner</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-mg-stone font-mono text-mg-bronze/80">
                        {timeRemaining}s
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hand list cards */}
            {me && (
              <div className="flex gap-4 overflow-x-auto py-3 px-1">
                {me.hand.length === 0 ? (
                  <div className="text-xs text-mg-fog italic py-4 pl-4">Deine Hand ist leer. Beende den Zug, um Karten zu ziehen!</div>
                ) : (
                  me.hand.map((card) => {
                    const isPlayedSelected = selectedCardId === card.id;
                    const isAffordable = me.mana >= card.cost;

                    return (
                      <CardItem
                        key={card.id}
                        card={card}
                        isSelected={isPlayedSelected}
                        canBePlayed={isActiveTurn && isAffordable}
                        inHand
                        onClick={() => setPreviewCardId(card.id)}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live interaction chat / chronicles logs sidebar (1 Column) */}
        <div className="flex flex-col justify-between">
          <ChatPanel room={room} connectionId={connectionId} onSendMessage={handleSendChat} />
        </div>
      </main>

      {/* D. GAME OVER VICTORY / LOSS SCANNABLE MODAL OVERLAY */}
      {room.phase === "victory" && !cinematicActive && (
        <div className="fixed inset-0 bg-mg-void/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-mg-slate to-mg-void border-2 border-mg-bronze rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl sh-glow flex flex-col items-center">
            
            {isWinnerMe && (
              <>
                <span className="text-7xl animate-bounce">👑</span>
                <span className="text-xs font-mono font-bold tracking-widest text-mg-bronze uppercase">Sieg errungen!</span>
                <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight">Champion-Duellant</h2>
                <p className="text-mg-fog text-sm max-w-sm">
                  Glückwunsch <strong>{me?.name}</strong>! Du hast {opponent?.name || "deinen Bruder"} im Kartenkampf überlistet und niedergerungen. Stark gespielt!
                </p>
              </>
            )}

            {isWinnerOpponent && (
              <>
                <span className="text-7xl">💀</span>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">Niederlage kassiert</span>
                <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight">Kampf verloren</h2>
                <p className="text-mg-fog text-sm max-w-sm">
                  Pech gehabt! <strong>{opponent?.name}</strong> hat deinen Helden ausgelöscht. Feil an deinem Deck und nimm Rache!
                </p>
              </>
            )}

            {isDraw && (
              <>
                <span className="text-7xl">🧪</span>
                <span className="text-xs font-mono font-bold tracking-widest text-mg-fog uppercase">Gegenseitige Auslöschung</span>
                <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight">Unentschieden</h2>
                <p className="text-mg-fog text-sm max-w-sm">
                  Beide Helden sind gleichzeitig gefallen! Über dem Schlachtfeld liegt absolute Stille. Spielt ein weiteres Duell, um zu entscheiden!
                </p>
              </>
            )}

            {/* Letzter Moment: so endete es (history ist neueste-zuerst -> slice(0,4)) */}
            <div className="w-full bg-mg-void/60 border border-mg-stone rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-widest text-mg-bronze font-mono mb-1">So endete es</div>
              {(room.history || []).slice(0, 4).map((l, i) => (
                <div key={i} className="text-[11px] text-mg-fog font-body leading-snug truncate">{l}</div>
              ))}
            </div>

            {room.finisher && (
              <button
                onClick={() => {
                  const outcome: "win" | "loss" | "draw" =
                    room.winnerId === "DRAW" ? "draw" : room.winnerId === me?.id ? "win" : "loss";
                  runFinisher(room.finisher!, outcome);
                }}
                type="button"
                className="w-full bg-mg-slate hover:bg-mg-stone border border-mg-bronze/60 text-mg-bronze-bright font-bold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                🎬 Todesstoß in Zeitlupe ansehen
              </button>
            )}

            <div className="flex gap-4 pt-4 w-full">
              <button
                onClick={handleRestartGame}
                type="button"
                className="flex-1 bg-mg-bronze hover:bg-mg-bronze-bright text-mg-void font-bold text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                🔄 Nochmal spielen
              </button>
              <button
                onClick={handleLeaveRoom}
                type="button"
                className="flex-1 bg-mg-stone hover:bg-mg-stone-light text-white font-bold text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                🚪 Zurück zur Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alchemy Forge Crafting Modal */}
      {showAlchemyForge && (
        <div className="fixed inset-0 bg-mg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleForgeSubmit}
            className="bg-mg-slate border-2 border-purple-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in text-mg-frost-text"
          >
            <div className="border-b border-purple-950 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔮</span>
                <div>
                  <h3 className="font-serif font-black text-white text-lg tracking-wide uppercase">Alchemie-Schmiede</h3>
                  <p className="text-[10px] text-purple-400 tracking-wider">Würfle dein Schicksal oder bau deine eigene Karte</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlchemyForge(false)}
                className="text-mg-fog hover:text-white font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Götter-Würfel: Zufallskarte, mehrfach, steigende Kosten */}
            {(() => {
              const diceCost = (me?.forgeDiceCount ?? 0) + 1;
              const diceDisabled = !me || !isActiveTurn || me.mana < diceCost || me.hand.length >= 10;
              return (
                <div className="rounded-2xl border border-mg-bronze/40 bg-gradient-to-b from-mg-bronze/10 to-mg-void/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎲</span>
                    <div className="flex-1">
                      <div className="font-display font-bold text-mg-bronze-bright text-sm">Götter-Würfel</div>
                      <div className="text-[10px] text-mg-fog leading-snug">Zufällige Karte, ~1 Stufe über dem Einsatz. Mehrfach pro Spiel, Kosten steigen.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRollDice}
                    disabled={diceDisabled}
                    className={`w-full py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                      diceDisabled
                        ? "bg-mg-stone text-mg-fog opacity-60 cursor-not-allowed"
                        : "bg-gradient-to-r from-mg-bronze to-amber-700 hover:from-mg-bronze-bright hover:to-amber-600 text-mg-void cursor-pointer active:scale-98"
                    }`}
                  >
                    {!isActiveTurn ? "⏳ Nicht dein Zug" : me && me.hand.length >= 10 ? "Hand voll" : me && me.mana < diceCost ? `Braucht ${diceCost} Mana` : `🎲 Würfeln (${diceCost} Mana)`}
                  </button>
                </div>
              );
            })()}

            {/* Trenner */}
            <div className="flex items-center gap-3 text-[9px] text-mg-fog uppercase tracking-widest font-display">
              <span className="h-px flex-1 bg-mg-stone" /> oder selber bauen (1x/Spiel) <span className="h-px flex-1 bg-mg-stone" />
            </div>

            {me?.hasForgedThisGame && (
              <div className="text-[10px] text-mg-fog/80 italic text-center bg-mg-void/40 border border-mg-stone rounded-xl py-2">
                Selber-Bauen hast du dieses Spiel schon genutzt - der Würfel geht aber weiter.
              </div>
            )}

            {/* Inputs Grid */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Kartenname</label>
                <input
                  type="text"
                  value={forgeName}
                  onChange={(e) => setForgeName(e.target.value)}
                  placeholder="z.B. Flammen-gezeichneter Knappe"
                  className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Kartentyp</label>
                  <select
                    value={forgeType}
                    onChange={(e) => setForgeType(e.target.value as "minion" | "spell")}
                    className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="minion">Diener</option>
                    <option value="spell">Zauberrolle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Emoji-Motiv</label>
                  <select
                    value={forgeEmoji}
                    onChange={(e) => setForgeEmoji(e.target.value)}
                    className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="⚔️">⚔️ Schwertkämpfer</option>
                    <option value="🛡️">🛡️ Schildwächter</option>
                    <option value="🧙‍♂️">🧙‍♂️ Erzmagier</option>
                    <option value="👹">👹 Schattendämon</option>
                    <option value="🐉">🐉 Uralter Drache</option>
                    <option value="☄️">☄️ Mystischer Komet</option>
                    <option value="🧪">🧪 Gifttrank</option>
                    <option value="🩹">🩹 Goldenes Elixier</option>
                    <option value="🐺">🐺 Schreckenswolf</option>
                    <option value="💀">💀 Totenbeschwörer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {forgeType === "minion" && (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Angriffskraft</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={forgeAttack}
                        onChange={(e) => setForgeAttack(e.target.value)}
                        className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Lebenspunkte</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={forgeHealth}
                        onChange={(e) => setForgeHealth(e.target.value)}
                        className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-center"
                      />
                    </div>
                  </>
                )}

                {forgeType === "spell" && (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Magischer Effekt</label>
                      <select
                        value={forgeSpellEffect}
                        onChange={(e) => setForgeSpellEffect(e.target.value as "damage" | "heal" | "draw")}
                        className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="damage">💥 Schaden verursachen</option>
                        <option value="heal">💖 Leben heilen</option>
                        <option value="draw">📖 Karten ziehen</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Effekt-Stärke</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={forgeSpellValue}
                        onChange={(e) => setForgeSpellValue(e.target.value)}
                        className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-center"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-mg-fog mb-1">Beschreibungstext</label>
                <input
                  type="text"
                  value={forgeDesc}
                  onChange={(e) => setForgeDesc(e.target.value)}
                  placeholder="z.B. Füge einem beliebigen Gegner 3 Schaden zu."
                  className="w-full bg-mg-void border border-mg-stone rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {forgeType === "minion" && (
                <div className="bg-mg-void p-3 rounded-xl border border-mg-stone space-y-2 mt-2">
                  <span className="block text-[9px] uppercase font-mono text-mg-fog font-bold">Schlüsselwörter wählen</span>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-mg-fog">
                      <input
                        type="checkbox"
                        checked={forgeTaunt}
                        onChange={(e) => setForgeTaunt(e.target.checked)}
                        className="rounded border-mg-stone text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      🛡️ Spott (Taunt)
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-mg-fog">
                      <input
                        type="checkbox"
                        checked={forgeCharge}
                        onChange={(e) => setForgeCharge(e.target.checked)}
                        className="rounded border-mg-stone text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      ⚡ Ansturm (Charge)
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-mg-fog">
                      <input
                        type="checkbox"
                        checked={forgeShield}
                        onChange={(e) => setForgeShield(e.target.checked)}
                        className="rounded border-mg-stone text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      ✨ Gottesschild
                    </label>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              let calculatedCost = 0;
              if (forgeType === "minion") {
                const atk = Number(forgeAttack) || 1;
                const hp = Number(forgeHealth) || 1;
                let baseStatCost = Math.ceil((atk + hp) / 2);
                let abilityCount = (forgeTaunt ? 1 : 0) + (forgeCharge ? 1 : 0) + (forgeShield ? 1 : 0);
                let abilityCost = (forgeTaunt ? 1 : 0) + (forgeCharge ? 2 : 0) + (forgeShield ? 1 : 0);
                let scalingPenalty = abilityCount > 1 ? abilityCount * 2 : 0;
                if (atk >= 5 && abilityCount >= 2) scalingPenalty += 4;
                calculatedCost = Math.max(1, baseStatCost + abilityCost + scalingPenalty - 1);
              } else {
                const spVal = Number(forgeSpellValue) || 1;
                if (forgeSpellEffect === "damage") calculatedCost = Math.ceil(spVal);
                if (forgeSpellEffect === "heal") calculatedCost = Math.ceil(spVal / 2);
                if (forgeSpellEffect === "draw") calculatedCost = Math.ceil(spVal * 2.5);
              }
              const isTooExpensive = calculatedCost > 10;
              const alreadyForged = !!me?.hasForgedThisGame;
              const manualDisabled = isTooExpensive || alreadyForged;
              return (
                <button
                  type="submit"
                  className={`w-full py-3 mt-4 text-white font-bold tracking-wider uppercase rounded-xl shadow-lg transition-all text-xs flex justify-center items-center gap-2 ${
                    manualDisabled
                      ? "bg-mg-stone cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 cursor-pointer active:scale-98"
                  }`}
                  disabled={manualDisabled}
                >
                  {alreadyForged ? "⏳ Selber-Bauen schon genutzt" : isTooExpensive ? "⚠️ Zu mächtig (>10 Mana)" : `🧪 Schmieden (${calculatedCost} Mana)`}
                </button>
              );
            })()}
          </form>
        </div>
      )}

      {/* Karten-Vorschau: gross lesen, dann bewusst spielen (Handy-freundlich) */}
      {previewCard && (
        <div
          className="fixed inset-0 bg-mg-void/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setPreviewCardId(null); }}
        >
          <div
            className="bg-gradient-to-b from-mg-slate to-mg-void border-2 border-mg-bronze/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kopf: Kosten + Name + Typ */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-b from-mg-frost to-mg-frost-deep border-2 border-mg-bronze-bright flex items-center justify-center font-display font-black text-lg text-mg-frost-text shadow-[0_0_10px_rgba(95,168,214,0.5)] shrink-0">
                {previewCard.cost}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-black text-white text-lg leading-tight truncate">{previewCard.name}</h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-mg-bronze">
                  {previewCard.type === "minion" ? "Diener" : "Zauber"} · {previewCard.cost} Mana
                </span>
              </div>
            </div>

            {/* Grosses Artwork */}
            <div className="h-28 rounded-2xl bg-mg-void/70 border border-mg-stone flex items-center justify-center text-6xl mb-3 shadow-inner">
              {previewCard.emoji}
            </div>

            {/* Werte (Diener) */}
            {previewCard.type === "minion" && (
              <div className="flex justify-center gap-6 mb-3 font-display font-black">
                <span className="flex items-center gap-1.5 text-mg-frost-text text-lg"><span className="text-sm">⚔️</span>{previewCard.attack}</span>
                <span className="flex items-center gap-1.5 text-mg-poison text-lg"><span className="text-sm">❤️</span>{previewCard.health}</span>
              </div>
            )}

            {/* Beschreibung */}
            <p className="text-sm text-mg-frost-text/90 font-body leading-relaxed text-center mb-3">{previewCard.description}</p>

            {/* Schluesselwort-Erklaerungen (= Tooltips, am Handy lesbar) */}
            {previewKeywords.length > 0 && (
              <div className="bg-mg-void/60 border border-mg-stone rounded-xl p-3 mb-4 space-y-1.5">
                <div className="text-[9px] uppercase tracking-widest text-mg-bronze-bright font-mono font-bold text-center">Marcgard Kodex</div>
                {previewKeywords.map((tip, i) => (
                  <div key={i} className="text-[11px] text-mg-fog font-body leading-snug">{tip}</div>
                ))}
              </div>
            )}

            {/* Aktionen */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => playCardNow(previewCard)}
                disabled={!previewCanPlay}
                className={`flex-1 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                  previewCanPlay
                    ? "bg-gradient-to-b from-mg-bronze-bright to-mg-bronze text-mg-void cursor-pointer hover:brightness-110 active:scale-98"
                    : "bg-mg-stone text-mg-fog opacity-60 cursor-not-allowed"
                }`}
              >
                {!isActiveTurn ? "⏳ Nicht dein Zug" : !previewAffordable ? "Zu wenig Mana" : previewBoardFull ? "Brett voll (max 7)" : previewCard.type === "minion" ? "⚔️ Beschwören" : "✨ Wirken"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewCardId(null)}
                className="px-4 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-mg-slate-raised text-mg-fog border border-mg-stone hover:text-white hover:border-mg-stone-light cursor-pointer transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
