const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "downsched",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 0,
    role: 0,
    shortDescription: "NOT A CMD",
    longDescription: "NOT A COMMAND",
    category: "NOT COMMANDS",
  },
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically download anime updates`,
      event.threadID,
      event.messageID
    );
    console.log('Downloading schedule data on startup...');
    try {
      const response = await axios.get('https://anisched--marok85067.repl.co/');
      const scheduleData = response.data;
      const filePath = path.join(__dirname, 'schedule.json');

      fs.writeFile(filePath, JSON.stringify(scheduleData, null, 2), (err) => {
        if (err) {
          console.error('Error saving schedule data:', err);
        } else {
          console.log('Schedule data saved successfully!');
        }
      });

      this.isDataDownloaded = true; // Set the flag to true after successfully downloading and saving the data

      // Schedule a redownload after 1 minute
      setTimeout(() => {
        console.log('Redownloading schedule data...');
        this.isDataDownloaded = false; // Reset the flag
      }, 1 * 60 * 1000); // 1 minute delay
    } catch (error) {
      console.error('Error downloading schedule data:', error);
    }
  },
  onLoad: async function({
    api,
    event,
    message,
    getLang,
    args,
  }) {
    // Check if the current time is 12:00 AM in the Asia/Manila timezone and the flag is not set
    const currentDateTime = moment().tz('Asia/Manila');
    if (currentDateTime.hours() === 0 && currentDateTime.minutes() === 0 && !this.isDataDownloaded) {
      console.log('Downloading schedule data...');
      try {
        const response = await axios.get('https://anisched--marok85067.repl.co/');
        const scheduleData = response.data;
        const filePath = path.join(__dirname, 'schedule.json');

        fs.writeFile(filePath, JSON.stringify(scheduleData, null, 2), (err) => {
          if (err) {
            console.error('Error saving schedule data:', err);
          } else {
            console.log('Schedule data saved successfully!');
          }
        });

        this.isDataDownloaded = true; // Set the flag to true after successfully downloading and saving the data

        // Schedule a redownload after 1 minute
        setTimeout(() => {
          console.log('Redownloading schedule data...');
          this.isDataDownloaded = false; // Reset the flag
        }, 15 * 60 * 1000); // 15 minute delay
      } catch (error) {
        console.error('Error downloading schedule data:', error);
      }
    }
  },
};

// Reset the flag at the start of each day
cron.schedule('0 0 * * *', () => {
  console.log('Resetting data download flag...');
  module.exports.isDataDownloaded = false;
});

// Schedule the task to run every minute
cron.schedule('*/20  * * * *', async () => {
  console.log('Cron task started...');
  try {
    const response = await axios.get('https://anisched--marok85067.repl.co/');
    const scheduleData = response.data;
    const filePath = path.join(__dirname, 'schedule.json');

    fs.writeFile(filePath, JSON.stringify(scheduleData, null, 2), (err) => {
      if (err) {
        console.error('Error saving schedule data:', err);
      } else {
        console.log('Schedule data saved successfully!');
      }
    });

    module.exports.isDataDownloaded = true; // Set the flag to true after successfully downloading and saving the data
  } catch (error) {
    console.error('Error downloading schedule data:', error);
  }
});

// Schedule the task to run every 11:58
cron.schedule('58 23 * * *', async () => {
  console.log('Cron task started...');
  try {
    const response = await axios.get('https://anisched--marok85067.repl.co/tomorrow');
    const scheduleData = response.data;
    const filePath = path.join(__dirname, 'schedule.json');

    fs.writeFile(filePath, JSON.stringify(scheduleData, null, 2), (err) => {
      if (err) {
        console.error('Error saving schedule data:', err);
      } else {
        console.log('Schedule data saved successfully!');
      }
    });

    module.exports.isDataDownloaded = true; // Set the flag to true after successfully downloading and saving the data
  } catch (error) {
    console.error('Error downloading schedule data:', error);
  }
});