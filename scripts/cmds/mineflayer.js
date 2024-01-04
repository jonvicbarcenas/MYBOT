const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "playerUpdater",
    version: "1.0",
    author: "JV",
    category: "owner",
  },
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically update player events to owner`,
      event.threadID,
      event.messageID
    );
  },
  onLoad: async function({
    api,
    event,
    message,
    getLang,
    args,
  }) {
    const checkForUpdates = async () => {
      try {
        const filePath = path.join(__dirname, 'minebot.json');
        let playerData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const updates = [];

        if (playerData.latestEvent && !playerData.latestEvent.messageSent) {
          const { type, username, timestamp, messageSent } = playerData.latestEvent;
          const eventTime = moment(timestamp).tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

          const update = `🎮 LATEST PLAYER EVENT 🎮\n\nType: ${type}\nUsername: ${username}\nTimestamp: ${eventTime}`;
          updates.push(update);

          // Set messageSent to true after sending the message
          playerData.latestEvent.messageSent = true;
          fs.writeFileSync(filePath, JSON.stringify(playerData, null, 2), 'utf8');
        }

        if (updates.length !== 0) {
          const message = updates.join('\n\n');
          const recipientIDs = ['7178756798812950']; // Replace with actual recipient IDs
          for (const recipientID of recipientIDs) {
            api.sendMessage(message, recipientID);
          }
          //console.log('Player update message sent successfully!');
        }
      } catch (error) {
        //console.error('Error reading player data:', error);
      }
    };

    // Run the update check every minute
    const interval = setInterval(checkForUpdates, 1000);

    // Perform an initial update check immediately
    await checkForUpdates();
  }
};
