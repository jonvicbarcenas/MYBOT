const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "generate",
    aliases: ["gen"],
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "shesh",
      en: "Get text to image"
    },
    longDescription: {
      en: "Get text to image"
    },
    category: "media",
    guide: {
      en: "{pn} prompt"
    }
  },

  onStart: async function({ api, event, args }) {
    const keySearch = args.join(" ");
    if (!keySearch) {
      return api.sendMessage(
        `Please enter a prompt using the format: ${global.GoatBot.config.prefix}${this.config.name} your prompt`,
        event.threadID,
        event.messageID
      );
    }

    // Send the "Processing your request" message
    const processingMessage = await api.sendMessage(
      "Processing your request...",
      event.threadID
    );

    try {
      const res = await axios.get(
        `https://midjourneyrepli.archashura.repl.co/?prompt=${encodeURIComponent(keySearch)}`
      );

      if (res.status === 200) {
        const imageURL = res.data.result[0];

        const path = __dirname + `/cache/1.png`;
        const getDown = (await axios.get(`${imageURL}`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(path, Buffer.from(getDown, "utf-8"));

        const message = {
          body: `Generated image: ${keySearch}`,
          attachment: fs.createReadStream(path)
        };

        // Reply to the processing message with the image attachment
        api.sendMessage(message, event.threadID, (error, messageInfo) => {
          // Delete the image file from the folder after sending
          fs.unlinkSync(path);

          if (!error) {
            // Delete the processing message
            api.deleteMessage(processingMessage.messageID);
          }
        });
      } else {
        api.sendMessage(
          `An error occurred while fetching the image: Status ${res.status}`,
          event.threadID,
          event.messageID
        );
        api.deleteMessage(processingMessage.messageID);
      }
    } catch (error) {
      api.sendMessage(
        `An error occurred while fetching the image: ${error.message}`,
        event.threadID,
        event.messageID
      );
      api.deleteMessage(processingMessage.messageID);
    }
  }
};