// Background music loop (singleton). One Audio element at module scope so switching
// between lobby and game views never restarts the track. Quiet by default, toggle-able,
// state persisted in localStorage. Browsers block autoplay -> startMusic() must be
// called from a user gesture (see MusicToggle).

let audio: HTMLAudioElement | null = null;

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio("/audio/music.mp3");
    audio.loop = true;
    audio.volume = 0.18; // quiet background
  }
  return audio;
}

export function isMusicMuted(): boolean {
  return localStorage.getItem("marc_muted") === "1";
}

export function startMusic(): void {
  if (isMusicMuted()) return;
  el().play().catch(() => {
    // autoplay still blocked; will retry on next gesture
  });
}

export function setMusicMuted(muted: boolean): void {
  localStorage.setItem("marc_muted", muted ? "1" : "0");
  const a = el();
  if (muted) a.pause();
  else a.play().catch(() => {});
}
