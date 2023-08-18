const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "generate",
    aliases: ["text2img"],
    version: "1.0",
    author: "JV Goat Mod| Prince Sanel",
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

    try {
      const res = await axios.get(
        `https://text2img.bo090909.repl.co/?prompt=${encodeURIComponent(keySearch)}`
      );

      if (res.status === 200) {
        const data = res.data.imageURLs;
        const imgData = [];

        for (let i = 0; i < 4; i++) {
          const path = __dirname + `/cache/${i + 1}.jpg`;
          const getDown = (await axios.get(`${data[i]}`, { responseType: "arraybuffer" })).data;
          fs.writeFileSync(path, Buffer.from(getDown, "utf-8"));
          imgData.push(fs.createReadStream(__dirname + `/cache/${i + 1}.jpg`));
        }

        api.sendMessage(
          {
            attachment: imgData,
            body: `4 Search results for keyword: ${keySearch}`
          },
          event.threadID,
          event.messageID
        );

        for (let i = 0; i < 4; i++) {
          fs.unlinkSync(__dirname + `/cache/${i + 1}.jpg`);
        }

      } else {
        api.sendMessage(
          `An error occurred while fetching images: Status ${res.status}`,
          event.threadID,
          event.messageID
        );
      }
    } catch (error) {
      api.sendMessage(
        `An error occurred while fetching images: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
