// Game data structures
const CLASSES = {
  WARRIOR: {
    name: "Warrior",
    description: "Strong physical attacker with high HP",
    baseStats: { hp: 100, attack: 20, defense: 15, magic: 5, speed: 10 },
    skills: [
      { name: "Slash", damage: 15, cost: 0, description: "Basic attack" },
      { name: "Heavy Strike", damage: 25, cost: 10, description: "Powerful physical attack" }
    ]
  },
  MAGE: {
    name: "Mage",
    description: "Powerful magical abilities but lower HP",
    baseStats: { hp: 70, attack: 5, defense: 8, magic: 25, speed: 12 },
    skills: [
      { name: "Staff Hit", damage: 8, cost: 0, description: "Basic attack" },
      { name: "Fireball", damage: 30, cost: 15, description: "Powerful magical attack" }
    ]
  },
  ROGUE: {
    name: "Rogue",
    description: "Fast attacker with critical hit chances",
    baseStats: { hp: 80, attack: 15, defense: 10, magic: 8, speed: 20 },
    skills: [
      { name: "Stab", damage: 12, cost: 0, description: "Basic attack" },
      { name: "Backstab", damage: 22, cost: 10, description: "Attack with high critical chance" }
    ]
  }
};

const MONSTERS = [
  { name: "Slime", hp: 30, attack: 8, defense: 5, xp: 10, gold: 5 },
  { name: "Goblin", hp: 45, attack: 12, defense: 8, xp: 15, gold: 10 },
  { name: "Wolf", hp: 60, attack: 15, defense: 10, xp: 20, gold: 15 },
  { name: "Orc", hp: 80, attack: 20, defense: 15, xp: 30, gold: 25 },
  { name: "Troll", hp: 100, attack: 25, defense: 20, xp: 40, gold: 35 },
  { name: "Dragon", hp: 200, attack: 40, defense: 30, xp: 100, gold: 100 }
];

// Shop items
const SHOP_ITEMS = [
  { id: 1, name: "Health Potion", cost: 30, type: "consumable", effect: { hp: 50 }, description: "Restores 50 HP" },
  { id: 2, name: "Super Health Potion", cost: 80, type: "consumable", effect: { hp: 150 }, description: "Restores 150 HP" },
  { id: 3, name: "Iron Sword", cost: 200, type: "weapon", effect: { attack: 10 }, description: "+10 Attack" },
  { id: 4, name: "Steel Sword", cost: 500, type: "weapon", effect: { attack: 25 }, description: "+25 Attack" },
  { id: 5, name: "Leather Armor", cost: 150, type: "armor", effect: { defense: 8 }, description: "+8 Defense" },
  { id: 6, name: "Chain Mail", cost: 400, type: "armor", effect: { defense: 20 }, description: "+20 Defense" },
  { id: 7, name: "Magic Staff", cost: 300, type: "weapon", effect: { magic: 15 }, description: "+15 Magic" },
  { id: 8, name: "Wizard Robe", cost: 250, type: "armor", effect: { magic: 12 }, description: "+12 Magic" },
  { id: 9, name: "Swift Boots", cost: 200, type: "armor", effect: { speed: 10 }, description: "+10 Speed" },
  { id: 10, name: "XP Scroll", cost: 1000, type: "consumable", effect: { xp: 200 }, description: "+200 XP" },
  { id: 11, name: "Name Change", cost: 50, type: "service", effect: { changeName: true }, description: "Change your character's name" }
];

const XP_TO_LEVEL_UP = level => level * 100;
const STAT_INCREASE_PER_LEVEL = { hp: 10, attack: 3, defense: 2, magic: 3, speed: 2 };

module.exports = {
  CLASSES,
  MONSTERS,
  SHOP_ITEMS,
  XP_TO_LEVEL_UP,
  STAT_INCREASE_PER_LEVEL
}; 