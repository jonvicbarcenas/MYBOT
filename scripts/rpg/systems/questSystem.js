// Define available quests
const QUESTS = {
  KILL_SLIMES: {
    id: "kill_slimes",
    name: "Slime Slayer",
    description: "Defeat 3 Slimes.",
    type: "kill_monster",
    target: "Slime",
    count: 3,
    reward: {
      xp: 50,
      gold: 20
    }
  }
  // Add more quests here later
};

const showQuests = ({ message, senderID, lang, playerData }) => {
  // Assuming playerData exists and has a 'quests' property like { active: [], completed: [] }
  if (!playerData) {
    return message.reply(lang("noCharacter")); // Need to check if player exists
  }

  let response = "📜 Available Quests:\n";
  let availableCount = 0;
  for (const questId in QUESTS) {
    const quest = QUESTS[questId];
    // Check if player has already completed or is active on this quest
    const isActive = playerData.quests && playerData.quests.active.some(q => q.id === quest.id);
    const isCompleted = playerData.quests && playerData.quests.completed.some(q => q.id === quest.id);

    if (!isActive && !isCompleted) {
      response += `\nID: ${quest.id}\nName: ${quest.name}\nDescription: ${quest.description}\nReward: ${quest.reward.xp} XP, ${quest.reward.gold} Gold\n`;
      availableCount++;
    }
  }

  if (availableCount === 0) {
    response += "No new quests available.\n";
  }

  response += "\nActive Quests:\n";
  if (playerData.quests && playerData.quests.active.length > 0) {
    playerData.quests.active.forEach(activeQuest => {
      const questDef = QUESTS[activeQuest.id];
      if (questDef) {
        response += `\nName: ${questDef.name}\nProgress: ${activeQuest.progress}/${questDef.count}\n`;
      }
    });
  } else {
    response += "No active quests.\n";
  }

  message.reply(response);
};

const acceptQuest = ({ message, senderID, args, lang, playerData, saveRPGData }) => {
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }

  const questId = args[1]?.toUpperCase();
  const questToAccept = QUESTS[questId];

  if (!questToAccept) {
    return message.reply(lang("invalidQuestId")); // Need to add this lang string
  }

  // Check if already active or completed
  const isActive = playerData.quests && playerData.quests.active.some(q => q.id === questId);
  const isCompleted = playerData.quests && playerData.quests.completed.some(q => q.id === questId);

  if (isActive) {
    return message.reply(lang("questAlreadyActive")); // Need to add this lang string
  }

  if (isCompleted) {
    return message.reply(lang("questAlreadyCompleted")); // Need to add this lang string
  }

  // Initialize quests array if it doesn't exist
  if (!playerData.quests) {
    playerData.quests = { active: [], completed: [] };
  }

  // Add quest to active quests
  playerData.quests.active.push({
    id: questId,
    progress: 0
  });

  saveRPGData(); // Assuming saveRPGData is available in this context

  message.reply(lang("questAccepted", questToAccept.name)); // Need to add this lang string
};

module.exports = {
  showQuests,
  acceptQuest
}; 