const axios = require('axios');

const Prefixes = [
  'giti',
  '/giti',
];

module.exports = {
  config: {
    name: 'gitiai',
    version: '2.5',
    author: 'JV Barcenas', // do not change
    role: 0,
    category: 'ai',
    shortDescription: {
      en: 'Mangayo og tubag sa AI.',
    },
    longDescription: {
      en: 'Mangayo sa usa ka AI alang sa usa ka tubag base sa user prompt.',
    },
    guide: {
      en: '{pn} [prompt]',
    },
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message }) {
    try {
      const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));

      if (!prefix) {
        return; 
      }

      const prompt = event.body.substring(prefix.length).trim();

      if (prompt === '') {
        await message.reply(
          "Palihug paghatag ug pangutana."
        );
        return;
      }


      await message.reply("Pagtubag sa imong pangutana. Palihog paghulat kadiyot...");

      const response = await axios.get(`https://celestial-3ode.onrender.com/gitiai?ask==${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      const messageText = response.data.content.trim();

      await message.reply(messageText);

      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(
        `${error.message}.\n\nYou can try typing your question again or resending it, as there might be a bug from the server that's causing the problem. It might resolve the issue.`,
        event.threadID
      );
    }
  },
};