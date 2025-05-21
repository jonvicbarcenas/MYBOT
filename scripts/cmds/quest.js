const fs = require("fs");
const path = require("path");
const { getTime } = global.utils;

// Quest types and data
const QUESTS = [
  {
    id: 1,
    name: "Monster Hunter",
    description: "Defeat %count% monsters",
    type: "defeat",
    target: { count: 5 },
    reward: { gold: 100, xp: 50 },
    difficulty: "easy"
  },
  {
    id: 2,
    name: "Gold Collector",
    description: "Collect %count% gold",
    type: "collect_gold",
    target: { count: 200 },
    reward: { gold: 50, xp: 100 },
    difficulty: "easy"
  },
  {
    id: 3,
    name: "Battle Veteran",
    description: "Win %count% battles",
    type: "win_battles",
    target: { count: 10 },
    reward: { gold: 200, xp: 150 },
    difficulty: "medium"
  },
  {
    id: 4,
    name: "Elite Monster Hunter",
    description: "Defeat %count% high-level monsters",
    type: "defeat_elite",
    target: { count: 3, minLevel: 3 },
    reward: { gold: 300, xp: 200 },
    difficulty: "medium"
  },
  {
    id: 5,
    name: "Dragon Slayer",
    description: "Defeat a dragon",
    type: "defeat_specific",
    target: { monster: "Dragon", count: 1 },
    reward: { gold: 500, xp: 300 },
    difficulty: "hard"
  },
  {
    id: 6,
    name: "Big Spender",
    description: "Spend %count% gold in the shop",
    type: "spend_gold",
    target: { count: 500 },
    reward: { gold: 200, xp: 100 },
    difficulty: "medium"
  },
  {
    id: 7,
    name: "Weapon Collector",
    description: "Purchase %count% weapons from the shop",
    type: "buy_item_type",
    target: { type: "weapon", count: 2 },
    reward: { gold: 300, xp: 150 },
    difficulty: "medium"
  },
  {
    id: 8,
    name: "Prepared Adventurer",
    description: "Have at least 3 items in your inventory",
    type: "inventory_size",
    target: { count: 3 },
    reward: { gold: 150, xp: 100 },
    difficulty: "easy"
  }
];

