const axios = require('axios');

module.exports = {
  config: {
    name: 'feel',
    aliases: ['feel'],
    version: '2.5',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'analyse text.'
    },
    longDescription: {
      en: 'analyse texts emotion using gradio'
    },
    guide: {
      en: '{pn} [prompt]'
    }
  },
  onStart: async function ({ message, api, event, args }) {
    try {
      let prompt = args.join(' ');

      if (!prompt) {
        // check if there is a message reply
        if (event.messageReply) {
          prompt = event.messageReply.body;
        } else {
          throw new Error('Please provide a prompt.');
        }
      }

      const response = await axios.get(`https://whatdaheel.dreamcorps.repl.co/api/sentiment?q=${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const output = await axios.get('https://whatdaheel.dreamcorps.repl.co/sentiment');

      if (output.status !== 200 || !output.data) {
        throw new Error('Invalid or missing response from API');
      }

      const message = output.data.trim();

      const messageID = await api.sendMessage(message, event.threadID);

      if (!messageID) {
        throw new Error('Failed to sentiment');
      }

      console.log(`Sent answer with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(`Sorry, something went wrong while trying to get a sentiment: ${error.message}. Please try again later.`, event.threadID);
    }
  }
};
