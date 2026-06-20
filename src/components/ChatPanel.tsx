import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, RoomState } from "../types";

interface ChatPanelProps {
  room: RoomState;
  connectionId: string;
  onSendMessage: (text: string) => void;
}

const PREBUILT_EMOTES = [
  "Sei gegrüßt, Wurm. 🧙‍♀️",
  "Stark gespielt, Bruder. 🤝",
  "Autsch, das tat weh. 🥴",
  "Schwerer Fehler, kleiner Mann. 💥",
  "Mein Brett zerschmettert deins! ⚔️",
  "Verzeih, das war zu brutal. 🧪",
];

export function ChatPanel({ room, connectionId, onSendMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat & history on change safely without jumping the main viewport
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [room.messages]);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [room.history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 h-64 md:h-[480px]">
      {/* 1. Tactical Logs Section */}
      <div className="flex-1 flex flex-col bg-mg-slate/90 rounded-2xl border border-mg-bronze/40 p-4 shadow-inner">
        <h4 className="text-xs font-mono font-bold tracking-widest text-mg-bronze uppercase pb-2 border-b border-stone-800 flex items-center justify-between">
          <span>⚔️ Schlachtchronik</span>
          <span className="text-[10px] bg-mg-bronze/10 text-mg-bronze-bright px-2 py-0.5 rounded-full font-mono">
            {room.history.length} Aktionen
          </span>
        </h4>
        
        {/* Scrollable history log */}
        <div ref={logScrollRef} className="flex-1 overflow-y-auto mt-3 pr-2 space-y-1.5 font-mono text-xs text-stone-300">
          {room.history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-500 text-[11px] italic">
              Noch kein Blut geflossen. Lass das Duell beginnen!
            </div>
          ) : (
            room.history.map((log, index) => {
              // Highlight combat elements
              const isAttack = log.includes("⚔️") || log.includes("attacks");
              const isSpell = log.includes("Cast") || log.includes("Spell:");
              const isDead = log.includes("falls") || log.includes("dead") || log.includes("Fatigue") || log.includes("💀");
              const isJoined = log.includes("joined") || log.includes("created");

              return (
                <div
                  key={index}
                  className={`p-1.5 rounded text-[11px] leading-tight transition-colors border ${
                    isAttack
                      ? "bg-mg-slate/30 border-mg-bronze/40 text-mg-bronze-bright"
                      : isSpell
                        ? "bg-purple-950/20 border-purple-900/40 text-purple-300"
                        : isDead
                          ? "bg-red-950/30 border-red-900/40 text-red-300"
                          : isJoined
                            ? "bg-emerald-950/20 border-emerald-900/35 text-emerald-300"
                            : "bg-stone-950/40 border-transparent text-stone-400"
                  }`}
                >
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Interactive Chat Room Section */}
      <div className="w-full md:w-80 flex flex-col bg-mg-slate/90 rounded-2xl border border-mg-bronze/40 p-4 shadow-inner">
        <h4 className="text-xs font-mono font-bold tracking-widest text-mg-bronze-bright uppercase pb-2 border-b border-stone-800 flex items-center justify-between">
          <span>💬 Spott-Kammer</span>
          <span className="w-2 h-2 rounded-full bg-mg-bronze animate-pulse" />
        </h4>

        {/* Messaging Box */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto my-3 pr-2 space-y-2 max-h-[220px] md:max-h-[300px]">
          {room.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-500 text-[11px] italic">
              Schick Sprüche oder Nachrichten und mach ihn fertig!
            </div>
          ) : (
            room.messages.map((msg) => {
              const isMe = msg.senderId === connectionId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <span className="text-[9px] text-stone-500 font-mono mb-0.5">
                    {msg.senderName} • {msg.timestamp}
                  </span>
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-xs font-sans leading-snug break-words ${
                      isMe
                        ? "bg-mg-bronze text-white rounded-tr-none border border-mg-bronze"
                        : "bg-stone-800 text-stone-200 rounded-tl-none border border-stone-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Preset Emotes Drawer */}
        <div className="flex flex-wrap gap-1 mb-2">
          {PREBUILT_EMOTES.map((emote) => (
            <button
              key={emote}
              onClick={() => onSendMessage(emote)}
              className="text-[10px] bg-mg-stone/80 hover:bg-mg-stone-light hover:text-white text-mg-fog px-2 py-1 rounded-lg border border-mg-stone-light/60 cursor-pointer transition-colors"
            >
              {emote}
            </button>
          ))}
        </div>

        {/* Message Input string */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nachricht tippen..."
            maxLength={100}
            className="flex-1 bg-mg-slate border border-mg-stone-light rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            Senden
          </button>
        </form>
      </div>
    </div>
  );
}
