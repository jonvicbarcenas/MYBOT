const axios = require('axios');


module.exports = {
  config: {
    name: 'promptgen',
    aliases: ['prompt'],
    version: '1.0',
    author: 'JV Barcenas',
    role: 0,
    category: 'ai',
    shortDescription: {
      en: 'Generates a response based on a user prompt.',
    },
    longDescription: {
      en: 'Generates a response based on a user prompt using an AI service.',
    },
    guide: {
      en: '{pn} [prompt]',
    },
  },
  onStart: async function ({ api, event, args, message }) {
    try {
      const prompt = args.join(" ");
      if (prompt === '') {
        await message.reply(
          "Please provide a prompt, and I will generate a response for you."
        );
        return;
      }

      const apiUrl = 'https://celestial-dainsleif-docs.archashura.repl.co/prompter?prompt=';
      const response = await axios.get(`${apiUrl}${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data || !response.data.generated_text) {
        throw new Error('Invalid or missing response from the AI service');
      }

      const generatedText = response.data.generated_text.trim();

      await message.reply(generatedText);

      console.log('Sent generated text as a reply to user');
    } catch (error) {
      console.error(`Failed to generate response: ${error.message}`);
      api.sendMessage(
        `${error.message}.\n\nPlease try again or provide a different prompt. There might be an issue with the server or the prompt you provided.`,
        event.threadID
      );
    }
  },
};
