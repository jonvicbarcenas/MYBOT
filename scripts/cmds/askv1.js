const axios = require('axios');

const Prefixesjv = [
  'ask',
  '.chi',
  '¶sammy',
  '_nano',
  'nano',
  'ai',
  '.ask',
  '/ask',
  '!ask',
  '@ask',
  '#ask',
  '$ask',
  '%ask',
  '^ask',
  '*ask',
  '.ai',
  '/ai',
  '!ai',
  '@ai',
  '#ai',
  '$ai',
  '%ai',
  '^ai',
  '*ai',
];

const Prefixes = [
  'gpt',
  '/gpt',
];


module.exports = {
  config: {
    name: 'ask',
    aliases: ['aiS'],
    version: '2.5',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Asks an AI for an answer.'
    },
    longDescription: {
      en: 'Asks an AI for an answer based on the user prompt.'
    },
    guide: {
      en: '{pn} [prompt]'
    }
  },
  onStart: async function() {},
  onChat: async function ({ api, event, args, message }) {
    try {
      const prefix = Prefixes.find(p => event.body && event.body.toLowerCase().startsWith(p));

      // Check if the prefix is valid
      if (!prefix) {
        return; // Invalid prefix, ignore the command
      }

      // Remove the prefix from the message body
      const prompt = event.body.substring(prefix.length).trim();

      // Check if prompt is empty
      if (prompt === '') {
        await message.reply("Kindly provide the question at your convenience and I shall strive to deliver an effective response. Your satisfaction is my top priority.");
        return;
      }

      // Send a message indicating that the question is being answered
      await message.reply("Answering your question. Please wait a moment...");

      const response = await axios.get(`https://wra--marok85067.repl.co/?gpt=${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      await new Promise(resolve => setTimeout(resolve, 20));

      const output = await axios.get('https://wra--marok85067.repl.co/show');

      if (output.status !== 200 || !output.data) {
        throw new Error('Invalid or missing response from API');
      }

      const messageText = output.data.trim();

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
