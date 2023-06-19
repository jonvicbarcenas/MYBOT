const axios = require("axios");
const fs = require("fs");

// Define the prefixes that trigger the module
const Prefixes = [
  'bard',
  '/bard',
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

module.exports = {
  config: {
    name: "bard",
    version: "1.0",
    author: "jvbarcenas",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "lol"
    },
    longDescription: {
      vi: "",
      en: ""
    },
    category: "Bard"
  },

  onStart: async function() {},
  onChat: async function ({ api, event }) {
    let { threadID, messageID } = event;

    // Check if the message starts with one of the defined prefixes
    const prefix = Prefixes.find(p => event.body && event.body.toLowerCase().startsWith(p));
    if (!prefix) {
      return; // Return early if the prefix is not found
    }

    const response = event.body.slice(prefix.length).trim();

    if (!response) {
      api.sendMessage("Please provide a question or query", threadID, messageID);
      return;
    }

    api.sendMessage("Searching for an answer, please wait...", threadID, messageID);

    try {
      const res = await axios.get(`https://barbatos.corpselaugh.repl.co/ask?question=${response}`);
      const responseData = res.data;

      const { content, links: images } = responseData;

      if (content && content.length > 0) {
        const attachment = [];

        if (!fs.existsSync("cache")) {
          fs.mkdirSync("cache");
        }

        for (let i = 0; i < images.length; i++) {
          const url = images[i];
          const photoPath = `cache/test${i + 1}.png`;

          try {
            const imageResponse = await axios.get(url, { responseType: "arraybuffer" });
            fs.writeFileSync(photoPath, imageResponse.data);

            attachment.push(fs.createReadStream(photoPath));
          } catch (error) {
            console.error("Error occurred while downloading and saving the photo:", error);
          }
        }

        api.sendMessage(
          {
            attachment: attachment,
            body: content,
          },
          threadID,
          messageID
        );
      } else {
        api.sendMessage(content, threadID, messageID);
      }
    } catch (error) {
      console.error("Error occurred while fetching data from the Bard API:", error);
      api.sendMessage("An error occurred while searching for an answer.", threadID, messageID);
    }
  }
};
