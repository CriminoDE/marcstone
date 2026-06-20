// Zufaellige nordische Duellanten-Namen (norwegisch/daenisch/altnordisch angehaucht).
// Kurz gehalten (<= 15 Zeichen), passend zum Marcgard-Setting.

const FIRST = [
  "Ragnar", "Bjorn", "Ivar", "Sigurd", "Erik", "Leif", "Knut", "Sven",
  "Harald", "Gunnar", "Ulf", "Rurik", "Halfdan", "Olaf", "Frode", "Eirik",
  "Torvald", "Sten", "Vidar", "Arne", "Skarde", "Hakon", "Roar", "Trygve",
  "Astrid", "Sigrid", "Freya", "Hilda", "Thora", "Gunnhild", "Ingrid", "Solveig",
  "Yrsa", "Revna", "Dagny", "Saga",
];

const BYNAME = ["Rabe", "Wolf", "Frost", "Blut", "Sturm", "Eisen", "Grimm", "Nacht"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateVikingName(): string {
  const first = pick(FIRST);
  if (Math.random() < 0.45) {
    const candidate = `${first} ${pick(BYNAME)}`;
    if (candidate.length <= 15) return candidate;
  }
  return first;
}
