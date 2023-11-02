const fetch = require('node-fetch');

module.exports = {
  config: {
    name: 'aniquote',
    version: '1.0',
    author: 'Jhon Talamera',
    role: 0,
    category: 'Fun',
    shortDescription: {
      en: 'Get a random anime quote.',
    },
    longDescription: {
      en: 'Get a random anime quote from the API.',
    },
    guide: {
      en: '/aniquote',
    },
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message }) {
    try {
      if (event.body && event.body.toLowerCase() === '/aniquote') {
        fetch('https://asuquote.geraldinetalame.repl.co/api/animequote')
          .then(response => response.json())
          .then(data => {
            const quoteMessage = `✨Aniquote✨: ${data.quote}`;
            api.sendMessage(quoteMessage, event.threadID);
          })
          .catch(error => {
            console.error('Error:', error);
            api.sendMessage('An error occurred while fetching the anime quote. Please try again later.', event.threadID);
          });
      }
    } catch (error) {
      console.error(error);
      api.sendMessage('An error occurred while fetching the anime quote. Please try again later.', event.threadID);
    }
  },
};