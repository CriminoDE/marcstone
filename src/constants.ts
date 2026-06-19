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
    description: "🛡️ Taunt. 'Ready for action!'",
    hasTaunt: true,
  },
  "b_murloc": {
    name: "Baby Murloc",
    type: "minion",
    cost: 1,
    attack: 2,
    health: 1,
    emoji: "🐸",
    description: "⚡ Charge. Relentlessly annoying.",
    hasCharge: true,
  },
  "s_slime": {
    name: "Shiny Slime",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 3,
    emoji: "🦠",
    description: "Extremely sticky. Good early defense.",
  },

  // 1 Mana Spells
  "arc_shot": {
    name: "Arcane Shot",
    type: "spell",
    cost: 1,
    attack: 0,
    health: 0,
    emoji: "🏹",
    description: "💥 Deal 2 damage to any target.",
  },

  // 2 Mana Minions
  "b_warrior": {
    name: "Bluegill Warrior",
    type: "minion",
    cost: 2,
    attack: 3,
    health: 1,
    emoji: "🐠",
    description: "⚡ Charge. High threat, low health.",
    hasCharge: true,
  },
  "annoy_tron": {
    name: "Annoy-o-Tron",
    type: "minion",
    cost: 2,
    attack: 1,
    health: 2,
    emoji: "🤖",
    description: "🛡️ Taunt. 🌟 Divine Shield. HELLO!!!",
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
    description: "Standard stats. Very reliable.",
  },

  // 2 Mana Spells
  "heal_touch": {
    name: "Healing Touch",
    type: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    emoji: "💚",
    description: "💚 Restore 6 health to any target.",
  },

  // 3 Mana Minions
  "s_tank": {
    name: "Spider Tank",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 4,
    emoji: "🕷️",
    description: "Thick armor. Excellent stats.",
  },
  "s_crusader": {
    name: "Scarlet Crusader",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 1,
    emoji: "⚔️",
    description: "🌟 Divine Shield. Absorbs first hit.",
    hasDivineShield: true,
  },
  "w_rider": {
    name: "Wolfrider",
    type: "minion",
    cost: 3,
    attack: 3,
    health: 1,
    emoji: "🐺",
    description: "⚡ Charge. 'Taste my blade!'",
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
    description: "The apex alpha yeti. Absolute unit.",
  },
  "s_shieldmasta": {
    name: "Sen'jin Shieldmasta",
    type: "minion",
    cost: 4,
    attack: 3,
    health: 5,
    emoji: "👹",
    description: "🛡️ Taunt. 'TAZ'DINGO!!!'",
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
    description: "🔥 Deal 6 damage to any target.",
  },
  "consecration": {
    name: "Consecration",
    type: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    emoji: "📢",
    description: "📢 Deal 2 damage to ALL enemy minions.",
  },

  // 5 Mana Minions
  "s_belcher": {
    name: "Sludge Belcher",
    type: "minion",
    cost: 5,
    attack: 3,
    health: 6,
    emoji: "🤢",
    description: "🛡️ Taunt. Disgustingly hard to remove.",
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
    description: "The ultimate legend. Unmatched power.",
  },
  "sunwalker": {
    name: "Sunwalker",
    type: "minion",
    cost: 6,
    attack: 4,
    health: 5,
    emoji: "🐂",
    description: "🛡️ Taunt. 🌟 Divine Shield.",
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
    description: "❤️ Battlecry: Steal a random enemy minion and attach it to your board!",
  },
  "meteor": {
    name: "Meteor Strike",
    type: "spell",
    cost: 6,
    attack: 0,
    health: 0,
    emoji: "🌠",
    description: "🌠 Deal 8 damage to ANY target.",
  },

  // 7 Mana Spells
  "flamestrike": {
    name: "Flamestrike",
    type: "spell",
    cost: 7,
    attack: 0,
    health: 0,
    emoji: "🌌",
    description: "🌌 Deal 4 damage to all enemy minions.",
  },

  // 8 Mana Minions
  "lich_king": {
    name: "The Lich King",
    type: "minion",
    cost: 8,
    attack: 8,
    health: 8,
    emoji: "👑",
    description: "🛡️ Taunt. 🌟 Divine Shield. 'Bow before your king!'",
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
    description: "🔥 Battlecry: Deal 8 damage to a random enemy!",
  },
  "m_firelord": {
    name: "Marc the Firelord",
    type: "minion",
    cost: 8,
    attack: 7,
    health: 7,
    emoji: "👑🔥",
    description: "🔥 Battlecry: Deal 4 damage to all enemies!",
  },

  // 10 Mana Minions & Spells
  "deathwing": {
    name: "Deathwing",
    type: "minion",
    cost: 10,
    attack: 12,
    health: 12,
    emoji: "🐉",
    description: "Cataclysmic dragon. Direct board obliteration.",
  },
  "pyroblast": {
    name: "Pyroblast",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "☄️",
    description: "☄️ Deal 10 damage! Complete ruin.",
  },
  "mind_control": {
    name: "Mind Control",
    type: "spell",
    cost: 10,
    attack: 0,
    health: 0,
    emoji: "👁️",
    description: "👁️ Seize control of an enemy minion.",
  },

  // Newly Balanced Marcgard cards
  "m_squire": {
    name: "Marc's Squire",
    type: "minion",
    cost: 1,
    attack: 1,
    health: 2,
    emoji: "🛡️👦",
    description: "🛡️ Taunt. Brave soul ready for glory.",
    hasTaunt: true,
  },
  "dr_boom": {
    name: "Dr. Marc",
    type: "minion",
    cost: 7,
    attack: 7,
    health: 7,
    emoji: "💣💥",
    description: "💣 Battlecry: Deal 1 damage to 3 random targets!",
  },
  "pot_greed": {
    name: "Tome of Marc",
    type: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    emoji: "📖",
    description: "🃏 Draw 2 cards.",
  },
  "alexstrasza": {
    name: "Marc's Breath",
    type: "minion",
    cost: 9,
    attack: 8,
    health: 8,
    emoji: "🐉❤️",
    description: "❤️ Battlecry: Set any Hero's remaining health to 15.",
  },
  "m_champion": {
    name: "Marc's Champion",
    type: "minion",
    cost: 5,
    attack: 4,
    health: 5,
    emoji: "🏇🛡️",
    description: "🌟 Divine Shield. ⚡ Charge. Instant valor.",
    hasDivineShield: true,
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
    isReady: false,
  };
}

