const fs = require('fs');
const moment = require('moment-timezone');
const path = require('path');

// File paths
const BANNED_TIME_FILE = path.join(__dirname, 'bannedtime.json');
const SWEAR_WORDS_FILE = path.join(__dirname, 'swearWords.json');
const SWEAR_STATS_FILE = path.join(__dirname, 'swearStats.json');
const THREAD_SETTINGS_FILE = path.join(__dirname, 'swearSettings.json');

// Funny responses for swear detection
const SWEAR_RESPONSES = [
  "🧼 Wash your mouth! That language is not welcome here.",
  "🚫 Your words need a time-out. Please keep it clean.",
  "👀 I heard that! Let's keep this chat family-friendly.",
  "🔍 Swear word detected! Try expressing yourself without those words.",
  "🌈 How about using nicer words? Your vocabulary can do better!",
  "⚠️ Swear jar +1! Your digital swear jar is filling up.",
  "🤐 Oops! Maybe rephrase that in a more friendly way?",
  "🙊 My sensors detected inappropriate language! Please be mindful.",
  "📝 That word is on my no-no list. Let's keep it clean!",
  "🧠 Creative people use better words than that!"
];

// Clean alternatives for common swear words
const CLEAN_ALTERNATIVES = {
  "bobo": ["smart cookie", "learning individual", "knowledge seeker"],
  "tanga": ["brilliant mind", "thinker", "wise one"],
  "gago": ["respectable person", "fine individual", "good citizen"],
  "puta": ["wonderful person", "delightful human", "respected individual"],
  "default": ["fluffy bunny", "sunshine", "rainbow", "butterfly", "unicorn", "marshmallow"]
};

