const axios = require('axios');

module.exports = {
  config: {
    name: 'sqrl',
    aliases: ['squirrelpic'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Sends a random squirrel image.'
    },
    longDescription: {
      en: 'Sends a random squirrel image fetched from the Pixabay API.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const apiKey = '34979834-49db9f034f546ee47b9ce7a83';
      const response = await axios.get(`https://pixabay.com/api/?key=${apiKey}&q=squirrel&image_type=photo&orientation=horizontal`);

      if (response.status !== 200 || !response.data || !response.data.hits || response.data.hits.length === 0) {
        throw new Error('Invalid or missing response from Pixabay API');
      }

      const hits = response.data.hits;
      const randomIndex = Math.floor(Math.random() * hits.length);
      const imageURL = hits[randomIndex].webformatURL;

      const stream = await global.utils.getStreamFromURL(imageURL);

      if (!stream) {
        throw new Error('Failed to fetch image from URL');
      }

      const messageID = await api.sendMessage({
        body: 'Here is a random squirrel image:',
        attachment: stream
      }, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`Sent squirrel image with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send squirrel image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send a squirrel image. Please try again later.', event.threadID);
    }
  }
};
