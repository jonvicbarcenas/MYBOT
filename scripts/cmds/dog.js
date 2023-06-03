const axios = require('axios');

module.exports = {
  config: {
    name: 'dog',
    aliases: ['dogfact'],
    version: '1.1',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Sends a random dog image with a fact.'
    },
    longDescription: {
      en: 'Sends a random dog image fetched from the dogAPI along with an interesting dog fact.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const [imageResponse, factResponse] = await Promise.all([
        axios.get('https://dog.ceo/api/breeds/image/random'),
        axios.get('https://dog-api.kinduff.com/api/facts')
      ]);

      if (imageResponse.status !== 200 || !imageResponse.data || !imageResponse.data.message) {
        throw new Error('Invalid or missing response from dogAPI');
      }

      if (factResponse.status !== 200 || !factResponse.data || !factResponse.data.facts || factResponse.data.facts.length === 0) {
        throw new Error('Invalid or missing dog facts');
      }

      const imageURL = imageResponse.data.message;
      const facts = factResponse.data.facts;

      const randomFactIndex = Math.floor(Math.random() * facts.length);
      const factText = facts[randomFactIndex];

      const stream = await getStreamFromURL(imageURL);

      if (!stream) {
        throw new Error('Failed to fetch image from URL');
      }

      const messageID = await api.sendMessage({
        body: factText,
        attachment: stream
      }, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`Sent dog image with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send dog image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send a dog image. Please try again later.', event.threadID);
    }
  }
};

async function getStreamFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch image from URL: ${error.message}`);
    return null;
  }
}
