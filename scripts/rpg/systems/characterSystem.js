const { getTime } = global.utils;
const { saveRPGData, updateRankData } = require('../utils/dataManager');
const { CLASSES, XP_TO_LEVEL_UP } = require('../data/gameData');

async function handleCharacterCreation({ message, args, senderID, lang, usersData, globalData }) {
  // Check if player already has a character
  if (global.rpgData.players[senderID]) {
    return message.reply(lang("alreadyHasCharacter"));
  }
  
  const chosenClass = (args[1] || "").toLowerCase();
  let classData;
  
  switch (chosenClass) {
    case "warrior":
      classData = CLASSES.WARRIOR;
      break;
    case "mage":
      classData = CLASSES.MAGE;
      break;
    case "rogue":
      classData = CLASSES.ROGUE;
      break;
    default:
      return message.reply(lang("invalidClass"));
  }
  
  // Get user name from database
  const userName = await usersData.getName(senderID);
  
  // Create new character
  const newCharacter = {
    name: userName,
    class: classData.name,
    level: 1,
    xp: 0,
    gold: 50,
    monstersDefeated: 0,
    hp: classData.baseStats.hp,
    maxHp: classData.baseStats.hp,
    attack: classData.baseStats.attack,
    defense: classData.baseStats.defense,
    magic: classData.baseStats.magic,
    speed: classData.baseStats.speed,
    skills: classData.skills,
    inventory: [],
    timeCreated: getTime("unix"),
    totalPlayTime: 0
  };
  
  global.rpgData.players[senderID] = newCharacter;
  saveRPGData();
  
  // Update ranking
  const rankRPG = await globalData.get("rankRPG", "data", []);
  rankRPG.push({
    id: senderID,
    level: 1,
    class: classData.name,
    gold: 50,
    monstersDefeated: 0,
    totalPlayTime: 0
  });
  await globalData.set("rankRPG", rankRPG, "data");
  
  return message.reply(lang("characterCreated", 
    classData.name,
    userName,
    classData.baseStats.hp,
    classData.baseStats.attack,
    classData.baseStats.defense,
    classData.baseStats.magic,
    classData.baseStats.speed
  ));
}

function showCharacterProfile({ message, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  return message.reply(lang("characterProfile", 
    playerData.name,
    playerData.level,
    playerData.class,
    playerData.hp,
    playerData.maxHp,
    playerData.attack,
    playerData.defense,
    playerData.magic,
    playerData.speed,
    playerData.xp,
    XP_TO_LEVEL_UP(playerData.level),
    playerData.gold
  ));
}

function resetCharacter({ message, senderID, lang }) {
  if (!global.rpgData.players[senderID]) {
    return message.reply(lang("noCharacter"));
  }
  
  delete global.rpgData.players[senderID];
  saveRPGData();
  
  return message.reply(lang("characterReset"));
}

function healCharacter({ message, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  // Check if player is in battle
  if (global.rpgData.battles[senderID]) {
    return message.reply(lang("cantHealInBattle"));
  }
  
  const healCost = 20;
  if (playerData.gold < healCost) {
    return message.reply(lang("notEnoughGold", healCost - playerData.gold));
  }
  
  if (playerData.hp >= playerData.maxHp) {
    return message.reply(lang("alreadyFullHealth"));
  }
  
  // Heal player
  const healAmount = Math.floor(playerData.maxHp * 0.5);
  playerData.hp = Math.min(playerData.maxHp, playerData.hp + healAmount);
  playerData.gold -= healCost;
  
  saveRPGData();
  
  return message.reply(lang("healSuccess", healAmount, playerData.hp, playerData.maxHp, playerData.gold));
}

module.exports = {
  handleCharacterCreation,
  showCharacterProfile,
  resetCharacter,
  healCharacter
}; 