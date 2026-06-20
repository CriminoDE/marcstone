import React, { useEffect, useState } from "react";
import { isMusicMuted, setMusicMuted, startMusic } from "../utils/music";

// Small fixed speaker button. Kicks the background music off on the first user
// gesture (autoplay policy) and lets the player mute/unmute it.
export function MusicToggle() {
  const [muted, setMuted] = useState(isMusicMuted());

  useEffect(() => {
    const onFirst = () => startMusic();
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMusicMuted(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Musik einschalten" : "Musik ausschalten"}
      aria-label={muted ? "Musik einschalten" : "Musik ausschalten"}
      className="fixed top-3 right-3 z-40 w-9 h-9 rounded-full bg-mg-slate/80 border border-mg-stone text-base text-mg-fog hover:text-mg-frost-text hover:border-mg-bronze backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all"
    >
      {muted ? "🔇" : "🎵"}
    </button>
  );
}
