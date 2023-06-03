const axios = require('axios');

module.exports = {
  config: {
    name: 'quote',
    aliases: ['randomquote', 'inspire'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Shares a random quote.'
    },
    longDescription: {
      en: 'Shares a random quote fetched from the ZenQuotes API.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const response = await axios.get('https://zenquotes.io/api/random');

      if (response.status !== 200 || !response.data || !response.data[0] || !response.data[0].q || !response.data[0].a) {
        throw new Error('Invalid or missing response from ZenQuotes API');
      }

      const quote = response.data[0].q;
      const author = response.data[0].a;

      const message = `Here's a quote for you:\n\n"${quote}"\n- ${author}`;

      const messageID = await api.sendMessage(message, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message with quote');
      }

      console.log(`Sent quote with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send quote: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to share a quote. Please try again later.', event.threadID);
    }
  }
};
