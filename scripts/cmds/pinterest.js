const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const pinterestDataPath = path.join(__dirname, "pinterest.json");
let pinterestData = {};

if (fs.existsSync(pinterestDataPath)) {
  pinterestData = require(pinterestDataPath);
}

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0.2",
    author: "JVB",
    role: 0,
    countDown: 50,
    shortDescription: {
      en: "Search for images on Pinterest"
    },
    longDescription: {
      en: ""
    },
    category: "Search",
    guide: {
      en: "{prefix}pinterest <search query> -<number of images>"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const motiFilePath = path.join(__dirname, 'moti.json');
      let motiData = [];

      try {
        const motiFileContent = await fs.readFile(motiFilePath, 'utf8');
        motiData = JSON.parse(motiFileContent);
      } catch (readError) {
        console.error(`Error reading moti.json: ${readError.message}`);
      }

      const senderData = motiData.find(data => data.userID === event.senderID);

      if (senderData && senderData.futureEpochTime > Math.floor(Date.now() / 1000)) {
        const remainingTime = senderData.futureEpochTime - Math.floor(Date.now() / 1000);
        const name = senderData.name;

        api.sendMessage(`Sorry, you are on cooldown. Please wait ${remainingTime} seconds before using this command again.\nLast triggered by: ${name}`, event.threadID);
        return;
      }

      const res = await axios.get('https://panda.dreamcorps.repl.co/', { responseType: 'arraybuffer' });
      const imgPath = path.join(__dirname, 'cache', `random-image.jpg`);
      await fs.outputFile(imgPath, res.data);

      const attachmentImage = await api.sendMessage({
        attachment: fs.createReadStream(imgPath),
      }, event.threadID);

      if (!attachmentImage || !attachmentImage.messageID) {
        throw new Error('Failed to send message with image');
      }

      console.log(`Sent image with message ID ${attachmentImage.messageID}`);

      await fs.remove(imgPath);

      const audioPath = path.join(__dirname, 'assets', 'po.mp3');

      const attachmentAudio = await api.sendMessage({
        attachment: fs.createReadStream(audioPath),
      }, event.threadID);

      if (!attachmentAudio || !attachmentAudio.messageID) {
        throw new Error('Failed to send message with audio');
      }

      console.log(`Sent audio with message ID ${attachmentAudio.messageID}`);

      // Update moti.json with user data
      const senderName = await usersData.getName(event.senderID);
      const currentTime = Math.floor(Date.now() / 1000); // Current epoch time in seconds
      const futureTime = currentTime + 180; // Current time + 3 minutes

      const userData = {
        userID: event.senderID,
        name: senderName,
        futureEpochTime: futureTime
      };

      motiData.push(userData);

      try {
        await fs.writeFile(motiFilePath, JSON.stringify(motiData, null, 2), 'utf8');
        console.log('Updated moti.json with user data');
      } catch (writeError) {
        console.error(`Error writing moti.json: ${writeError.message}`);
      }
    } catch (error) {
      console.error(`Failed to send image, audio, and update moti.json: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send an image, audio, and update moti.json. Please try again later.', event.threadID);
    }
  }
};