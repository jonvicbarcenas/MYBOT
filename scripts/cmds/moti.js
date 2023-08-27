const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const sentMessages = {};

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
    },
  },
  onStart: async function () {},
  onLoad: async function () {},
  onChat: async function ({ api, event, threadsData }) {
    try {
      const currentTimePH = moment().tz('Asia/Manila').format('HH:mm');

      // Check if the current time ends with ":00" (beginning of a new hour)
      if (event.isGroup && currentTimePH.endsWith(':00')) {
        const groupId = event.threadID;

        if (!sentMessages[groupId]) {
          const sendImageAndAudio = Math.random() < 0.5;

          if (sendImageAndAudio) {
            const res = await axios.get('https://panda.dreamcorps.repl.co/', { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'cache', `random-image.jpg`);
            await fs.outputFile(imgPath, res.data);

            const attachmentImage = await api.sendMessage({
              attachment: fs.createReadStream(imgPath),
              body: 'Daily Panda Quote:'
            }, groupId);

            if (!attachmentImage || !attachmentImage.messageID) {
              throw new Error('Failed to send message with image');
            }

            await fs.remove(imgPath);
          }

          const audioPath = path.join(__dirname, 'assets', 'po.mp3');
          const audioAttachment = fs.createReadStream(audioPath);

          if (sendImageAndAudio) {
            await api.sendMessage({
              attachment: audioAttachment
            }, groupId);
          } else {
            const res = await axios.get('https://zeenquotes.dreamcorps.repl.co/random-motivation');
            const quote = res.data.quote;
            const author = res.data.author;

            const messageText = `Daily Quote:\n\n"${quote}"\n- ${author}`;

            await api.sendMessage({
              body: messageText,
              attachment: audioAttachment
            }, groupId);
          }

          sentMessages[groupId] = true;
        }
      }
    } catch (error) {
      console.error(`Failed to send message: ${error.message}`);
    }
  }
};