module.exports = {
  config: {
    name: "quest",
    aliases: ["quests"],
    version: "1.0",
    author: "JVB",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "RPG quest system"
    },
    longDescription: {
      en: "Accept and complete quests to earn rewards in the RPG Adventure game."
    },
    category: "games",
    guide: {
      en: "{pn}: View your active quests\n{pn} list: See available quests\n{pn} accept <id>: Accept a quest\n{pn} abandon <id>: Abandon a quest\n{pn} complete <id>: Complete a quest if its requirements are met"
    }
  },

  langs: {
    en: {
      // General messages
      noCharacter: "⚠️ You don't have a character yet. Create one with 'rpg create <class>'.",
      questMenu: "📜 Quest Menu\n\nActive Quests: %1/%2\n%3",
      questList: "📜 Available Quests:\n\n%1",
      questInfo: "📜 Quest: %1\n📝 Description: %2\n💰 Rewards: %3 gold, %4 XP\n⚔️ Difficulty: %5",
      noQuests: "You have no active quests.",
      noQuestsAvailable: "There are no quests available at the moment.",
      
      // Quest actions
      questAccepted: "✅ Quest '%1' accepted! Type '{pn}' to view your active quests.",
      questAlreadyActive: "⚠️ You already have this quest active.",
      questMaxActive: "⚠️ You can only have %1 active quests at a time. Complete or abandon some quests first.",
      questInvalid: "⚠️ Invalid quest ID.",
      questAbandoned: "❌ Quest '%1' abandoned.",
      questNotActive: "⚠️ This quest is not in your active quests.",
      questCompleted: "🎉 Quest '%1' completed!\nRewards:\n+%2 Gold\n+%3 XP",
      questRequirementsNotMet: "⚠️ You haven't met the requirements for this quest yet.",
      
      // Progress
      questProgress: "Progress: %1/%2"
    }
  },

  onStart: async function({ message, event, args, commandName, getLang, usersData }) {
    const { senderID } = event;
    const prefix = global.GoatBot.config.prefix;
    const formattedPrefix = Array.isArray(prefix) ? prefix[0] : prefix;
    const lang = (text, ...values) => getLang(text, ...values).replace(/{pn}/g, formattedPrefix + commandName);
    
    // Load RPG data
    if (!global.rpgData) {
      try {
        const dataPath = path.join(__dirname, "../../data", 'rpg_data.json');
        if (fs.existsSync(dataPath)) {
          global.rpgData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } else {
          global.rpgData = { players: {}, battles: {} };
          saveRPGData();
        }
      } catch (err) {
        console.error("Error loading RPG data:", err);
        global.rpgData = { players: {}, battles: {} };
        saveRPGData();
      }
    }
    
    // Add quests structure if it doesn't exist
    if (!global.rpgData.quests) {
      global.rpgData.quests = {};
      saveRPGData();
    }
    
    // Load player data
    const playerData = global.rpgData.players[senderID];
    if (!playerData) {
      return message.reply(lang("noCharacter"));
    }
    
    // Initialize player's quest data if it doesn't exist
    if (!global.rpgData.quests[senderID]) {
      global.rpgData.quests[senderID] = {
        active: [],
        completed: [],
        stats: {
          monstersDefeated: 0,
          goldCollected: 0,
          battlesWon: 0,
          eliteDefeated: 0,
          specificDefeated: {},
          goldSpent: 0,
          itemsPurchased: {
            weapon: 0,
            armor: 0,
            consumable: 0
          }
        }
      };
      saveRPGData();
    }
    
    const questData = global.rpgData.quests[senderID];
    const MAX_ACTIVE_QUESTS = 3;
    
    // Quest list command
    if (args[0] === "list") {
      const availableQuests = QUESTS.filter(quest => 
        !questData.active.some(q => q.id === quest.id) && 
        !questData.completed.includes(quest.id)
      );
      
      if (availableQuests.length === 0) {
        return message.reply(lang("noQuestsAvailable"));
      }
      
      const questList = availableQuests.map(quest => {
        return `${quest.id}. ${quest.name} (${quest.difficulty})\n   - ${formatQuestDescription(quest)}\n   - Rewards: ${quest.reward.gold} gold, ${quest.reward.xp} XP`;
      }).join("\n\n");
      
      return message.reply(lang("questList", questList));
    }
    
    // Accept quest command
    else if (args[0] === "accept") {
      const questId = parseInt(args[1]);
      
      if (isNaN(questId)) {
        return message.reply(lang("questInvalid"));
      }
      
      const quest = QUESTS.find(q => q.id === questId);
      if (!quest) {
        return message.reply(lang("questInvalid"));
      }
      
      // Check if player already has this quest
      if (questData.active.some(q => q.id === questId)) {
        return message.reply(lang("questAlreadyActive"));
      }
      
      // Check if player already completed this quest
      if (questData.completed.includes(questId)) {
        return message.reply(lang("questAlreadyActive")); // Reuse message for simplicity
      }
      
      // Check max active quests
      if (questData.active.length >= MAX_ACTIVE_QUESTS) {
        return message.reply(lang("questMaxActive", MAX_ACTIVE_QUESTS));
      }
      
      // Add quest to active quests with progress tracking
      const newQuest = {
        id: quest.id,
        startedAt: getTime("unix"),
        progress: 0
      };
      
      questData.active.push(newQuest);
      saveRPGData();
      
      return message.reply(lang("questAccepted", quest.name));
    }
    
    // Abandon quest command
    else if (args[0] === "abandon") {
      const questId = parseInt(args[1]);
      
      if (isNaN(questId)) {
        return message.reply(lang("questInvalid"));
      }
      
      const questIndex = questData.active.findIndex(q => q.id === questId);
      if (questIndex === -1) {
        return message.reply(lang("questNotActive"));
      }
      
      const quest = QUESTS.find(q => q.id === questId);
      questData.active.splice(questIndex, 1);
      saveRPGData();
      
      return message.reply(lang("questAbandoned", quest.name));
    }
    
    // Complete quest command
    else if (args[0] === "complete") {
      const questId = parseInt(args[1]);
      
      if (isNaN(questId)) {
        return message.reply(lang("questInvalid"));
      }
      
      const activeQuestIndex = questData.active.findIndex(q => q.id === questId);
      if (activeQuestIndex === -1) {
        return message.reply(lang("questNotActive"));
      }
      
      const activeQuest = questData.active[activeQuestIndex];
      const questTemplate = QUESTS.find(q => q.id === questId);
      
      // Check if quest requirements are met
      let completed = false;
      
      switch (questTemplate.type) {
        case "defeat":
          completed = questData.stats.monstersDefeated >= questTemplate.target.count;
          break;
        case "collect_gold":
          completed = questData.stats.goldCollected >= questTemplate.target.count;
          break;
        case "win_battles":
          completed = questData.stats.battlesWon >= questTemplate.target.count;
          break;
        case "defeat_elite":
          completed = questData.stats.eliteDefeated >= questTemplate.target.count;
          break;
        case "defeat_specific":
          completed = questData.stats.specificDefeated[questTemplate.target.monster] >= questTemplate.target.count;
          break;
        case "spend_gold":
          completed = questData.stats.goldSpent >= questTemplate.target.count;
          break;
        case "buy_item_type":
          completed = questData.stats.itemsPurchased[questTemplate.target.type] >= questTemplate.target.count;
          break;
        case "inventory_size":
          const playerId = Object.keys(global.rpgData.quests).find(
            id => global.rpgData.quests[id].stats === questData.stats
          );
          if (playerId && global.rpgData.players[playerId] && global.rpgData.players[playerId].inventory) {
            completed = global.rpgData.players[playerId].inventory.length >= questTemplate.target.count;
          }
          break;
      }
      
      if (!completed) {
        const progress = getQuestProgress(questTemplate, questData.stats);
        const target = getQuestTarget(questTemplate);
        
        return message.reply(
          lang("questRequirementsNotMet") + "\n" +
          lang("questProgress", progress, target)
        );
      }
      
      // Complete quest and give rewards
      questData.active.splice(activeQuestIndex, 1);
      questData.completed.push(questId);
      
      // Add rewards to player
      playerData.gold += questTemplate.reward.gold;
      playerData.xp += questTemplate.reward.xp;
      
      saveRPGData();
      
      return message.reply(lang("questCompleted", 
        questTemplate.name,
        questTemplate.reward.gold,
        questTemplate.reward.xp
      ));
    }
    
    // Default command - show active quests
    else {
      if (questData.active.length === 0) {
        return message.reply(lang("noQuests"));
      }
      
      const activeQuestsText = questData.active.map(activeQuest => {
        const quest = QUESTS.find(q => q.id === activeQuest.id);
        const progress = getQuestProgress(quest, questData.stats);
        const target = getQuestTarget(quest);
        
        return `${quest.id}. ${quest.name}\n   - ${formatQuestDescription(quest)}\n   - ${lang("questProgress", progress, target)}`;
      }).join("\n\n");
      
      return message.reply(lang("questMenu", 
        questData.active.length,
        MAX_ACTIVE_QUESTS,
        activeQuestsText
      ));
    }
  },
  
  onReply: async function({ message, Reply, event }) {
    // For future quest dialog interactions
  }
};

