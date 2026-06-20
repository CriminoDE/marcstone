import { Card } from "./types";

export const CARD_TEMPLATES = {
  // 1 Mana Minions
  "g_footman": {
    name: "Goldshire Footman",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 2,
    emoji: "🛡️",
    description: "🛡️ Spott. 'Bereit fürs Gemetzel!'",
    hasTaunt: true,
  },
  "b_murloc": {
    name: "Baby Murloc",
    type: "minion",
    cost: 1,
    attack: 2,
    health: 1,
    emoji: "🐸",
    description: "⚡ Ansturm. Geht erbarmungslos auf die Nerven.",
    hasCharge: true,
  },
  "s_slime": {
    name: "Shiny Slime",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 3,
    emoji: "🦠",
    description: "Klebt wie die Pest. Solide frühe Mauer.",
  },

  // 1 Mana Spells
  "arc_shot": {
    name: "Arcane Shot",
    type: "spell",
    cost: 1,
    attack: 0,
    health: 0,
    emoji: "🏹",
    description: "💥 Füge 2 Schaden an einem beliebigen Ziel zu.",
  },

  // 2 Mana Minions
  "b_warrior": {
    name: "Bluegill Warrior",
    type: "minion",
    cost: 2,
    attack: 3,
    health: 1,
    emoji: "🐠",
    description: "⚡ Ansturm. Hohe Gefahr, wenig Leben.",
    hasCharge: true,
  },
  "annoy_tron": {
    name: "Annoy-o-Tron",
    type: "minion",
    cost: 2,
    attack: 1,
    health: 2,
    emoji: "🤖",
    description: "🛡️ Spott. 🌟 Gottesschild. HALLO!!!",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "crocolisk": {
    name: "River Crocolisk",
    type: "minion",
    cost: 2,
    attack: 2,
    health: 3,
    emoji: "🐊",
    description: "Solide Werte. Grundsolide und verlässlich.",
  },

  // 2 Mana Spells
  "heal_touch": {
    name: "Healing Touch",
    type: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    emoji: "💚",
    description: "💚 Heile 6 Leben an einem beliebigen Ziel.",
  },

  // 3 Mana Minions
  "s_tank": {
    name: "Spider Tank",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 4,
    emoji: "🕷️",
    description: "Dicker Panzer. Hervorragende Werte.",
  },
  "s_crusader": {
    name: "Scarlet Crusader",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 1,
    emoji: "⚔️",
    description: "🌟 Gottesschild. Schluckt den ersten Treffer.",
    hasDivineShield: true,
  },
  "w_rider": {
    name: "Wolfrider",
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
    name: "Chillwind Yeti",
    type: "minion",
    cost: 4,
    attack: 4,
    health: 5,
    emoji: "❄️",
    description: "Der Alpha-Yeti. Ein absoluter Brocken.",
  },
  "s_shieldmasta": {
    name: "Sen'jin Shieldmasta",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 5,
    emoji: "👹",
    description: "🛡️ Spott. 'TAZ'DINGO!!!'",
    hasTaunt: true,
  },

  // 4 Mana Spells
  "fireball": {
    name: "Fireball",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "🔥",
    description: "🔥 Füge 6 Schaden an einem beliebigen Ziel zu.",
  },
  "consecration": {
    name: "Consecration",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "📢",
    description: "📢 Füge ALLEN gegnerischen Dienern 2 Schaden zu.",
  },

  // 5 Mana Minions
  "s_belcher": {
    name: "Sludge Belcher",
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
    name: "Boulderfist Ogre",
    type: "minion",
    cost: 6,
    attack: 6,
    health: 7,
    emoji: "🪵",
    description: "Die ultimative Legende. Rohe Übermacht.",
  },
  "sunwalker": {
    name: "Sunwalker",
    type: "minion",
    cost: 6,
    attack: 4,
    health: 5,
    emoji: "🐂",
    description: "🛡️ Spott. 🌟 Gottesschild.",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "sylvanas": {
    name: "Sylvanas Windrunner",
    type: "minion",
    cost: 6,
    attack: 5,
    health: 5,
    emoji: "🏹🧝‍♀️",
    description: "❤️ Kampfschrei: Raube einen zufälligen gegnerischen Diener und stell ihn auf dein Brett!",
  },
  "meteor": {
    name: "Meteor Strike",
    type: "spell",
    cost: 6,
    attack: 0,
    health: 0,
    emoji: "🌠",
    description: "🌠 Füge 8 Schaden an einem BELIEBIGEN Ziel zu.",
  },

  // 7 Mana Spells
  "flamestrike": {
    name: "Flamestrike",
    type: "spell",
    cost: 7,
    attack: 0,
    health: 0,
    emoji: "🌌",
    description: "🌌 Füge allen gegnerischen Dienern 4 Schaden zu.",
  },

  // 8 Mana Minions
  "lich_king": {
    name: "The Lich King",
    type: "minion",
    cost: 8,
    attack: 8,
    health: 8,
    emoji: "👑",
    description: "🛡️ Spott. 🌟 Gottesschild. 'Kniet vor eurem König!'",
    hasTaunt: true,
    hasDivineShield: true,
  },
  "ragnaros": {
    name: "Ragnaros the Firelord",
    type: "minion",
    cost: 8,
    attack: 8,
    health: 8,
    emoji: "🔥👺",
    description: "🔥 Kampfschrei: Füge einem zufälligen Gegner 8 Schaden zu!",
  },
  "m_firelord": {
    name: "Marc the Firelord",
    type: "minion",
    cost: 8,
    attack: 7,
    health: 7,
    emoji: "👑🔥",
    description: "🔥 Kampfschrei: Füge allen Gegnern 4 Schaden zu!",
  },

  // 10 Mana Minions & Spells
  "deathwing": {
    name: "Deathwing",
    type: "minion",
    cost: 10,
    attack: 12,
    health: 12,
    emoji: "🐉",
    description: "Drache der Apokalypse. Fegt das Brett leer.",
  },
  "pyroblast": {
    name: "Pyroblast",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "☄️",
    description: "☄️ Füge 10 Schaden zu! Der totale Untergang.",
  },
  "mind_control": {
    name: "Mind Control",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "👁️",
    description: "👁️ Reiß einen gegnerischen Diener unter deine Kontrolle.",
  },

  // Newly Balanced Marcgard cards
  "m_squire": {
    name: "Marc's Squire",
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
    description: "💣 Kampfschrei: Füge 3 zufälligen Zielen je 2 Schaden zu!",
  },
  "pot_greed": {
    name: "Tome of Marc",
    type: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    emoji: "📖",
    description: "🃏 Ziehe 2 Karten.",
  },
  "alexstrasza": {
    name: "Marc's Breath",
    type: "minion",
    cost: 9,
    attack: 8,
    health: 8,
    emoji: "🐉❤️",
    description: "❤️ Kampfschrei: Setze das Leben eines beliebigen Helden auf 15.",
    battlecryNeedsTarget: true,
  },
  "m_champion": {
    name: "Marc's Champion",
    type: "minion",
    cost: 6,
    attack: 4,
    health: 5,
    emoji: "🏇🛡️",
    description: "🌟 Gottesschild. ⚡ Ansturm. Sofortige Schlagkraft.",
    hasDivineShield: true,
    hasCharge: true,
  },

  // === Klassen-Signaturkarten (Wave: Klassen-Identitaet) - alle ziellos, kein neues Targeting noetig ===
  // Mage - Frost & Kontrolle
  "blizzard": {
    name: "Blizzard",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "🌨️",
    description: "🌨️ Füge allen gegnerischen Dienern 2 Schaden zu und friere sie ein.",
  },
  "frost_ele": {
    name: "Wasserelementar",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 6,
    emoji: "💧",
    description: "Eiskalte Mauer aus dem Nordmeer. Zäh und kalt.",
  },
  // Priest - Heilung & Schatten
  "holy_nova": {
    name: "Heilige Nova",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "🌟",
    description: "🌟 2 Schaden an allen Gegner-Dienern. +2 Leben für deinen Helden und alle eigenen Diener.",
  },
  "temple_guard": {
    name: "Tempelwächter",
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
    name: "Mehrfachschuss",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "🎯",
    description: "🎯 Füge zwei zufälligen gegnerischen Zielen je 3 Schaden zu.",
  },
  "dire_wolf": {
    name: "Schreckenswolf",
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
    name: "Göttlicher Sturm",
    type: "spell",
    cost: 5,
    attack: 0,
    health: 0,
    emoji: "✨",
    description: "✨ Gib allen befreundeten Dienern +1/+1.",
  },
  "silver_knight": {
    name: "Silberhand-Ritter",
    type: "minion",
    cost: 4,
    attack: 4,
    health: 4,
    emoji: "⚜️",
    description: "🌟 Gottesschild. Streiter des Lichts.",
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

  // === Marc-Legendäre (Wave "Marcs Macht") - nutzen nur bestehende Frameworks (Zauber + Kampfschrei) ===
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
    description: "🔮 Kampfschrei: Blick in den Abgrund - ziehe 2 Karten, verliere aber 2 Leben.",
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
    battlecryNeedsTarget: "battlecryNeedsTarget" in template ? (template as any).battlecryNeedsTarget : false,
    isReady: false,
  };
}

export const HERO_POWER_COST = 2;

export const HERO_POWERS_LIST = {
  Mage: [
    {
      name: "Fireblast",
      description: "Füge einem beliebigen Ziel 1 Schaden zu.",
      emoji: "🔥",
    },
    {
      name: "Chilled Arcana",
      description: "Füge einem Diener 1 Schaden zu und friere ihn ein - er überspringt seinen nächsten Angriff.",
      emoji: "❄️",
    },
    {
      name: "Unstable Magic",
      description: "Füge einem zufälligen gegnerischen Diener 1-3 zufälligen Schaden zu.",
      emoji: "🌀",
    }
  ],
  Priest: [
    {
      name: "Lesser Heal",
      description: "Heile 2 Leben an einem beliebigen Ziel.",
      emoji: "🩹",
    },
    {
      name: "Power Infusion",
      description: "Gib einem befreundeten Diener +2 Leben.",
      emoji: "✨",
    },
    {
      name: "Mind Spike",
      description: "Füge einem beliebigen Ziel 1 Schaden zu. Ein getroffener Diener verliert bis zu seinem nächsten Zug 1 Angriff.",
      emoji: "🔮",
    }
  ],
  Hunter: [
    {
      name: "Steady Shot",
      description: "Füge dem gegnerischen Helden 2 Schaden zu.",
      emoji: "🏹",
    },
    {
      name: "Call Pet",
      description: "Beschwöre einen 1/1 Wildkeiler mit Ansturm.",
      emoji: "🐗",
    },
    {
      name: "Explosive Trap",
      description: "Füge allen gegnerischen Dienern 1 Schaden zu.",
      emoji: "💣",
    }
  ],
  Paladin: [
    {
      name: "Reinforce",
      description: "Beschwöre einen 1/1 Rekruten der Silbernen Hand.",
      emoji: "🫡",
    },
    {
      name: "Aegis Armor",
      description: "Gib einem befreundeten Diener Gottesschild.",
      emoji: "🛡️",
    },
    {
      name: "Holy Light",
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
// Paladin = Licht/Gottesschild/breit. Die Legendaeren sind absichtlich NICHT mehr ueberall gleich.
export const STANDARD_CLASS_CARDS: Record<string, string[]> = {
  // FROST & FEUER: viel Direktschaden, Blizzard + Wasserelementar exklusiv. Wenig Heilung.
  Mage: [
    "arc_shot", "fireball", "meteor", "pyroblast", "blizzard", "flamestrike",
    "frost_ele", "c_yeti", "s_tank", "crocolisk", "s_slime", "s_belcher", "b_ogre", "annoy_tron",
    "ragnaros", "dr_boom", "m_firelord", "deathwing",
    "m_squire", "pot_greed", "m_champion", "lich_king",
    "m_ravens", "m_marksman",
    "m_wrath", "m_curse", "m_seer"
  ],
  // HEILUNG & SCHATTEN: Heilige Nova + Tempelwaechter exklusiv, Gedankenkontrolle + Sylvanas, zaehe Koerper.
  Priest: [
    "holy_nova", "heal_touch", "temple_guard", "mind_control", "sylvanas",
    "s_slime", "crocolisk", "annoy_tron", "s_shieldmasta", "s_belcher", "sunwalker", "b_ogre", "c_yeti",
    "alexstrasza", "lich_king", "deathwing", "m_firelord",
    "m_squire", "pot_greed", "m_champion", "arc_shot", "g_footman",
    "m_warden",
    "m_seer", "m_wrath"
  ],
  // BESTIEN & AGGRO: Mehrfachschuss + Schreckenswolf exklusiv, viel Ansturm, schnelle Bedrohungen.
  Hunter: [
    "multi_shot", "dire_wolf", "b_murloc", "b_warrior", "w_rider", "arc_shot", "fireball",
    "crocolisk", "s_tank", "c_yeti", "s_crusader", "s_shieldmasta", "b_ogre",
    "ragnaros", "dr_boom", "m_firelord",
    "m_squire", "pot_greed", "m_champion", "s_belcher", "annoy_tron", "meteor",
    "m_ravens", "m_marksman",
    "m_curse", "fenrir"
  ],
  // LICHT & BREITE: Goettlicher Sturm + Silberhand-Ritter exklusiv, Gottesschilde + Spott + Weihe, go-wide.
  Paladin: [
    "divine_storm", "silver_knight", "consecration", "s_crusader", "sunwalker", "annoy_tron", "g_footman",
    "lich_king", "alexstrasza", "s_shieldmasta", "s_belcher", "c_yeti", "crocolisk", "s_slime", "heal_touch",
    "m_firelord", "m_squire", "pot_greed", "m_champion", "b_ogre", "s_tank", "w_rider",
    "m_warden",
    "fenrir", "m_curse"
  ]
};
