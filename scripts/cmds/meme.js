const axios = require('axios');

module.exports = {
  config: {
    name: 'meme',
    aliases: ['funnymeme', 'memepic', 'memes'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Sends a random meme image.'
    },
    longDescription: {
      en: 'Sends a random meme image fetched from the API.'
    },
    guide: {
      en: '{pn} [search term]'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const response = await axios.get('https://meme-api.com/gimme');

      if (response.status !== 200 || !response.data || !response.data.url) {
        throw new Error('Invalid or missing response from the API');
      }

      const title = response.data.title;
      const imageURL = response.data.url;
      const stream = await global.utils.getStreamFromURL(imageURL);

      if (!stream) {
        throw new Error('Failed to fetch image from URL');
      }

      const messageID = await api.sendMessage({
        body: `${title}`,
        attachment: stream
      }, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`Sent meme image with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send meme image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send a meme image. Please try again later.', event.threadID);
    }
  }
};