function validateJSON(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    JSON.parse(fileContent); // Just to validate
  } catch (err) {
    console.error(`Invalid JSON in ${filePath}:`, err);
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

function loadSwearWords() {
  try {
    validateJSON(SWEAR_WORDS_FILE, { words: [] });
    const data = fs.readFileSync(SWEAR_WORDS_FILE, 'utf8');
    return JSON.parse(data).words;
  } catch (err) {
    console.error('Error loading swear words:', err);
    return [];
  }
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getCleanAlternative(swearWord) {
  const alternatives = CLEAN_ALTERNATIVES[swearWord] || CLEAN_ALTERNATIVES.default;
  return getRandomElement(alternatives);
}

function getThreadSettings(threadID) {
  try {
    validateJSON(THREAD_SETTINGS_FILE, {});
    const data = fs.readFileSync(THREAD_SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    return settings[threadID] || {
      enabled: true,
      warningCount: 3,
      initialBanTime: 300, // 5 minutes in seconds
      banMultiplier: 2,
      reactToSwears: true,
      deleteMessages: false,
      customResponses: []
    };
  } catch (err) {
    console.error('Error loading thread settings:', err);
    return {
      enabled: true,
      warningCount: 3,
      initialBanTime: 300,
      banMultiplier: 2,
      reactToSwears: true,
      deleteMessages: false,
      customResponses: []
    };
  }
}

function saveThreadSettings(threadID, settings) {
  try {
    validateJSON(THREAD_SETTINGS_FILE, {});
    const data = fs.readFileSync(THREAD_SETTINGS_FILE, 'utf8');
    const allSettings = JSON.parse(data);
    allSettings[threadID] = settings;
    fs.writeFileSync(THREAD_SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving thread settings:', err);
  }
}

function updateSwearStats(userID, userName, threadID, word) {
  try {
    validateJSON(SWEAR_STATS_FILE, {});
    const data = fs.readFileSync(SWEAR_STATS_FILE, 'utf8');
    const stats = JSON.parse(data);
    
    if (!stats[threadID]) {
      stats[threadID] = { users: {}, totalCount: 0 };
    }
    
    if (!stats[threadID].users[userID]) {
      stats[threadID].users[userID] = {
        name: userName,
        count: 0,
        words: {}
      };
    }
    
    stats[threadID].users[userID].count++;
    stats[threadID].totalCount++;
    
    if (word) {
      stats[threadID].users[userID].words[word] = 
        (stats[threadID].users[userID].words[word] || 0) + 1;
    }
    
    fs.writeFileSync(SWEAR_STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (err) {
    console.error('Error updating swear stats:', err);
  }
}

function addToBannedUsers(userID, name, threadID) {
  try {
    validateJSON(BANNED_TIME_FILE, []);
    
    const data = fs.readFileSync(BANNED_TIME_FILE, 'utf8');
    let bannedUsers = JSON.parse(data);
    
    const threadSettings = getThreadSettings(threadID);
    const existingUser = bannedUsers.find(user => user.id === userID && user.threadID === threadID);
    
    if (existingUser) {
      existingUser.swearCount++;
      
      if (existingUser.swearCount >= threadSettings.warningCount) {
        existingUser.status = true;
        
        // Progressive ban system - each ban gets longer
        const banCount = existingUser.banCount || 1;
        const banTimeInSeconds = threadSettings.initialBanTime * Math.pow(threadSettings.banMultiplier, banCount - 1);
        
        existingUser.countdown = Date.now() + (banTimeInSeconds * 1000);
        existingUser.banCount = banCount + 1;
      }
    } else {
      bannedUsers.push({
        id: userID,
        name,
        threadID,
        countdown: Date.now() + (threadSettings.initialBanTime * 1000),
        swearCount: 1,
        banCount: 1,
        status: false
      });
    }
    
    fs.writeFileSync(BANNED_TIME_FILE, JSON.stringify(bannedUsers, null, 2), 'utf8');
    return existingUser || bannedUsers[bannedUsers.length - 1];
  } catch (err) {
    console.error('Error managing banned users:', err);
    return null;
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ''}`;
}

module.exports = {
  config: {
    name: "swear",
    version: "2.0",
    author: "JV Barcenas (Enhanced)",
    countDown: 5,
    role: 0,
    shortDescription: "Smart swear word filter",
    longDescription: "Detects and handles inappropriate language with customizable settings",
    category: "moderation",
    guide: {
      en: `
        {p}swear on - Turn on swear filtering for this thread
        {p}swear off - Turn off swear filtering
        {p}swear settings - View current settings
        {p}swear config <warningCount> <banTime> - Set warning count and initial ban time
        {p}swear stats - View swear statistics for this thread
        {p}swear leaderboard - See who swears the most
        {p}swear forgive <@mention/uid> - Reduce someone's swear count by 1
        {p}swear redeem - Reduce your own swear count by 1 (once per day)
      `
    }
  },
  
  onStart: async function ({ api, event, args, message, threadsData }) {
    const { threadID, senderID } = event;
    const threadSettings = getThreadSettings(threadID);
    const isAdmin = await threadsData.get(threadID, "adminIDs").some(admin => admin.id === senderID);
    
    if (!args[0]) {
      return message.reply(
        "📝 Smart Swear Filter v2.0\n\n" +
        "Commands:\n" +
        "- swear on/off: Enable/disable filter\n" +
        "- swear settings: View settings\n" +
        "- swear config: Configure settings\n" +
        "- swear stats: View statistics\n" +
        "- swear leaderboard: See top swearers\n" +
        "- swear forgive: Reduce someone's count\n" +
        "- swear redeem: Reduce your own count"
      );
    }

    switch (args[0].toLowerCase()) {
      case "on":
        if (!isAdmin) return message.reply("❌ Only admins can change swear filter settings");
        threadSettings.enabled = true;
        saveThreadSettings(threadID, threadSettings);
        return message.reply("✅ Swear filter enabled for this conversation");
        
      case "off":
        if (!isAdmin) return message.reply("❌ Only admins can change swear filter settings");
        threadSettings.enabled = false;
        saveThreadSettings(threadID, threadSettings);
        return message.reply("🔴 Swear filter disabled for this conversation");
        
      case "settings":
        return message.reply(
          "⚙️ Current Swear Filter Settings:\n" +
          `- Status: ${threadSettings.enabled ? "Enabled ✅" : "Disabled ❌"}\n` +
          `- Warnings before ban: ${threadSettings.warningCount}\n` +
          `- Initial ban time: ${formatTime(threadSettings.initialBanTime)}\n` +
          `- Ban multiplier: ${threadSettings.banMultiplier}x\n` +
          `- React to swears: ${threadSettings.reactToSwears ? "Yes" : "No"}\n` +
          `- Delete messages: ${threadSettings.deleteMessages ? "Yes" : "No"}`
        );
        
      case "config":
        if (!isAdmin) return message.reply("❌ Only admins can change swear filter settings");
        
        const warningCount = parseInt(args[1]);
        const banTime = parseInt(args[2]);
        
        if (isNaN(warningCount) || isNaN(banTime) || warningCount < 1 || banTime < 10) {
          return message.reply("❌ Please provide valid numbers: swear config <warningCount> <banTimeInSeconds>");
        }
        
        threadSettings.warningCount = warningCount;
        threadSettings.initialBanTime = banTime;
        saveThreadSettings(threadID, threadSettings);
        
        return message.reply(
          "✅ Settings updated:\n" +
          `- Warnings before ban: ${warningCount}\n` +
          `- Initial ban time: ${formatTime(banTime)}`
        );
        
      case "stats":
        try {
          validateJSON(SWEAR_STATS_FILE, {});
          const data = fs.readFileSync(SWEAR_STATS_FILE, 'utf8');
          const stats = JSON.parse(data);
          
          if (!stats[threadID] || stats[threadID].totalCount === 0) {
            return message.reply("✨ No swear words detected in this conversation yet. Keep it clean!");
          }
          
          return message.reply(
            "📊 Swear Statistics:\n" +
            `- Total swear count: ${stats[threadID].totalCount}\n` +
            `- Number of swearers: ${Object.keys(stats[threadID].users).length}\n` +
            `Use 'swear leaderboard' to see who swears the most`
          );
        } catch (err) {
          console.error(err);
          return message.reply("❌ Error retrieving swear statistics");
        }
        
      case "leaderboard":
        try {
          validateJSON(SWEAR_STATS_FILE, {});
          const data = fs.readFileSync(SWEAR_STATS_FILE, 'utf8');
          const stats = JSON.parse(data);
          
          if (!stats[threadID] || stats[threadID].totalCount === 0) {
            return message.reply("✨ No swear words detected in this conversation yet. Keep it clean!");
          }
          
          const users = Object.entries(stats[threadID].users)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);
          
          let response = "🏆 Swear Leaderboard (Top 5):\n\n";
          
          users.forEach((user, index) => {
            response += `${index + 1}. ${user[1].name}: ${user[1].count} swears\n`;
          });
          
          return message.reply(response);
        } catch (err) {
          console.error(err);
          return message.reply("❌ Error retrieving swear leaderboard");
        }
        
      case "forgive":
        if (!isAdmin) return message.reply("❌ Only admins can forgive swear counts");
        
        const mentionID = Object.keys(event.mentions)[0] || args[1];
        if (!mentionID) return message.reply("❌ Please mention a user or provide their ID");
        
        try {
          validateJSON(BANNED_TIME_FILE, []);
          
          const data = fs.readFileSync(BANNED_TIME_FILE, 'utf8');
          let bannedUsers = JSON.parse(data);
          
          const userIndex = bannedUsers.findIndex(user => user.id === mentionID && user.threadID === threadID);
          
          if (userIndex === -1) {
            return message.reply("✅ This user has no swear violations to forgive");
          }
          
          if (bannedUsers[userIndex].swearCount > 0) {
            bannedUsers[userIndex].swearCount--;
            
            if (bannedUsers[userIndex].status && bannedUsers[userIndex].swearCount < threadSettings.warningCount) {
              bannedUsers[userIndex].status = false;
            }
            
            fs.writeFileSync(BANNED_TIME_FILE, JSON.stringify(bannedUsers, null, 2), 'utf8');
            
            return message.reply(`✅ Forgiven one swear for ${bannedUsers[userIndex].name}. Current count: ${bannedUsers[userIndex].swearCount}`);
          } else {
            return message.reply("✅ This user has no swear violations to forgive");
          }
        } catch (err) {
          console.error(err);
          return message.reply("❌ Error forgiving swear count");
        }
        
      default:
        return message.reply(
          "📝 Smart Swear Filter v2.0\n\n" +
          "Commands:\n" +
          "- swear on/off: Enable/disable filter\n" +
          "- swear settings: View settings\n" +
          "- swear config: Configure settings\n" +
          "- swear stats: View statistics\n" +
          "- swear leaderboard: See top swearers\n" +
          "- swear forgive: Reduce someone's count"
        );
    }
  },
  
  onLoad: async function ({ usersData }) {
    // Initialize files with default content if needed
    validateJSON(BANNED_TIME_FILE, []);
    validateJSON(SWEAR_WORDS_FILE, { words: [] });
    validateJSON(SWEAR_STATS_FILE, {});
    validateJSON(THREAD_SETTINGS_FILE, {});

    // Clean up expired bans
    const checkAndUpdateCountdown = () => {
      try {
        const data = fs.readFileSync(BANNED_TIME_FILE, 'utf8');
        let bannedUsers = JSON.parse(data);
        
        const currentTime = Date.now();
        let updated = false;
        
        const updatedBannedUsers = bannedUsers.map(user => {
          if (user.status && currentTime > user.countdown) {
            usersData.set(user.id, {
              banned: {
                status: false,
                reason: "",
                date: "",
              },
            });
            user.status = false;
            updated = true;
          }
          return user;
        });
        
        if (updated) {
          fs.writeFileSync(BANNED_TIME_FILE, JSON.stringify(updatedBannedUsers, null, 2), 'utf8');
        }
      } catch (err) {
        console.error('Error updating countdown:', err);
      }
    };

    setInterval(checkAndUpdateCountdown, 10000); // Check every 10 seconds
  },
  
  onChat: async function({ event, message, api, usersData }) {
    if (!event.body || event.body.startsWith('/')) return;
    
    const { threadID, messageID, senderID } = event;
    const threadSettings = getThreadSettings(threadID);
    
    // Skip if filter is disabled for this thread
    if (!threadSettings.enabled) return;
    
    const userData = await usersData.get(senderID);
    if (userData && userData.banned && userData.banned.status === true) return;
    
    const messageBody = event.body.toLowerCase();
    const userName = await usersData.getName(senderID) || 'User';
    
    const swearWords = loadSwearWords();
    if (swearWords.length === 0) return;
    
    // More sophisticated detection
    const wordsInMessage = messageBody.split(/\s+|[.,!?;:]/);
    
    let detectedSwears = [];
    
    for (const word of wordsInMessage) {
      if (swearWords.includes(word.trim())) {
        detectedSwears.push(word.trim());
      }
    }
    
    if (detectedSwears.length > 0) {
      // Update user ban status
      const userBan = addToBannedUsers(senderID, userName, threadID);
      
      // Update statistics
      detectedSwears.forEach(word => {
        updateSwearStats(senderID, userName, threadID, word);
      });
      
      // Add emoji reaction if enabled
      if (threadSettings.reactToSwears) {
        const reactions = ['😲', '😶', '😬', '🙊', '🚫', '⚠️'];
        api.setMessageReaction(getRandomElement(reactions), messageID);
      }
      
      // Delete message if enabled
      if (threadSettings.deleteMessages) {
        api.unsendMessage(messageID);
      }
      
      // Send warning or ban notification
      if (userBan.status) {
        const banTimeInSeconds = Math.round((userBan.countdown - Date.now()) / 1000);
        
        const reason = "Using inappropriate language";
        const time = moment().format("DD/MM/YYYY HH:mm:ss");
        
        usersData.set(senderID, {
          banned: {
            status: true,
            reason,
            date: time,
          },
        });
        
        message.reply(`⛔ ${userName} has been banned for ${formatTime(banTimeInSeconds)} for repeated use of inappropriate language.`);
      } else {
        // Generate clean alternatives for the detected swear words
        let cleanSuggestion = "";
        if (detectedSwears.length === 1) {
          cleanSuggestion = `\n\nTry saying "${getCleanAlternative(detectedSwears[0])}" instead.`;
        }
        
        message.reply(
          `${getRandomElement(SWEAR_RESPONSES)}\n` +
          `Warning ${userBan.swearCount}/${threadSettings.warningCount}${cleanSuggestion}`
        );
      }
    }
  }
};
