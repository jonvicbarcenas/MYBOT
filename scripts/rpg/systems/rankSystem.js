const { saveRPGData, updateRankData } = require('../utils/dataManager');

async function showRankings({ message, args, lang, globalData, usersData }) {
  const rankRPG = await globalData.get("rankRPG", "data", []);
  if (!rankRPG.length)
    return message.reply(lang("noScore"));

  const page = parseInt(args[1]) || 1;
  const maxUserOnePage = 15;

  let rankRPGHandle = await Promise.all(rankRPG.slice((page - 1) * maxUserOnePage, page * maxUserOnePage).map(async item => {
    const userName = await usersData.getName(item.id);
    return {
      ...item,
      userName
    };
  }));

  rankRPGHandle = rankRPGHandle.sort((a, b) => b.level - a.level || b.gold - a.gold);
  const medals = ["🥇", "🥈", "🥉"];
  const rankRPGText = rankRPGHandle.map((item, index) => {
    const medal = index < 3 ? medals[index] : `${index + 1}.`;
    return `${medal} ${item.userName} - Lvl ${item.level} ${item.class} - ${item.gold} gold`;
  }).join("\n");

  return message.reply(lang("charts", rankRPGText || lang("noScore")) + "\n" + lang("pageInfo", page, Math.ceil(rankRPG.length / maxUserOnePage)));
}

async function resetRankings({ message, senderID, lang, globalData, role }) {
  // Check if user has admin permissions
  if (role < 1) {
    return message.reply(lang("noPermissionReset"));
  }
  
  await globalData.set("rankRPG", [], "data");
  return message.reply(lang("resetRankSuccess"));
}

async function showPlayerRank({ message, args, senderID, lang, globalData, usersData }) {
  const targetId = args[1] || senderID;
  
  const rankRPG = await globalData.get("rankRPG", "data", []);
  const playerRank = rankRPG.find(item => item.id === targetId);
  
  if (!playerRank) {
    return message.reply(lang("notFoundUser", targetId));
  }
  
  const userName = await usersData.getName(targetId);
  const formattedPlayTime = formatPlayTime(playerRank.totalPlayTime);
  
  return message.reply(lang("userRankInfo",
    userName,
    playerRank.level,
    playerRank.class,
    playerRank.gold,
    playerRank.monstersDefeated,
    formattedPlayTime
  ));
}

// Helper function to format playtime in seconds to human-readable format
function formatPlayTime(seconds) {
  if (!seconds) return "0 minutes";
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = [];
  if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return result.length ? result.join(', ') : "less than a minute";
}

module.exports = {
  showRankings,
  resetRankings,
  showPlayerRank
}; 