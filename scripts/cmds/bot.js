const axios = require('axios');

const Prefixes = [
  'bot',
  '/bot',
];

module.exports = {
  config: {
    name: 'bot',
    version: '2.5',
    author: 'JV Barcenas',
    role: 0,
    category: 'ai',
    shortDescription: {
      en: 'Asks an AI for an answer.',
    },
    longDescription: {
      en: 'Asks an AI for an answer based on the user prompt.',
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
          "State your request!! What is it that you seek from me?"
        );
        return;
      }

      await message.reply("Dain is thinking...");

      const response = await axios.get(`https://kemenu-koega.corpselaugh.repl.co/?prompt=${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      const firstContent = response.data.candidates[0]?.content.trim();

      if (!firstContent) {
        throw new Error('Invalid or missing content in API response');
      }

      await message.reply(firstContent);

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
