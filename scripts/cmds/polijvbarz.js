const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

function getNSFWWords() {
  const filePath = path.join(__dirname, 'badword.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const nsfwWords = JSON.parse(jsonData).words;
  return nsfwWords;
}

function sanitizeInput(input) {
  return input.replace(/[^\w\s]/gi, '').toLowerCase();
}

module.exports = {
  config: {
    name: "poli",   
    aliases: ["pollination"],
    version: "1.2",
    author: "jameslim | mod jvb", //goat modified
    countDown: 45,
    role: 0,
    shortDescription: {
      en: "generate image from pollination"
    },
    longDescription: {
      en: "generate image from pollination"
    },
    category: "image",
    guide: {
      en: '{pn} [prompt]'
    }
  },

  onStart: async function ({ api, event, args }) {
    let { threadID } = event;
    let query = args.join(" ");
    if (!query) return api.sendMessage("put text/query", threadID);

    // Sanitize the user-provided query
    const sanitizedQuery = sanitizeInput(query);

    // Check for NSFW prompts
    const nsfwWords = getNSFWWords();
    if (nsfwWords.some(word => sanitizedQuery.includes(word))) {
      return api.sendMessage("The provided prompt contains NSFW content. Please provide a different prompt.", threadID);
    }

    try {
      const poli = (await axios.get(`https://image.pollinations.ai/prompt/${query}`, {
        responseType: "arraybuffer",
      })).data;

      let path = __dirname + `/tmp/poli.png`;
      fs.writeFileSync(path, Buffer.from(poli, "utf-8"));

      api.sendMessage({
        body: "Image generated",
        attachment: fs.createReadStream(path),
      }, threadID);

      // Optionally, you may want to set a timer to delete the image after a certain period
      // setTimeout(() => fs.unlinkSync(path), 3600000); // Deletes the image after 1 hour (3600000 milliseconds).
    } catch (error) {
      console.error("Error generating image:", error);
      api.sendMessage("An error occurred while generating the image.", threadID);
    }
  },
};
