const { getStreamFromURL } = global.utils;
const path = require("path");
const fs = require("fs");

// Generate a random challenge text
function generateChallengeText() {
  const challenges = [
    "The quick brown fox jumps over the lazy dog",
    "Programming is the art of telling a computer what to do",
    "All that glitters is not gold",
    "To be or not to be, that is the question",
    "Life is what happens when you're busy making other plans",
    "Stay hungry, stay foolish",
    "The best way to predict the future is to create it",
    "Be the change you wish to see in the world",
    "In the middle of difficulty lies opportunity",
    "Knowledge is power, but enthusiasm pulls the switch"
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

// Calculate typing speed (WPM)
function calculateWPM(text, timeSeconds) {
  // Average word length is considered 5 characters
  const words = text.length / 5;
  const minutes = timeSeconds / 60;
  return Math.round(words / minutes);
}

// Calculate accuracy percentage
function calculateAccuracy(originalText, typedText) {
  let correctChars = 0;
  const maxLength = Math.min(originalText.length, typedText.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (originalText[i] === typedText[i]) {
      correctChars++;
    }
  }
  
  return Math.round((correctChars / originalText.length) * 100);
}

module.exports = {
  config: {
    name: "typemaster",
    version: "1.0",
    author: "JVB",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Trò chơi gõ văn bản nhanh",
      en: "Typing speed game"
    },
    longDescription: {
      vi: "Trò chơi kiểm tra tốc độ gõ và độ chính xác của bạn",
      en: "Game to test your typing speed and accuracy"
    },
    category: "games",
    guide: {
      en: "{pn} [start|leaderboard]"
    },
    envConfig: {
      reward: 50 // Base reward for completing the challenge
    }
  },

  langs: {
    vi: {
      start: "Bắt đầu! Hãy nhập chính xác văn bản sau:",
      reply: "Hãy trả lời tin nhắn này bằng cách nhập văn bản chính xác",
      timeOut: "Hết thời gian! Hãy thử lại.",
      result: "📊 Kết quả:\n• Thời gian: %1 giây\n• Tốc độ: %2 WPM\n• Độ chính xác: %3%\n• Điểm nhận được: %4$",
      leaderboard: "🏆 Bảng xếp hạng TypeMaster 🏆",
      error: "Có lỗi xảy ra, vui lòng thử lại sau.",
      notPlayer: "Bạn không phải là người chơi."
    },
    en: {
      start: "Game started! Type the following text exactly:",
      reply: "Reply to this message by typing the text exactly\n⌛ Time limit: 30 seconds",
      timeOut: "Time's up! Try again.",
      result: "📊 Results:\n• Time: %1 seconds\n• Speed: %2 WPM\n• Accuracy: %3%\n• Reward: %4$",
      leaderboard: "🏆 TypeMaster Leaderboard 🏆",
      error: "An error occurred, please try again later.",
      notPlayer: "You are not the player."
    }
  },

  onStart: async function ({ message, event, commandName, getLang, args }) {
    if (!args[0] || args[0].toLowerCase() === "start") {
      const challengeText = generateChallengeText();
      
      message.reply({
        body: `${getLang("start")}\n\n"${challengeText}"`,
      }, (err, info) => {
        if (err) return message.reply(getLang("error"));
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          challengeText,
          startTime: Date.now()
        });
        
        // Set a timeout of 30 seconds
        setTimeout(() => {
          const replyData = global.GoatBot.onReply.get(info.messageID);
          if (replyData) {
            global.GoatBot.onReply.delete(info.messageID);
            message.reply(getLang("timeOut"));
          }
        }, 30000);
      });
    } else if (args[0].toLowerCase() === "leaderboard" || args[0].toLowerCase() === "top") {
      // Display leaderboard
      const leaderboardPath = path.join(__dirname, "typemaster_leaderboard.json");
      let leaderboardData = [];
      
      try {
        if (fs.existsSync(leaderboardPath)) {
          leaderboardData = JSON.parse(fs.readFileSync(leaderboardPath));
        }
      } catch (error) {
        console.error("Error reading leaderboard file:", error);
      }
      
      if (leaderboardData.length === 0) {
        return message.reply(`${getLang("leaderboard")}\n\nNo records yet.`);
      }
      
      // Sort by WPM
      leaderboardData.sort((a, b) => b.wpm - a.wpm);
      
      let leaderboardMsg = `${getLang("leaderboard")}\n\n`;
      for (let i = 0; i < Math.min(10, leaderboardData.length); i++) {
        const entry = leaderboardData[i];
        leaderboardMsg += `${i+1}. ${entry.name} - ${entry.wpm} WPM (${entry.accuracy}% accuracy)\n`;
      }
      
      message.reply(leaderboardMsg);
    }
  },

  onReply: async ({ message, event, Reply, getLang, usersData, envCommands, commandName }) => {
    const { author, challengeText, messageID, startTime } = Reply;
    
    if (event.senderID !== author) {
      return message.reply(getLang("notPlayer"));
    }
    
    global.GoatBot.onReply.delete(messageID);
    
    const endTime = Date.now();
    const typedText = event.body;
    const timeElapsed = (endTime - startTime) / 1000; // in seconds
    
    const accuracy = calculateAccuracy(challengeText, typedText);
    const wpm = calculateWPM(challengeText, timeElapsed);
    
    // Calculate reward based on speed and accuracy
    let reward = envCommands[commandName].reward;
    if (accuracy >= 90 && wpm >= 30) {
      reward = Math.round(reward * (wpm / 20)); // More reward for faster typing
    } else if (accuracy < 70) {
      reward = Math.round(reward / 2); // Less reward for low accuracy
    }
    
    // Save to leaderboard
    const leaderboardPath = path.join(__dirname, "typemaster_leaderboard.json");
    let leaderboardData = [];
    
    try {
      if (fs.existsSync(leaderboardPath)) {
        leaderboardData = JSON.parse(fs.readFileSync(leaderboardPath));
      }
    } catch (error) {
      console.error("Error reading leaderboard file:", error);
    }
    
    // Get user info
    const userData = await usersData.get(event.senderID);
    const userName = userData ? userData.name : "Unknown";
    
    // Add or update user in leaderboard
    const userIndex = leaderboardData.findIndex(entry => entry.uid === event.senderID);
    
    if (userIndex !== -1) {
      // Update if new score is better
      if (wpm > leaderboardData[userIndex].wpm) {
        leaderboardData[userIndex] = {
          uid: event.senderID,
          name: userName,
          wpm,
          accuracy,
          time: timeElapsed
        };
      }
    } else {
      // Add new entry
      leaderboardData.push({
        uid: event.senderID,
        name: userName,
        wpm,
        accuracy,
        time: timeElapsed
      });
    }
    
    // Save leaderboard
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboardData, null, 2));
    
    // Add money to bank
    try {
      const bankPath = "bank.json";
      let bankData = {};
      
      if (fs.existsSync(bankPath)) {
        bankData = JSON.parse(fs.readFileSync(bankPath));
      }
      
      const userId = event.senderID.toString();
      if (!bankData[userId]) {
        bankData[userId] = {
          bank: 0,
          lastInterestClaimed: Date.now()
        };
      }
      
      bankData[userId].bank += reward;
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
    } catch (error) {
      console.error("Error updating bank:", error);
    }
    
    // Reply with results
    message.reply(getLang("result", timeElapsed.toFixed(2), wpm, accuracy, reward));
  }
}; 