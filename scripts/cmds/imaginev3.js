const axios = require('axios');

module.exports = {
  config: {
    name: "imagine",
    version: "1.1",
    author: "MILAN",
    shortDescription: {
      en: "Create image from your text."
    },
    longDescription: {
      en: "Create image from your text."
    },
    category: "media",
    role: 0,
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const permission = ["100007150668975"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage(
        "You don't have permission to use this command.",
        event.threadID,
        event.messageID
      );
    }

    const prompt = args.join(" ");
    if (!prompt) return message.reply("Add something");

    message.reply("✅ | Creating your Imagination...", async (err, info) => {
      let ui = info.messageID;
      try {
        const response = await axios.get(`https://milanbhandari.imageapi.repl.co/makeimggg?prompt=${encodeURIComponent(prompt)}`);
        const img = response.data.combinedImageUrl;
        message.unsend(ui); 
        message.reply({
          body: "Here's your imagination 🖼️.\nPlease reply with the image number (1, 2, 3, 4) to get the corresponding image in high resolution.",
          attachment: await global.utils.getStreamFromURL(img)
        }, async (err, info) => {
          let id = info.messageID;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            imageUrls: response.data.imageUrls 
          });
        });
      } catch (error) {
        console.error(error);
        api.sendMessage(`Error: ${error}`, event.threadID);
      }
    });
  },

  onReply: async function ({ api, event, Reply, usersData, args, message }) {
    const reply = parseInt(args[0]);
    const { author, messageID, imageUrls } = Reply;
    if (event.senderID !== author) return;
    try {
      if (reply >=1 && reply <= 4) {
        const img = imageUrls[`image${reply}`];
        message.reply({ attachment: await global.utils.getStreamFromURL(img) });
      } else {
        message.reply("Invalid image number. Please reply with a number between 1 and 4.");
      }
    } catch (error) {
      console.error(error);
      api.sendMessage(`Error: ${error}`, event.threadID);
    }
  message.unsend(Reply.messageID);
  },
};