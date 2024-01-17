const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0.2",
    author: "JVB",
    role: 0,
    countDown: 50,
    shortDescription: {
      en: "Search for images on Pinterest"
    },
    longDescription: {
      en: ""
    },
    category: "Search",
    guide: {
      en: "{prefix}pinterest <search query> -<number of images>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const userID = event.senderID;

      const keySearch = args.join(" ");
      if (!keySearch.includes("-")) {  
        return api.sendMessage(`Please enter the search query and number of images to return in the format: ${this.config.guide.en}`, event.threadID, event.messageID);
      }
      const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
      const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 6;

      const res = await axios.get(`https://celestial-3ode.onrender.com/pinterest?pinte=${encodeURIComponent(keySearchs)}`);
      const data = res.data.data;

      // Check if 'data' is defined
      if (!data) {
        return api.sendMessage(`No data found for the specified search query. Please try again.`, event.threadID, event.messageID);
      }

      const imgData = [];

      for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
        const { title, image, url } = data[i];
        const imgResponse = await axios.get(image, { responseType: 'arraybuffer' });

        const imgPath = path.join(__dirname, 'cache', `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push({ title, url, image: fs.createReadStream(imgPath) });
      }

      const messageContent = imgData.map(({ title, url }) => `${title}\n${url}`).join('\n\n');

      await api.sendMessage({
        body: `Here are the top ${imgData.length} image results for "${keySearchs}":\n\n${messageContent}`,
        attachment: imgData.map(({ image }) => image),
      }, event.threadID, event.messageID);

      await fs.remove(path.join(__dirname, 'cache'));
    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred. Please try again later.`, event.threadID, event.messageID);
    }
  }
};
