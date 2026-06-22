import { Card } from "./types";

export const CARD_TEMPLATES = {
  // 1 Mana Minions
  "g_footman": {
    name: "Hügelwächter",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 2,
    emoji: "🛡️",
    description: "🛡️ Spott. 'Bereit fürs Gemetzel!'",
    hasTaunt: true,
  },
  "b_murloc": {
    name: "Sumpfbalg",
    type: "minion",
    cost: 1,
    attack: 2,
    health: 1,
    emoji: "🐸",
    description: "⚡ Ansturm. Geht erbarmungslos auf die Nerven.",
    hasCharge: true,
  },
  "s_slime": {
    name: "Kriechschleim",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 3,
    emoji: "🦠",
    description: "Klebt wie die Pest. Solide frühe Mauer.",
  },

  // 1 Mana Spells
  "arc_shot": {
    name: "Runenpfeil",
    type: "spell",
    cost: 1,
    attack: 0,
    health: 0,
    emoji: "🏹",
    description: "💥 Füge 2 Schaden an einem beliebigen Ziel zu.",
  },

  // 2 Mana Minions
  "b_warrior": {
    name: "Fjordkrieger",
    type: "minion",
    cost: 2,
    attack: 3,
    health: 1,
    emoji: "🐠",
    description: "⚡ Ansturm. Hohe Gefahr, wenig Leben.",
    hasCharge: true,
  },
  "annoy_tron": {
    name: "Klapperkobold",
    type: "minion",
    cost: 2,
    attack: 1,
    health: 2,
    emoji: "🤖",
    description: "🛡️ Spott. 🌟 Runenschild. Klappert dir ein Loch in den Schädel.",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "crocolisk": {
    name: "Flussechse",
    type: "minion",
    cost: 2,
    attack: 2,
    health: 3,
    emoji: "🐊",
    description: "Solide Werte. Grundsolide und verlässlich.",
  },

  // 2 Mana Spells
  "heal_touch": {
    name: "Heilende Hand",
    type: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    emoji: "💚",
    description: "💚 Heile 6 Leben an einem beliebigen Ziel.",
  },

  // 3 Mana Minions
  "s_tank": {
    name: "Panzerspinne",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 4,
    emoji: "🕷️",
    description: "Dicker Panzer. Hervorragende Werte.",
  },
  "s_crusader": {
    name: "Scharlach-Streiter",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 1,
    emoji: "⚔️",
    description: "🌟 Runenschild. Schluckt den ersten Treffer.",
    hasDivineShield: true,
  },
  "w_rider": {
    name: "Wolfsreiter",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 1,
    emoji: "🐺",
    description: "⚡ Ansturm. 'Schmeck meine Klinge!'",
    hasCharge: true,
  },

  // 4 Mana Minions
  "c_yeti": {
    name: "Ymir, der Frostriese",
    type: "minion",
    cost: 4,
    attack: 4,
    health: 5,
    emoji: "❄️",
    description: "Ein wandelnder Eisberg. Ein absoluter Brocken.",
  },
  "s_shieldmasta": {
    name: "Schildwart der Veste",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 5,
    emoji: "👹",
    description: "🛡️ Spott. 'Keiner kommt vorbei!'",
    hasTaunt: true,
  },

  // 4 Mana Spells
  "fireball": {
    name: "Flammenstoß",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "🔥",
    description: "🔥 Füge 6 Schaden an einem beliebigen Ziel zu.",
  },
  "consecration": {
    name: "Heiliger Bannkreis",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "📢",
    description: "📢 Füge ALLEN gegnerischen Dienern 2 Schaden zu.",
  },

  // 5 Mana Minions
  "s_belcher": {
    name: "Sumpfwanst",
    type: "minion",
    cost: 5,
    attack: 3,
    health: 6,
    emoji: "🤢",
    description: "🛡️ Spott. Ekelhaft zäh, kaum totzukriegen.",
    hasTaunt: true,
  },

  // 6 Mana Minions
  "b_ogre": {
    name: "Felsfaust-Jötun",
    type: "minion",
    cost: 6,
    attack: 6,
    health: 7,
    emoji: "🪵",
    description: "Ein Bergriese aus dem Norden. Rohe Übermacht.",
  },
  "sunwalker": {
    name: "Sonnenwächter",
    type: "minion",
    cost: 6,
    attack: 4,
    health: 5,
    emoji: "🐂",
    description: "🛡️ Spott. 🌟 Runenschild.",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "sylvanas": {
    name: "Hela, die Rabenkönigin",
    type: "minion",
    cost: 6,
    attack: 5,
    health: 5,
    emoji: "🏹🦅",
    description: "❤️ Schlachtruf: Raube einen zufälligen gegnerischen Diener und stell ihn auf dein Brett!",
  },
  "meteor": {
    name: "Sternenfall",
    type: "spell",
    cost: 6,
    attack: 0,
    health: 0,
    emoji: "🌠",
    description: "🌠 Füge 8 Schaden an einem BELIEBIGEN Ziel zu.",
  },

  // 7 Mana Spells
  "flamestrike": {
    name: "Flammenwand",
    type: "spell",
    cost: 7,
    attack: 0,
    health: 0,
    emoji: "🌌",
    description: "🌌 Füge allen gegnerischen Dienern 4 Schaden zu.",
  },

  // 8 Mana Minions
  "lich_king": {
    name: "Der Frostkönig",
    type: "minion",
    cost: 8,
    attack: 8,
    health: 8,
    emoji: "👑",
    description: "🛡️ Spott. 🌟 Runenschild. 'Kniet, oder erfriert!'",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "ragnaros": {
    name: "Surtr, der Flammenfürst",
    type: "minion",
    cost: 8,
    attack: 8,
    health: 8,
    emoji: "🔥👺",
    description: "🔥 Schlachtruf: Füge einem zufälligen Gegner 8 Schaden zu!",
  },
  "m_firelord": {
    name: "Marc der Feuerjarl",
    type: "minion",
    cost: 8,
    attack: 7,
    health: 7,
    emoji: "👑🔥",
    description: "🔥 Schlachtruf: Füge allen Gegnern 4 Schaden zu!",
  },

  // 10 Mana Minions & Spells
  "deathwing": {
    name: "Fafnir, der Weltendrache",
    type: "minion",
    cost: 10,
    attack: 12,
    health: 12,
    emoji: "🐉",
    description: "Drache des Untergangs. Sein Atem fegt die Welt leer.",
  },
  "pyroblast": {
    name: "Glutsturm",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "☄️",
    description: "☄️ Füge 10 Schaden zu! Der totale Untergang.",
  },
  "mind_control": {
    name: "Gedankenfessel",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "👁️",
    description: "👁️ Reiß einen gegnerischen Diener unter deine Kontrolle.",
  },

  // Newly Balanced Marcgard cards
  "m_squire": {
    name: "Marcs Knappe",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 2,
    emoji: "🛡️👦",
    description: "🛡️ Spott. Eine tapfere Seele, bereit für den Ruhm.",
    hasTaunt: true,
  },
  "dr_boom": {
    name: "Dr. Marc",
    type: "minion",
    cost: 7,
    attack: 7,
    health: 7,
    emoji: "💣💥",
    description: "💣 Schlachtruf: Füge 3 zufälligen Zielen je 2 Schaden zu!",
  },
  "pot_greed": {
    name: "Marcs Foliant",
    type: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    emoji: "📖",
    description: "🃏 Ziehe 2 Karten.",
  },
  "alexstrasza": {
    name: "Marcs Odem",
    type: "minion",
    cost: 9,
    attack: 8,
    health: 8,
    emoji: "🐉❤️",
    description: "❤️ Schlachtruf: Setze das Leben eines beliebigen Helden auf 15.",
    battlecryNeedsTarget: true,
  },
  "m_champion": {
    name: "Marcs Vorkämpfer",
    type: "minion",
    cost: 6,
    attack: 4,
    health: 5,
    emoji: "🏇🛡️",
    description: "🌟 Runenschild. ⚡ Ansturm. Sofortige Schlagkraft.",
    hasDivineShield: true,
    hasCharge: true,
  },

  // === Klassen-Signaturkarten (Wave: Klassen-Identitaet) - alle ziellos, kein neues Targeting noetig ===
  // Mage - Frost & Kontrolle
  "blizzard": {
    name: "Eissturm",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "🌨️",
    description: "🌨️ Füge allen gegnerischen Dienern 2 Schaden zu und friere sie ein.",
  },
  "frost_ele": {
    name: "Frostwächter",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 6,
    emoji: "💧",
    description: "Eiskalte Mauer aus dem Nordmeer. Zäh und kalt.",
  },
  // Priest - Heilung & Schatten
  "holy_nova": {
    name: "Lichtwoge",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "🌟",
    description: "🌟 2 Schaden an allen Gegner-Dienern. +2 Leben für deinen Helden und alle eigenen Diener.",
  },
  "temple_guard": {
    name: "Hallenwächter",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 6,
    emoji: "🛐",
    description: "🛡️ Spott. Wacht über die Gefallenen.",
    hasTaunt: true,
  },
  // Hunter - Bestien & Aggro
  "multi_shot": {
    name: "Pfeilhagel",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "🎯",
    description: "🎯 Füge zwei zufälligen gegnerischen Zielen je 3 Schaden zu.",
  },
  "dire_wolf": {
    name: "Rudelwolf",
    type: "minion",
    cost: 2,
    attack: 3,
    health: 2,
    emoji: "🐺",
    description: "⚡ Ansturm. Reißt sofort zu.",
    hasCharge: true,
  },
  // Paladin - Licht & Breite
  "divine_storm": {
    name: "Heiliger Wirbel",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "✨",
    description: "✨ Gib allen befreundeten Dienern +1/+1.",
  },
  "silver_knight": {
    name: "Bannerritter",
    type: "minion",
    cost: 4,
    attack: 4,
    health: 4,
    emoji: "⚜️",
    description: "🌟 Runenschild. Streiter des Lichts.",
    hasDivineShield: true,
  },

  // === Marc-Themen-Karten (nur bestehende Keywords - balance-arm, leicht tunebar) ===
  "m_ravens": {
    name: "Marcs Raben",
    type: "minion",
    cost: 3,
    attack: 4,
    health: 2,
    emoji: "🐦‍⬛",
    description: "⚡ Ansturm. Hugin & Munin stürzen sofort herab.",
    hasCharge: true,
  },
  "m_marksman": {
    name: "Marksmann des Marc",
    type: "minion",
    cost: 4,
    attack: 5,
    health: 1,
    emoji: "🎯",
    description: "⚡ Ansturm. Trifft präzise, fällt aber leicht. Glaskanone.",
    hasCharge: true,
  },
  "m_warden": {
    name: "Wächter des Nordens",
    type: "minion",
    cost: 4,
    attack: 4,
    health: 4,
    emoji: "🐻",
    description: "🛡️ Spott. Hält die Schildwand für Marc.",
    hasTaunt: true,
  },

  // === Marc-Legendäre (Wave "Marcs Macht") - nutzen nur bestehende Frameworks (Zauber + Schlachtruf) ===
  "m_wrath": {
    name: "Zorn des Marc",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "🩸⚡",
    description: "⚡ Füge ALLEN Dienern 4 Schaden zu - Freund wie Feind. Marcs Zorn kennt keine Gnade.",
  },
  "m_curse": {
    name: "Marcs Fluch",
    type: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    emoji: "🩸",
    description: "🩸 Halbiere das Leben eines beliebigen Ziels (mindestens 3 Schaden). Der Fluch zehrt an allem.",
  },
  "m_seer": {
    name: "Marc der Seher",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 4,
    emoji: "🔮👁️",
    description: "🔮 Schlachtruf: Blick in den Abgrund - ziehe 2 Karten, verliere aber 2 Leben.",
  },
  "fenrir": {
    name: "Fenrir der Endwolf",
    type: "minion",
    cost: 7,
    attack: 6,
    health: 6,
    emoji: "🐺🌑",
    description: "⚡ Ansturm. Der Wolf, der die Sonne verschlingt - schlägt sofort zu.",
    hasCharge: true,
  },

  // === Todesroecheln-Wave: feuern einen Effekt, wenn der Diener stirbt ===
  "m_revenant": {
    name: "Marcs Wiedergänger",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 2,
    emoji: "🧟🩸",
    description: "💀 Grabhauch: Füge einem gegnerischen Helden 3 Schaden zu. Der Fluch schlägt im Tod zurück.",
    hasDeathrattle: true,
  },
  "m_seeress": {
    name: "Marcs Seherin",
    type: "minion",
    cost: 2,
    attack: 2,
    health: 2,
    emoji: "🔮👁️",
    description: "💀 Grabhauch: Ziehe eine Karte. Ihr letzter Blick gilt der Zukunft.",
    hasDeathrattle: true,
  },
  "fenris_brood": {
    name: "Fenris-Brut",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 3,
    emoji: "🐺🐾",
    description: "💀 Grabhauch: Beschwöre zwei 2/2 Welpen. Die Brut stirbt nie ganz.",
    hasDeathrattle: true,
  },
  "draugr": {
    name: "Draugr-Krieger",
    type: "minion",
    cost: 5,
    attack: 4,
    health: 4,
    emoji: "💀⚔️",
    description: "🛡️ Spott. 💀 Grabhauch: Füge allen gegnerischen Dienern 2 Schaden zu.",
    hasTaunt: true,
    hasDeathrattle: true,
  },
  // === Karten-Wave (v2.15): Heldenkraft-Wechsel + Bann + grosse Bedrohungen ===
  "m_runeshift": {
    name: "Runen-Wandel",
    type: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    emoji: "🔁🪄",
    description: "🔁 Wechsle deine Heldenkraft zur nächsten deiner Klasse - und sie ist sofort wieder einsatzbereit.",
  },
  "m_bann": {
    name: "Marcs Bann",
    type: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    emoji: "🌀🚫",
    description: "🌀 Verbanne einen gegnerischen Diener. Er verschwindet spurlos - kein Grabhauch, keine Rückkehr.",
  },
  "nidhogg": {
    name: "Nidhögg",
    type: "minion",
    cost: 6,
    attack: 5,
    health: 5,
    emoji: "🐉🩸",
    description: "💀 Grabhauch: Füge dem gegnerischen Helden 5 Schaden zu. Der Drache nagt selbst im Tod an der Welt.",
    hasDeathrattle: true,
  },
  "valkyrie": {
    name: "Walküre",
    type: "minion",
    cost: 5,
    attack: 4,
    health: 5,
    emoji: "⚔️👰",
    description: "🛡️ Spott. ❤️ Schlachtruf: Gib allen anderen befreundeten Dienern +1/+1.",
    hasTaunt: true,
  },
  // Nur per Todesroecheln beschworen (nicht im Deck):
  "wolf_token": {
    name: "Fenris-Welpe",
    type: "minion",
    cost: 2,
    attack: 2,
    health: 2,
    emoji: "🐺",
    description: "Ein Welpe aus Fenris-Brut.",
  },
} as const;

export function createCardInstance(templateId: string, instanceId: string): Card {
  const template = CARD_TEMPLATES[templateId as keyof typeof CARD_TEMPLATES];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return {
    id: instanceId,
    templateId,
    name: template.name,
    type: template.type as any,
    cost: template.cost,
    attack: "attack" in template ? (template as any).attack : 0,
    health: "health" in template ? (template as any).health : 0,
    maxHealth: "health" in template ? (template as any).health : 0,
    emoji: template.emoji,
    description: template.description,
    hasTaunt: "hasTaunt" in template ? (template as any).hasTaunt : false,
    hasCharge: "hasCharge" in template ? (template as any).hasCharge : false,
    hasDivineShield: "hasDivineShield" in template ? (template as any).hasDivineShield : false,
    hasDeathrattle: "hasDeathrattle" in template ? (template as any).hasDeathrattle : false,
    battlecryNeedsTarget: "battlecryNeedsTarget" in template ? (template as any).battlecryNeedsTarget : false,
    isReady: false,
  };
}

export const HERO_POWER_COST = 2;

export const HERO_POWERS_LIST = {
  Mage: [
    {
      name: "Feuerstoß",
      description: "Füge einem beliebigen Ziel 1 Schaden zu.",
      emoji: "🔥",
    },
    {
      name: "Chilled Arcana",
      description: "Füge einem Diener 1 Schaden zu und friere ihn ein - er überspringt seinen nächsten Angriff.",
      emoji: "❄️",
    },
    {
      name: "Wilde Magie",
      description: "Füge einem zufälligen gegnerischen Diener 1-3 zufälligen Schaden zu.",
      emoji: "🌀",
    }
  ],
  Priest: [
    {
      name: "Kleine Heilung",
      description: "Heile 2 Leben an einem beliebigen Ziel.",
      emoji: "🩹",
    },
    {
      name: "Kraftsegen",
      description: "Gib einem befreundeten Diener +2 Leben.",
      emoji: "✨",
    },
    {
      name: "Geistesstich",
      description: "Füge einem beliebigen Ziel 1 Schaden zu. Ein getroffener Diener verliert bis zu seinem nächsten Zug 1 Angriff.",
      emoji: "🔮",
    }
  ],
  Hunter: [
    {
      name: "Zielschuss",
      description: "Füge dem gegnerischen Helden 2 Schaden zu.",
      emoji: "🏹",
    },
    {
      name: "Wildruf",
      description: "Beschwöre einen 1/1 Wildkeiler mit Ansturm.",
      emoji: "🐗",
    },
    {
      name: "Berstfalle",
      description: "Füge allen gegnerischen Dienern 1 Schaden zu.",
      emoji: "💣",
    }
  ],
  Paladin: [
    {
      name: "Rekrutieren",
      description: "Beschwöre einen 1/1 Klingenknappen.",
      emoji: "🫡",
    },
    {
      name: "Aegis Armor",
      description: "Gib einem befreundeten Diener Runenschild.",
      emoji: "🛡️",
    },
    {
      name: "Lichtsegen",
      description: "Füge einem gegnerischen Diener 2 Schaden zu und heile deinen Helden um 2 Leben.",
      emoji: "☀️",
    }
  ]
} as const;

export const HERO_POWERS = {
  Mage: HERO_POWERS_LIST.Mage[0],
  Priest: HERO_POWERS_LIST.Priest[0],
  Hunter: HERO_POWERS_LIST.Hunter[0],
  Paladin: HERO_POWERS_LIST.Paladin[0],
} as const;

// Klassen-Identitaet: jede Klasse hat einen eigenen Themen-Stapel + 2 exklusive Signaturkarten.
// Mage = Frost/Feuer-Burn, Priest = Heilung/Schatten/Geist, Hunter = Bestien/Aggro,
// Paladin = Licht/Runenschild/breit. Die Legendaeren sind absichtlich NICHT mehr ueberall gleich.
export const STANDARD_CLASS_CARDS: Record<string, string[]> = {
  // FROST & FEUER: viel Direktschaden, Blizzard + Wasserelementar exklusiv. Wenig Heilung.
  Mage: [
    "arc_shot", "fireball", "meteor", "pyroblast", "blizzard", "flamestrike",
    "frost_ele", "c_yeti", "s_tank", "crocolisk", "s_slime", "s_belcher", "b_ogre", "annoy_tron",
    "ragnaros", "dr_boom", "m_firelord", "deathwing",
    "m_squire", "pot_greed", "m_champion", "lich_king",
    "m_ravens", "m_marksman",
    "m_wrath", "m_curse", "m_seer",
    "m_revenant", "m_seeress",
    "m_runeshift", "m_bann"
  ],
  // HEILUNG & SCHATTEN: Heilige Nova + Tempelwaechter exklusiv, Gedankenkontrolle + Hela, zaehe Koerper.
  Priest: [
    "holy_nova", "heal_touch", "temple_guard", "mind_control", "sylvanas",
    "s_slime", "crocolisk", "annoy_tron", "s_shieldmasta", "s_belcher", "sunwalker", "b_ogre", "c_yeti",
    "alexstrasza", "lich_king", "deathwing", "m_firelord",
    "m_squire", "pot_greed", "m_champion", "arc_shot", "g_footman",
    "m_warden",
    "m_seer", "m_wrath",
    "m_seeress", "draugr",
    "m_runeshift", "valkyrie"
  ],
  // BESTIEN & AGGRO: Mehrfachschuss + Schreckenswolf exklusiv, viel Ansturm, schnelle Bedrohungen.
  Hunter: [
    "multi_shot", "dire_wolf", "b_murloc", "b_warrior", "w_rider", "arc_shot", "fireball",
    "crocolisk", "s_tank", "c_yeti", "s_crusader", "s_shieldmasta", "b_ogre",
    "ragnaros", "dr_boom", "m_firelord",
    "m_squire", "pot_greed", "m_champion", "s_belcher", "annoy_tron", "meteor",
    "m_ravens", "m_marksman",
    "m_curse", "fenrir",
    "fenris_brood", "m_revenant",
    "nidhogg", "valkyrie"
  ],
  // LICHT & BREITE: Goettlicher Sturm + Silberhand-Ritter exklusiv, Runenschilde + Spott + Weihe, go-wide.
  Paladin: [
    "divine_storm", "silver_knight", "consecration", "s_crusader", "sunwalker", "annoy_tron", "g_footman",
    "lich_king", "alexstrasza", "s_shieldmasta", "s_belcher", "c_yeti", "crocolisk", "s_slime", "heal_touch",
    "m_firelord", "m_squire", "pot_greed", "m_champion", "b_ogre", "s_tank", "w_rider",
    "m_warden",
    "fenrir", "m_curse",
    "draugr", "fenris_brood",
    "m_bann", "nidhogg"
  ]
};
