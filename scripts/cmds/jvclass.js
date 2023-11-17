const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "classUpdater",
    version: "1.0",
    author: "JV Barcenas",
    category: "owner",
  },
  lastSentMinute: null,
  messageSent: false, // Flag to track if a message has already been sent
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically update class schedule to owner`,
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
      const currentTimePH = moment().tz('Asia/Manila').format('hh:mm A');
      const currentDay = moment().tz('Asia/Manila').format('dddd').toUpperCase();

      try {
        const filePath = path.join(__dirname, 'jvclass.json');
        const scheduleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const updates = [];
        const currentMinute = moment().tz('Asia/Manila').startOf('minute').format('YYYY-MM-DD HH:mm');

        if (scheduleData[currentDay]) {
          for (const entry of scheduleData[currentDay]) {
            const timeRange = entry.time;
            const [startTime, endTime] = timeRange.substring(1, timeRange.length - 1).split('-');
            const time = moment(startTime, 'hh:mm A').format('hh:mm A');

            if (time === currentTimePH) {
              const { course, location, room } = entry;
              const update = `📚 CURRENT CLASS UPDATE 📚\n\nCourse: ${course}\nLocation: ${location}\nRoom: ${room}\nTime: ${timeRange}`;
              updates.push(update);
            }
          }
        }

        if (updates.length !== 0 && !this.messageSent && this.lastSentMinute !== currentMinute) {
          const message = updates.join('\n\n');
          const recipientIDs = ['100007150668975', '6423232497687772', '24054741377504166']; // Replace with actual recipient IDs
          for (const recipientID of recipientIDs) {
            api.sendMessage(message, recipientID);
          }
          console.log('Class update message sent successfully!');
          this.messageSent = true;
        }

        if (this.messageSent && updates.length === 0) {
          // Reset the messageSent flag if there are no updates
          this.messageSent = false;
        }

        this.lastSentMinute = currentMinute; // Update the last sent minute
      } catch (error) {
        console.error('Error reading schedule data:', error);
      }
    };

    // Run the update check every minute
    const interval = setInterval(checkForUpdates, 5000);

    // Perform an initial update check immediately
    await checkForUpdates();
  }
};