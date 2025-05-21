const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');
const axios = require("axios");
const { getTime, randomNumber, convertTime } = global.utils;

// Import modular components
const { initRPGData } = require('../rpg/utils/dataManager');
const { handleCharacterCreation, showCharacterProfile, resetCharacter, healCharacter } = require('../rpg/systems/characterSystem');
const { startBattle, handleBattleAction } = require('../rpg/systems/battleSystem');
const { showShop, buyItem, showInventory, equipItem, useItem } = require('../rpg/systems/shopSystem');
const { showRankings, resetRankings, showPlayerRank } = require('../rpg/systems/rankSystem');

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

const XP_TO_LEVEL_UP = level => level * 100;
const STAT_INCREASE_PER_LEVEL = { hp: 10, attack: 3, defense: 2, magic: 3, speed: 2 };

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
  { id: 10, name: "XP Scroll", cost: 1000, type: "consumable", effect: { xp: 200 }, description: "+200 XP" }
];

module.exports = {
  config: {
    name: "rpg",
    aliases: ["adventure"],
    version: "1.1",
    author: "JVB",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Play the RPG adventure game"
    },
    longDescription: {
      en: "Create a character, battle monsters, gain experience and loot to become stronger in this text-based RPG adventure game."
    },
    category: "games",
    guide: {
      en: "{pn}: Start or continue your RPG adventure\n{pn} create <class>: Create a new character (warrior, mage, rogue)\n{pn} profile: View your character's stats\n{pn} battle: Fight a monster\n{pn} heal: Restore your health (costs gold)\n{pn} shop: Buy items and equipment\n{pn} buy <id>: Purchase an item from the shop\n{pn} inventory: View your items\n{pn} equip <item>: Equip an item\n{pn} use <item>: Use a consumable item\n{pn} rank: View the top players\n{pn} quest: Manage your quests\n{pn} help: Show detailed game instructions\n{pn} reset: Delete your character"
    },
    envConfig: {
      baseReward: 20
    }
  },

  langs: {
    en: {
      // Character creation and management
      welcome: "🎮 Welcome to RPG Adventure! Type '{pn} create <class>' to begin your journey or '{pn} help' for instructions.",
      alreadyHasCharacter: "⚠️ You already have a character. Type '{pn} profile' to view it or '{pn} reset' to start over.",
      characterCreated: "✅ You created a new %1 named '%2'!\n\nBase stats:\nHP: %3\nAttack: %4\nDefense: %5\nMagic: %6\nSpeed: %7\n\nType '{pn}' to start playing!",
      invalidClass: "⚠️ Invalid class. Choose from: warrior, mage, or rogue.",
      characterReset: "✅ Your character has been reset. Create a new one with '{pn} create <class>'.",
      characterProfile: "👤 %1 - Level %2 %3\nHP: %4/%5\nAttack: %6\nDefense: %7\nMagic: %8\nSpeed: %9\nXP: %10/%11\nGold: %12",
      levelUp: "🎉 Level up! %1 reached level %2!\nStats increased:\nHP +%3\nAttack +%4\nDefense +%5\nMagic +%6\nSpeed +%7",
      noCharacter: "⚠️ You don't have a character yet. Create one with '{pn} create <class>'.",
      nameChangePrompt: "Enter your new character name (current name: %1):",
      nameChangeSuccess: "✅ Your character's name has been changed from '%1' to '%2'!",
      nameChangeCancelled: "❌ Name change cancelled. Your name remains '%1'.",
      
      // Combat
      battleStart: "⚔️ You encountered a %1!\nMonster HP: %2\nYour HP: %3/%4\n\nWhat would you like to do?\n1. Attack\n2. Use Skill\n3. Use Item\n4. Run",
      playerTurn: "Your turn! Choose your action:\n1. Attack\n2. Use Skill\n3. Use Item\n4. Run",
      playerAttack: "🗡️ You attacked the %1 for %2 damage!\nMonster HP: %3",
      monsterAttack: "🔴 The %1 attacks you for %2 damage!\nYour HP: %3/%4",
      battleWon: "🎉 You defeated the %1!\nRewards:\n+%2 XP\n+%3 Gold",
      battleLost: "☠️ You were defeated by the %1!\nYou lost %2 Gold.",
      runAway: "🏃 You ran away from the %1!",
      cantRun: "⚠️ You failed to escape! The %1 blocks your path!",
      cooldown: "⚠️ You're still recovering from your last battle. Wait %1 seconds.",
      notInBattle: "⚠️ You're not currently in battle.",
      skillList: "Your skills:\n%1",
      usedSkill: "✨ You used %1 for %2 damage!\nMonster HP: %3",
      noMana: "⚠️ Not enough mana to use this skill.",
      cantHealInBattle: "⚠️ You can't heal while in battle!",
      alreadyFullHealth: "⚠️ Your HP is already full!",
      invalidSkill: "⚠️ Please select a valid skill number.",
      
      // Shop and Items
      shopMenu: "🛒 Welcome to the Shop!\nGold: %1\n\n%2\n\nType '{pn} buy <item number>' to purchase.",
      healSuccess: "❤️ You restored %1 HP. Current HP: %2/%3\nGold: %4",
      notEnoughGold: "⚠️ Not enough gold! You need %1 more gold.",
      itemPurchased: "✅ You purchased %1 for %2 gold. Gold remaining: %3",
      itemEquipped: "🔶 You equipped %1! Stats updated.",
      alreadyHaveItem: "⚠️ You already have this item.",
      invalidItem: "⚠️ Invalid item selection.",
      inventory: "🎒 Inventory:\n%1",
      emptyInventory: "Your inventory is empty.",
      itemUsed: "✨ You used %1. %2",
      
      // Rankings
      charts: "🏆 | RPG Ranking:\n%1",
      pageInfo: "Page %1/%2",
      noScore: "⭕ | No players in the ranking yet.",
      resetRankSuccess: "✅ | Reset the ranking successfully.",
      noPermissionReset: "⚠️ | You do not have permission to reset the ranking.",
      notFoundUser: "⚠️ | Could not find user with id %1 in the ranking.",
      userRankInfo: "🏆 | Player: %1\nLevel: %2\nClass: %3\nGold: %4\nMonsters defeated: %5\nTotal play time: %6",
      
      // Help
      help: "📖 RPG Adventure Help:\n\n• '{pn} create <class>': Create a new character\n• '{pn} profile': View your stats\n• '{pn} battle': Fight a monster\n• '{pn} heal': Restore health (20 gold)\n• '{pn} shop': Buy items\n• '{pn} buy <id>': Purchase an item from the shop\n• '{pn} inventory': View your items\n• '{pn} equip <item>': Equip an item\n• '{pn} use <item>': Use a consumable\n• '{pn} rank': View leaderboard\n• '{pn} quest': Manage your quests\n• '{pn} reset': Delete your character\n\nShop has a Name Change service (ID: 11) for 50 gold!"
    }
  },

  onStart: async function({ message, event, args, commandName, getLang, globalData, usersData, role }) {
    const { threadID, senderID } = event;
    const prefix = global.GoatBot.config.prefix;
    const formattedPrefix = Array.isArray(prefix) ? prefix[0] : prefix;
    const lang = (text, ...values) => getLang(text, ...values).replace(/{pn}/g, formattedPrefix + commandName);
    
    // Initialize RPG data
    initRPGData();
    
    // Load player data
    const playerData = global.rpgData.players[senderID] || null;
    
    // Handle different commands
    if (args[0] === "create") {
      return handleCharacterCreation({ message, args, senderID, lang, usersData, globalData });
    }
    
    else if (args[0] === "profile" || args[0] === "info") {
      return showCharacterProfile({ message, senderID, lang });
    }
    
    else if (args[0] === "reset") {
      return resetCharacter({ message, senderID, lang });
    }
    
    else if (args[0] === "battle") {
      return startBattle({ message, senderID, lang, globalData });
    }
    
    else if (args[0] === "heal") {
      return healCharacter({ message, senderID, lang });
    }
    
    else if (args[0] === "shop") {
      return showShop({ message, senderID, lang });
    }
    
    else if (args[0] === "buy") {
      return buyItem({ message, args, senderID, lang });
    }
    
    else if (args[0] === "inventory" || args[0] === "inv") {
      return showInventory({ message, senderID, lang });
    }
    
    else if (args[0] === "equip") {
      return equipItem({ message, args, senderID, lang });
    }
    
    else if (args[0] === "use") {
      return useItem({ message, args, senderID, lang });
    }
    
    else if (args[0] === "rank") {
      if (args[1] === "reset") {
        return resetRankings({ message, senderID, lang, globalData, role });
      } else if (args[1] === "player" || args[1] === "user") {
        return showPlayerRank({ message, args, senderID, lang, globalData, usersData });
      } else {
        return showRankings({ message, args, lang, globalData, usersData });
      }
    }
    
    else if (args[0] === "help") {
      return message.reply(lang("help"));
    }
    
    // Default command - game status
    else {
      if (!playerData) {
        return message.reply(lang("welcome"));
      }
      
      return showCharacterProfile({ message, senderID, lang });
    }
  },
  
  onReply: async function({ message, Reply, event, getLang, globalData, usersData, envCommands, commandName }) {
    const { threadID, senderID, body } = event;
    const prefix = global.GoatBot.config.prefix;
    const formattedPrefix = Array.isArray(prefix) ? prefix[0] : prefix;
    const lang = (text, ...values) => getLang(text, ...values).replace(/{pn}/g, formattedPrefix + commandName);
    
    // Delete the onReply handler
    global.GoatBot.onReply.delete(Reply.messageID);
    
    // Handle name change
    if (Reply.type === "changeName") {
      const playerData = global.rpgData.players[senderID];
      if (!playerData) {
        return message.reply(lang("noCharacter"));
      }
      
      // Check if user canceled
      if (body.toLowerCase() === "cancel") {
        return message.reply(lang("nameChangeCancelled", playerData.name));
      }
      
      // Store old name for the message
      const oldName = playerData.name;
      
      // Update the name
      playerData.name = body.trim();
      saveRPGData();
      
      // Update rank data if needed
      if (typeof updateRankData === 'function') {
        updateRankData(globalData, senderID, playerData);
      }
      
      return message.reply(lang("nameChangeSuccess", oldName, playerData.name));
    }
    
    // Handle battle responses
    return handleBattleAction({ 
      message, 
      Reply, 
      event, 
      body, 
      senderID, 
      lang, 
      globalData 
    });
  }
};

// Helper functions
function saveRPGData() {
  try {
    // Ensure the data directory exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save the data
    const dataPath = path.join(dataDir, 'rpg_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(global.rpgData, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving RPG data:", err);
  }
}

async function updateRankData(globalData, playerID, playerData) {
  try {
    const rankRPG = await globalData.get("rankRPG", "data", []);
    const playerIndex = rankRPG.findIndex(item => item.id === playerID);
    
    const updatedPlayerData = {
      id: playerID,
      level: playerData.level,
      class: playerData.class,
      gold: playerData.gold,
      monstersDefeated: playerData.monstersDefeated,
      totalPlayTime: playerData.totalPlayTime
    };
    
    if (playerIndex !== -1) {
      rankRPG[playerIndex] = updatedPlayerData;
    } else {
      rankRPG.push(updatedPlayerData);
    }
    
    await globalData.set("rankRPG", rankRPG, "data");
  } catch (err) {
    console.error("Error updating RPG rank data:", err);
  }
} 