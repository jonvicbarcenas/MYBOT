const axios = require('axios');

module.exports = {
  config: {
    name: 'bible',
    aliases: ['tellverse', 'verse'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Shares a random Bible verse.'
    },
    longDescription: {
      en: 'Shares a random Bible verse fetched from the OurManna API.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const date = new Date();
      const day = date.getDate();
      const response = await axios.get(`https://beta.ourmanna.com/api/v1/get/?format=text&order=random&order_by=verse&day=${day}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from OurManna API');
      }

      const message = `Here's a Bible verse for you: \n\n${response.data}`;

      const messageID = await api.sendMessage(message, event.threadID, event.messageID);

      if (!messageID) {
        throw new Error('Failed to send message with Bible verse');
      }

      console.log(`Sent Bible verse with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send Bible verse: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to share a Bible passage. Please try again later.', event.threadID);
    }
  }
};