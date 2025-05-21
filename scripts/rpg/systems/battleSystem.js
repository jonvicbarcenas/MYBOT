const { getTime } = global.utils;
const { saveRPGData, updateRankData } = require('../utils/dataManager');
const { MONSTERS, XP_TO_LEVEL_UP, STAT_INCREASE_PER_LEVEL } = require('../data/gameData');

function startBattle({ message, senderID, lang, globalData }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  // Check if player is already in battle
  if (global.rpgData.battles[senderID]) {
    return message.reply(lang("playerTurn"));
  }
  
  // Check cooldown
  const now = getTime("unix");
  if (playerData.lastBattle && now - playerData.lastBattle < 30) {
    const remaining = 30 - (now - playerData.lastBattle);
    return message.reply(lang("cooldown", remaining));
  }
  
  // Generate a monster based on player level
  const monsterTier = Math.min(Math.floor(playerData.level / 3), MONSTERS.length - 1);
  const monster = { ...MONSTERS[monsterTier] };
  
  // Scale monster based on player level
  const levelFactor = 1 + (playerData.level - 1) * 0.1;
  monster.hp = Math.floor(monster.hp * levelFactor);
  monster.attack = Math.floor(monster.attack * levelFactor);
  monster.defense = Math.floor(monster.defense * levelFactor);
  monster.xp = Math.floor(monster.xp * levelFactor);
  monster.gold = Math.floor(monster.gold * levelFactor);
  
  // Create battle
  global.rpgData.battles[senderID] = {
    monster,
    startTime: now
  };
  
  return message.reply(
    lang("battleStart", 
      monster.name,
      monster.hp,
      playerData.hp,
      playerData.maxHp
    ),
    (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "rpg",
        messageID: info.messageID,
        author: senderID
      });
    }
  );
}

async function handleBattleAction({ message, Reply, event, body, senderID, lang, globalData }) {
  if (senderID !== Reply.author) {
    return;
  }
  
  const playerData = global.rpgData.players[senderID];
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  const battle = global.rpgData.battles[senderID];
  if (!battle) {
    return message.reply(lang("notInBattle"));
  }
  
  // Check if this is a skill selection reply
  if (Reply.type === "skill") {
    await handleSkillSelection({ message, Reply, body, playerData, battle, senderID, lang, globalData });
    return;
  }
  
  const choice = parseInt(body);
  
  // Process player's battle choice
  switch (choice) {
    case 1: // Basic attack
      await handleBasicAttack({ message, playerData, battle, senderID, lang, globalData });
      break;
      
    case 2: // Use skill
      // Show skills list
      const skillsList = playerData.skills.map((skill, index) => `${index + 1}. ${skill.name} (DMG: ${skill.damage}, Cost: ${skill.cost})`).join("\n");
      message.reply(lang("skillList", skillsList), (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "rpg",
          messageID: info.messageID,
          author: senderID,
          type: "skill"
        });
      });
      break;
      
    case 3: // Use item
      message.reply("Item system coming soon! For now, choose another option.", (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "rpg",
          messageID: info.messageID,
          author: senderID
        });
      });
      break;
      
    case 4: // Run away
      handleRunAway({ message, playerData, battle, senderID, lang });
      break;
      
    default:
      message.reply(lang("playerTurn"), (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "rpg",
          messageID: info.messageID,
          author: senderID
        });
      });
      break;
  }
}

async function handleBasicAttack({ message, playerData, battle, senderID, lang, globalData }) {
  // Calculate damage
  const damageToMonster = Math.max(1, playerData.attack - Math.floor(battle.monster.defense * 0.5));
  battle.monster.hp -= damageToMonster;
  
  // Send attack message
  await message.reply(lang("playerAttack", battle.monster.name, damageToMonster, battle.monster.hp));
  
  // Check if monster is defeated
  if (battle.monster.hp <= 0) {
    await handleBattleWon({ message, playerData, battle, senderID, lang, globalData });
    return;
  }
  
  // Monster's turn
  setTimeout(async () => {
    await handleMonsterTurn({ message, playerData, battle, senderID, lang, globalData });
  }, 1000);
}