// Helper functions
function saveRPGData() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dataPath = path.join(dataDir, 'rpg_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(global.rpgData, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving RPG data:", err);
  }
}

function formatQuestDescription(quest) {
  let description = quest.description;
  
  if (quest.target.count) {
    description = description.replace("%count%", quest.target.count);
  }
  
  return description;
}

function getQuestProgress(quest, stats) {
  switch (quest.type) {
    case "defeat":
      return stats.monstersDefeated;
    case "collect_gold":
      return stats.goldCollected;
    case "win_battles":
      return stats.battlesWon;
    case "defeat_elite":
      return stats.eliteDefeated;
    case "defeat_specific":
      return stats.specificDefeated[quest.target.monster] || 0;
    case "spend_gold":
      return stats.goldSpent;
    case "buy_item_type":
      return stats.itemsPurchased[quest.target.type];
    case "inventory_size":
      const playerId = Object.keys(global.rpgData.quests).find(
        id => global.rpgData.quests[id].stats === stats
      );
      if (playerId && global.rpgData.players[playerId] && global.rpgData.players[playerId].inventory) {
        return global.rpgData.players[playerId].inventory.length;
      }
      return 0;
    default:
      return 0;
  }
}

function getQuestTarget(quest) {
  return quest.target.count;
}

// Hook into battle results to update quest progress
global.updateQuestProgress = function(playerId, type, data) {
  if (!global.rpgData || !global.rpgData.quests || !global.rpgData.quests[playerId]) {
    return;
  }
  
  const questData = global.rpgData.quests[playerId];
  
  switch (type) {
    case "monster_defeated":
      questData.stats.monstersDefeated++;
      
      // Check if it's an elite monster
      if (data.level && data.level >= 3) {
        questData.stats.eliteDefeated++;
      }
      
      // Track specific monster type
      if (data.name) {
        if (!questData.stats.specificDefeated[data.name]) {
          questData.stats.specificDefeated[data.name] = 0;
        }
        questData.stats.specificDefeated[data.name]++;
      }
      break;
      
    case "gold_collected":
      questData.stats.goldCollected += data.amount;
      break;
      
    case "battle_won":
      questData.stats.battlesWon++;
      break;

    case "gold_spent":
      questData.stats.goldSpent += data.amount;
      break;
      
    case "item_purchased":
      if (data.itemType && questData.stats.itemsPurchased[data.itemType] !== undefined) {
        questData.stats.itemsPurchased[data.itemType]++;
      }
      break;
  }
  
  saveRPGData();
}; 