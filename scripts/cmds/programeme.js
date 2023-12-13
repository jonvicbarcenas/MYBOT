const axios = require('axios');

module.exports = {
  config: {
    name: 'programmingmeme',
    aliases: ["programeme"],
    version: '1.0',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Sends a random programming meme image.'
    },
    longDescription: {
      en: 'Sends a random programming meme from API.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const response = await axios.get('https://celestial-dainsleif-docs.archashura.repl.co/programeme');

      if (response.status !== 200 || !response.data || response.data.length === 0) {
        throw new Error('Invalid or missing response from the API');
      }

      const meme = response.data[0];
      const title = meme.title;
      const imageURL = meme.imageUrl;
      const stream = await global.utils.getStreamFromURL(imageURL);

      if (!stream) {
        throw new Error('Failed to fetch image from URL');
      }

      const messageID = await api.sendMessage({
        body: `${title}`,
        attachment: stream
      }, event.threadID, event.messageID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`Sent meme image with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send meme image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send a meme image. Please try again later.', event.threadID, event.messageID);
    }
  }
};