async function handleSkillSelection({ message, Reply, body, playerData, battle, senderID, lang, globalData }) {
  const skillIndex = parseInt(body) - 1;
  
  // Validate skill selection
  if (isNaN(skillIndex) || skillIndex < 0 || skillIndex >= playerData.skills.length) {
    return message.reply(lang("invalidSkill"), (err, info) => {
      // Give player another chance to select a skill
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "rpg",
        messageID: info.messageID,
        author: senderID,
        type: "skill"
      });
    });
  }
  
  const selectedSkill = playerData.skills[skillIndex];
  
  // Calculate damage based on skill and player stats
  let damageToMonster;
  if (selectedSkill.name === "Fireball") {
    // Magic-based attack
    damageToMonster = Math.max(1, selectedSkill.damage + Math.floor(playerData.magic * 0.5) - Math.floor(battle.monster.defense * 0.3));
  } else {
    // Physical-based attack
    damageToMonster = Math.max(1, selectedSkill.damage + Math.floor(playerData.attack * 0.3) - Math.floor(battle.monster.defense * 0.5));
  }
  
  // Add critical hit chance for Rogue's Backstab
  if (selectedSkill.name === "Backstab") {
    const critChance = 0.3; // 30% chance
    if (Math.random() < critChance) {
      damageToMonster = Math.floor(damageToMonster * 1.5);
      damageToMonster = `${damageToMonster} (Critical Hit!)`;
    }
  }
  
  // Apply damage to monster
  battle.monster.hp -= parseInt(damageToMonster);
  
  // Send skill use message
  await message.reply(lang("usedSkill", selectedSkill.name, damageToMonster, battle.monster.hp));
  
  // Check if monster is defeated
  if (battle.monster.hp <= 0) {
    await handleBattleWon({ message, playerData, battle, senderID, lang, globalData });
    return;
  }
  
  // Monster's turn
  setTimeout(async () => {
    await handleMonsterTurn({ message, playerData, battle, senderID, lang, globalData });
  }, 1000);
}

async function handleMonsterTurn({ message, playerData, battle, senderID, lang, globalData }) {
  const damageToPlayer = Math.max(1, battle.monster.attack - Math.floor(playerData.defense * 0.7));
  playerData.hp -= damageToPlayer;
  
  await message.reply(lang("monsterAttack", battle.monster.name, damageToPlayer, playerData.hp, playerData.maxHp));
  
  // Check if player is defeated
  if (playerData.hp <= 0) {
    await handleBattleLost({ message, playerData, battle, senderID, lang });
    return;
  }
  
  // Continue battle
  message.reply(lang("playerTurn"), (err, info) => {
    global.GoatBot.onReply.set(info.messageID, {
      commandName: "rpg",
      messageID: info.messageID,
      author: senderID
    });
  });
}

async function handleBattleWon({ message, playerData, battle, senderID, lang, globalData }) {
  // Battle won
  delete global.rpgData.battles[senderID];
  
  // Give rewards
  playerData.xp += battle.monster.xp;
  playerData.gold += battle.monster.gold;
  playerData.monstersDefeated += 1;
  playerData.lastBattle = getTime("unix");
  
  // Update play time
  playerData.totalPlayTime += (getTime("unix") - battle.startTime);
  
  // Update quest progress
  if (typeof global.updateQuestProgress === 'function') {
    global.updateQuestProgress(senderID, "monster_defeated", { 
      name: battle.monster.name,
      level: Math.floor(playerData.level / 3)
    });
    global.updateQuestProgress(senderID, "gold_collected", { 
      amount: battle.monster.gold 
    });
    global.updateQuestProgress(senderID, "battle_won", {});
  }
  
  // Check for level up
  if (playerData.xp >= XP_TO_LEVEL_UP(playerData.level)) {
    await handleLevelUp({ message, playerData, battle, senderID, lang, globalData });
    return;
  }
  
  // Update ranking data
  await updateRankData(globalData, senderID, playerData);
  
  saveRPGData();
  return message.reply(lang("battleWon", battle.monster.name, battle.monster.xp, battle.monster.gold));
}

