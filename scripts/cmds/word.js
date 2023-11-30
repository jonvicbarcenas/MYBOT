const axios = require('axios');

module.exports = {
  config: {
    name: 'word',
    aliases: ['dic', 'whatis', 'define'],
    version: '1.0',
    author: 'JV',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Explain the word by dictionary.'
    },
    longDescription: {
      en: 'Explain the word by dictionary.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (args.length === 0) {
        api.sendMessage('Please provide a word as a prompt.', event.threadID);
        return;
      }

      const word = args.join(' ').toLowerCase();
      const apiKey = 'e7e3e3ad-a4b1-44f1-b7cf-ff5eea6d108a';
      const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;

      const wordResponse = await axios.get(url);

      if (wordResponse.status !== 200 || !wordResponse.data || !wordResponse.data[0]) {
        throw new Error('Invalid or missing response from Merriam-Webster API');
      }

      const definitions = wordResponse.data[0].shortdef;

      if (!definitions || definitions.length === 0) {
        api.sendMessage(`No definitions found for ${word}.`, event.threadID);
        return;
      }

      const formattedDefinitions = definitions.map((definition, index) => `${index + 1}: ${definition}`).join('\n');

      const message = `Definitions for •"${word}"•:\n\n${formattedDefinitions}`;

      const resultMessageID = await api.sendMessage(message, event.threadID, event.messageID);

      if (!resultMessageID) {
        throw new Error('Failed to send result message');
      }

      console.log(`Sent result message with ID ${resultMessageID}`);
    } catch (error) {
      console.error(`Failed to look up word: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to look up the word. Please try again later.', event.threadID, event.messageID);
    }
  }
};