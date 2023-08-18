const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'po',
    aliases: ['panda', 'motivate'],
    version: '1.0',
    author: 'JV Barcenas',
    countDown: 8,
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Shares a random motivational quote.'
    },
    longDescription: {
      en: 'Shares a random motivational quote fetched from an API and sends it with an image and audio.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
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
    } catch (error) {
      console.error(`Failed to send image and audio: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send an image and audio. Please try again later.', event.threadID);
    }
  }
};