export const HERO_POWER_COST = 2;

export const HERO_POWERS_LIST = {
  Mage: [
    {
      name: "Fireblast",
      description: "Deal 1 damage to any target.",
      emoji: "🔥",
    },
    {
      name: "Chilled Arcana",
      description: "Deal 1 damage to a minion and Freeze it.",
      emoji: "❄️",
    },
    {
      name: "Unstable Magic",
      description: "Deal 1-3 random damage to a random enemy minion.",
      emoji: "🌀",
    }
  ],
  Priest: [
    {
      name: "Lesser Heal",
      description: "Restore 2 health to any target.",
      emoji: "🩹",
    },
    {
      name: "Power Infusion",
      description: "Give a friendly minion +2 Health.",
      emoji: "✨",
    },
    {
      name: "Mind Spike",
      description: "Deal 1 damage to any target. If it's a minion, reduce its attack by 1 until your next turn.",
      emoji: "🔮",
    }
  ],
  Hunter: [
    {
      name: "Steady Shot",
      description: "Deal 2 damage to the enemy hero.",
      emoji: "🏹",
    },
    {
      name: "Call Pet",
      description: "Summon a 1/1 Fast Boar with Charge.",
      emoji: "🐗",
    },
    {
      name: "Explosive Trap",
      description: "Deal 1 damage to all enemy minions.",
      emoji: "💣",
    }
  ],
  Paladin: [
    {
      name: "Reinforce",
      description: "Summon a 1/1 Silver Hand Recruit.",
      emoji: "🫡",
    },
    {
      name: "Aegis Armor",
      description: "Give a friendly minion Divine Shield.",
      emoji: "🛡️",
    },
    {
      name: "Holy Light",
      description: "Deal 1 damage to an enemy minion and restore 1 health to your hero.",
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

export const STANDARD_CLASS_CARDS: Record<string, string[]> = {
  Mage: [
    "b_murloc", "arc_shot", "fireball", "consecration", "flamestrike", "pyroblast", "meteor",
    "g_footman", "annoy_tron", "crocolisk", "c_yeti", "s_shieldmasta", "b_ogre",
    "s_slime", "heal_touch", "s_tank", "s_crusader", "w_rider", "s_belcher", "sunwalker", "lich_king",
    "m_firelord", "m_squire", "dr_boom", "pot_greed", "alexstrasza", "m_champion", "mind_control"
  ],
  Priest: [
    "s_slime", "heal_touch", "g_footman", "annoy_tron", "crocolisk", "c_yeti", "s_shieldmasta", "b_ogre",
    "b_murloc", "arc_shot", "fireball", "flamestrike", "mind_control", "sylvanas",
    "s_tank", "s_crusader", "w_rider", "s_belcher", "sunwalker", "lich_king", "deathwing", "pyroblast",
    "m_firelord", "m_squire", "dr_boom", "pot_greed", "alexstrasza", "m_champion"
  ],
  Hunter: [
    "b_murloc", "arc_shot", "b_warrior", "w_rider", "crocolisk", "c_yeti", "s_shieldmasta", "b_ogre", "meteor",
    "g_footman", "s_slime", "annoy_tron", "s_tank", "s_crusader", "s_belcher", "sunwalker", "lich_king",
    "m_firelord", "m_squire", "dr_boom", "pot_greed", "alexstrasza", "m_champion", "ragnaros"
  ],
  Paladin: [
    "g_footman", "annoy_tron", "s_crusader", "sunwalker", "consecration", "lich_king", "sylvanas",
    "s_slime", "crocolisk", "c_yeti", "s_shieldmasta", "b_ogre", "b_murloc", "heal_touch", "s_tank", "w_rider", "s_belcher",
    "m_firelord", "m_squire", "dr_boom", "pot_greed", "alexstrasza", "m_champion", "ragnaros"
  ]
};
