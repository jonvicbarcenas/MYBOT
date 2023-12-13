const axios = require("axios");

module.exports = {
  config: {
    name: "generate",
    aliases: ["gen"],
    version: "1.0",
    author: "DAINSLEIF",
    countDown: 12,
    role: 0,
    shortDescription: {
      vi: "Tạo hình ảnh dựa trên yêu cầu",
      en: "Generate image based on a prompt"
    },
    longDescription: {
      vi: "Tạo hình ảnh dựa trên yêu cầu và gửi đến người dùng",
      en: "Generate image based on a prompt and send to the user"
    },
    category: "info",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const prompt = args.join(' ');
      if (!prompt) {
        return api.sendMessage("Please provide a prompt!", event.threadID, event.messageID);
      }

       api.sendMessage("⌛ | Creating your Imagination...", event.threadID, event.messageID);

      const response = await axios.get(`https://celestial-dainsleif-docs.archashura.repl.co/prodia?prompt=${encodeURIComponent(prompt)}`);

      if (!response.data || !response.data.url) {
        return api.sendMessage("An error occurred while generating the image!", event.threadID, event.messageID);
      }

      const messageData = {
        attachment: await global.utils.getStreamFromURL(response.data.url)
      };

      return api.sendMessage(messageData, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("An error occurred while generating the image!", event.threadID, event.messageID);
    }
  }
};
