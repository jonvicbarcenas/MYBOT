const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hentai",
    version: "1.0.0",
    author: "JV Barcenas",
    role: 0,
    countDown: 5,
    shortDescription: {
      en: "Get a random hentai image",
    },
    longDescription: {
      en: "This command returns a random image using the sussy API.",
    },
    category: "NSFW",
    guide: {
      en: "{prefix}randomimage",
    },
  },

  onStart: async function ({ api, event }) {
    try {
      const bankFilePath = path.join(process.cwd(), "bank.json");
      const bankData = fs.readFileSync(bankFilePath, "utf8");
      const bank = JSON.parse(bankData);

      const userId = event.senderID;
      const userBank = bank[userId]?.bank;
      const cost = 2190;

      if (userBank === undefined || userBank < cost) {
        return api.sendMessage(
          `Sorry, you must pay $2190, but you don't have enough money in your bank account🤪🤪..\ntype: '/bank' to check your balance`,
          event.threadID,
          event.messageID
        );
      }

      // Deduct the cost from the user's bank account
      bank[userId].bank -= cost;
      fs.writeFileSync(bankFilePath, JSON.stringify(bank, null, 2), "utf8");

      const res = await axios.get(
        "https://api.heckerman06.repl.co/api/nsfw/hentai?apikey=danielxd",
        { responseType: "arraybuffer" }
      );
      const imgPath = path.join(__dirname, "cache", `random.jpg`);
      await fs.outputFile(imgPath, res.data);
      const imgData = fs.createReadStream(imgPath);

      const sentMessage = await api.sendMessage(
        {
          attachment: imgData,
        },
        event.threadID
      );

      const messageID = sentMessage.messageID;

      setTimeout(async () => {
        await api.unsendMessage(messageID);
      }, 3000);

      await fs.remove(path.join(__dirname, "cache"));
    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `An error occurred. Please try again later.`,
        event.threadID,
        event.messageID
      );
    }
  },
};
