const fs = require("fs");
const path = require("path");

// Initialize RPG database
function initRPGData() {
  if (global.rpgData) return;

  try {
    const dataPath = path.join(__dirname, "../../../data", 'rpg_data.json');
    if (fs.existsSync(dataPath)) {
      global.rpgData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } else {
      global.rpgData = { players: {}, battles: {}, quests: {} };
      saveRPGData();
    }
  } catch (err) {
    console.error("Error loading RPG data:", err);
    global.rpgData = { players: {}, battles: {}, quests: {} };
    saveRPGData();
  }
}

function saveRPGData() {
  try {
    const dataDir = path.join(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
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

module.exports = {
  initRPGData,
  saveRPGData,
  updateRankData
}; 