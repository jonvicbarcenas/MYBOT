const axios = require('axios');

module.exports = {
  config: {
    name: 'illusion',
    version: '1.0',
    author: 'JV Barcenas',
    role: 2,
    category: 'utility',
    shortDescription: {
      en: 'Generates an illusion image based on a prompt.'
    },
    longDescription: {
      en: 'Generates an illusion image using the IllusionDiff API.'
    },
    guide: {
      en: '{pn} [prompt]: generates an illusion image based on the provided prompt.'
    }
  },
  onStart: async function ({ api, event, args }) {
    const imageUrl = event.messageReply && event.messageReply.attachments[0].url ? event.messageReply.attachments[0].url : null;

    if (!imageUrl) {
      return api.sendMessage('❌ No image replied. Please reply to an image to use this command.', event.threadID, event.messageID);
    }

    const shortenedUrl = await global.utils.shortenURL(imageUrl);

    const prompt = args.join(" ");

    try {
      api.sendMessage('⏳ Creating your illusion...', event.threadID);

      const response = await axios.get(`https://celestial-dainsleif-docs.archashura.repl.co/illusion?image=${shortenedUrl}&prompt=${prompt}`);

      if (response.status !== 200 || !response.data || !response.data.output || response.data.output.length === 0) {
        throw new Error('Invalid or missing response from the IllusionDiff API');
      }

      const illusionImageUrl = response.data.output[0];

      const stream = await global.utils.getStreamFromURL(illusionImageUrl);

      if (!stream) {
        throw new Error('Failed to fetch illusion image from URL');
      }

      await api.sendMessage({
        attachment: stream
      }, event.threadID, event.messageID);

      console.log('Sent illusion image to the user');
    } catch (error) {
      console.error(`Failed to generate and send illusion image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to generate and send an illusion image. Please try again later.', event.threadID, event.messageID);
    }
  }
};