async function handleLevelUp({ message, playerData, battle, senderID, lang, globalData }) {
  playerData.level += 1;
  playerData.xp -= XP_TO_LEVEL_UP(playerData.level - 1);
  
  // Increase stats
  const hpIncrease = STAT_INCREASE_PER_LEVEL.hp;
  const attackIncrease = STAT_INCREASE_PER_LEVEL.attack;
  const defenseIncrease = STAT_INCREASE_PER_LEVEL.defense;
  const magicIncrease = STAT_INCREASE_PER_LEVEL.magic;
  const speedIncrease = STAT_INCREASE_PER_LEVEL.speed;
  
  playerData.maxHp += hpIncrease;
  playerData.hp = playerData.maxHp;
  playerData.attack += attackIncrease;
  playerData.defense += defenseIncrease;
  playerData.magic += magicIncrease;
  playerData.speed += speedIncrease;
  
  // Update ranking data
  await updateRankData(globalData, senderID, playerData);
  
  saveRPGData();
  
  return message.reply(
    lang("battleWon", battle.monster.name, battle.monster.xp, battle.monster.gold) + 
    "\n\n" + 
    lang("levelUp", playerData.name, playerData.level, hpIncrease, attackIncrease, defenseIncrease, magicIncrease, speedIncrease)
  );
}

async function handleBattleLost({ message, playerData, battle, senderID, lang }) {
  playerData.hp = Math.max(1, Math.floor(playerData.maxHp * 0.1)); // Restore 10% HP
  const goldLoss = Math.min(playerData.gold, Math.floor(playerData.gold * 0.1)); // Lose 10% gold
  playerData.gold -= goldLoss;
  playerData.lastBattle = getTime("unix");
  
  // Update play time
  playerData.totalPlayTime += (getTime("unix") - battle.startTime);
  
  delete global.rpgData.battles[senderID];
  
  saveRPGData();
  return message.reply(lang("battleLost", battle.monster.name, goldLoss));
}

function handleRunAway({ message, playerData, battle, senderID, lang }) {
  // Chance to run based on speed
  const runChance = 0.3 + (playerData.speed / 100);
  if (Math.random() < runChance) {
    delete global.rpgData.battles[senderID];
    playerData.lastBattle = getTime("unix");
    saveRPGData();
    return message.reply(lang("runAway", battle.monster.name));
  } else {
    message.reply(lang("cantRun", battle.monster.name));
    
    // Monster gets a free attack
    setTimeout(async () => {
      const damageToPlayer = Math.max(1, battle.monster.attack - Math.floor(playerData.defense * 0.7));
      playerData.hp -= damageToPlayer;
      
      await message.reply(lang("monsterAttack", battle.monster.name, damageToPlayer, playerData.hp, playerData.maxHp));
      
      // Check if player is defeated
      if (playerData.hp <= 0) {
        playerData.hp = Math.max(1, Math.floor(playerData.maxHp * 0.1)); // Restore 10% HP
        const goldLoss = Math.min(playerData.gold, Math.floor(playerData.gold * 0.1)); // Lose 10% gold
        playerData.gold -= goldLoss;
        playerData.lastBattle = getTime("unix");
        
        delete global.rpgData.battles[senderID];
        saveRPGData();
        return message.reply(lang("battleLost", battle.monster.name, goldLoss));
      }
      
      // Continue battle
      message.reply(lang("playerTurn"), (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "rpg",
          messageID: info.messageID,
          author: senderID
        });
      });
    }, 1000);
  }
}

module.exports = {
  startBattle,
  handleBattleAction
}; 