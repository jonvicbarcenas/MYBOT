const axios = require('axios');

module.exports = {
  config: {
    name: 'simsimi',
    aliases: ['sim'],
    version: '1.0',
    author: 'zach',
    countDown: 5,
    role: 0,
    shortDescription: 'Simsimi',
    longDescription: 'Chat with SimSimi',
    category: 'funny',
    guide: {
      body: '   {pn} {{[on | off]}}: Turn SimSimi on/off' + '\n' +
        '\n   {pn} {{<word>}}: Chat quickly with SimSimi' + '\n   Example: {pn} {{hi}}'
    }
  },

  async onStart({ args, threadsData, message, event }) {
    if (args[0] === 'on' || args[0] === 'off') {
      await threadsData.set(event.threadID, args[0] === 'on', 'settings.simsimi');
      return message.reply(`SimSimi is ${args[0] === 'on' ? 'enabled' : 'disabled'} in your group.`);
    } else if (args[0]) {
      const yourMessage = args.join(' ');
      try {
        const responseMessage = await getMessage(yourMessage);
        return message.reply(`${responseMessage}`);
      } catch (err) {
        return message.reply('SimSimi is busy. Please try again later.');
      }
    }
  },

  async onChat({ args, api, threadsData, event }) {
    if (event.type !== 'message' || !event.body || !event.isGroup) return;
    if (args.length > 0 && await threadsData.get(event.threadID, 'settings.simsimi')) {
      try {
        const responseMessage = await getMessage(args.join(' '));
        await api.sendMessage(responseMessage, event.threadID);
      } catch (err) {
        await api.sendMessage('SimSimi is busy. Please try again later.', event.threadID);
      }
    }
  }
};


async function getMessage(content) {
  const url = `https://simsimi.fun/api/v2/?mode=talk&lang=ph&message=${content}&filter=false`;
  const response = await axios.get(url);

  if (response.status !== 200) {
    throw new Error('Failed to retrieve SimSimi response.');
  }

  return response.data.success;
}
