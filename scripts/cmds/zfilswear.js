const fs = require('fs');
const moment = require('moment-timezone');

function loadSwearWords() {
  try {
    const data = fs.readFileSync(`${__dirname}/swearWords.json`, 'utf8');
    return JSON.parse(data).words;
  } catch (err) {
    console.error('Error loading swear words:', err);
    return [];
  }
}

module.exports = {
  config: {
    name: "swear",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: "Handle swear",
    longDescription: "Handle swear",
    category: "reply",
  },
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically detects filipino swears`,
      event.threadID,
      event.messageID
    );
  },
  onLoad: async function ({ usersData }) {
    const checkAndUpdateCountdown = async () => {
      const currentTime = Date.now();
      const allUsers = await usersData.getAll();
      
      for (const [userID, userData] of Object.entries(allUsers)) {
        if (userData.banned && userData.banned.status && currentTime > userData.banned.countdown) {
          userData.banned.status = false;
          userData.banned.reason = "";
          userData.banned.date = "";
          userData.banned.swearCount = 0;
          await usersData.set(userID, userData);
        }
      }
    };

    setInterval(checkAndUpdateCountdown, 1000);
  },
  onChat: async function({ event, api, usersData }) {
    if (event.body && !event.body.startsWith('/swearlist')) {
      const senderID = event.senderID;
      const userData = await usersData.get(senderID);
  
      if (userData && userData.banned && userData.banned.status === true) {
        return;
      }
      const messageBody = event.body.toLowerCase();
      const userName = (await usersData.getName(event.senderID)) || 'Unknown User';

      const swearWords = loadSwearWords();

      const containsSwearWord = swearWords.some(word => messageBody.includes(word));

      if (containsSwearWord) {
        const existingUser = await usersData.get(event.senderID);

        if (existingUser && existingUser.banned && existingUser.banned.status) {
          return;
        }

        const currentTime = Date.now();
        const tenMinutesLater = currentTime + 600 * 1000; // 10 minutes later

        if (existingUser) {
          existingUser.banned.status = true;
          existingUser.banned.reason = "Using inappropriate language and will be unbanned in 10 minutes";
          existingUser.banned.date = moment().format("DD/MM/YYYY HH:mm:ss");
          existingUser.banned.countdown = tenMinutesLater;
          existingUser.banned.swearCount += 1;
        } else {
          await usersData.set(event.senderID, {
            banned: {
              status: true,
              reason: "Using inappropriate language and will be unbanned in 10 minutes",
              date: moment().format("DD/MM/YYYY HH:mm:ss"),
              countdown: tenMinutesLater,
              swearCount: 1,
            },
          });
        }

        if (existingUser && existingUser.banned.swearCount >= 3) {
          api.sendMessage('You are now banned for 10 minutes.', event.threadID, event.messageID);
          return;
        }

        api.sendMessage(
          "Detected swear words: Please refrain from using any vulgar words in the chat.",
          event.threadID,
          event.messageID
        );
      }
    }
  },
};