const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function image(args, event, message, shortenURL) {
  if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments[0] && event.messageReply.attachments[0].url) {
    const imageUrl = await shortenURL(event.messageReply.attachments[0].url);
    return imageUrl ? `&image=${imageUrl}` : '';
  } else {
    return '';
  }
}

module.exports = {
  config: {
    name: "dainz",
    version: "1.0",
    author: "JV BARCENAS",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "ASK BARD POWERED BY BARD-GPT",
      en: "ASK BARD POWERED BY BARD-GPT"
    },
    longDescription: {
      vi: "ASK BARD POWERED BY BARD-GPT",
      en: "ASK BARD POWERED BY BARD-GPT"
    },
    category: "ai"
  },
  onStart: async function ({ message, event, args, commandName, api, threadsData, usersData }) {
    const id = event.senderID;
    const prompt = args.join(" ");
    const imageQuery = await image(args, event, message, global.utils.shortenURL);

    if (!prompt) {
      message.reply({
        body: "Please enter a prompt or questions."
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID
        });
      });
      return;
    }

    try {
      const response = await axios.get(`https://celestial-dainsleif-docs.archashura.repl.co/bardgpt?id=${id}&ask=${encodeURIComponent(prompt)}${imageQuery}`);

      const content = response.data.content;
      const links = response.data.links;
      const cacheFolder = path.join(__dirname, "cache");

      if (links && links.length > 0) {
        const downloadedImageFileNames = [];

        for (let i = 0; i < links.length; i++) {
          const imageUrl = links[i];
          const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

          if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
          }
          const imageFileName = path.join(cacheFolder, `test${i + 1}.png`);
          fs.writeFileSync(imageFileName, imageResponse.data);

          downloadedImageFileNames.push(imageFileName);
        }

        const attachmentPromises = downloadedImageFileNames.map((imageFileName) => {
          return fs.createReadStream(imageFileName);
        });
        const attachments = await Promise.all(attachmentPromises);

        message.reply(
          {
            attachment: attachments,
            body: content,
          },
          (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID
            });

            for (const imageFileName of downloadedImageFileNames) {
              try {
                fs.unlinkSync(imageFileName);
                console.log(`Deleted ${imageFileName}`);
              } catch (error) {
                console.error("Error deleting file:", error.message);
              }
            }
          }
        );
      } else {
        message.reply({
          body: content
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID
          });
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  },

  onReply: async function ({ message, event, Reply, args }) {
    let { author, commandName, messageID } = Reply;
    if (event.senderID != author) return;
    const id = event.senderID;
    const prompt = args.join(" ");
    const imageQuery = await image(args, event, message, global.utils.shortenURL);

    try {
      const response = await axios.get(`https://celestial-dainsleif-docs.archashura.repl.co/bardgpt?id=${id}&ask=${encodeURIComponent(prompt)}${imageQuery}`);

      const content = response.data.content;
      const links = response.data.links;
      const cacheFolder = path.join(__dirname, "cache");

      if (links && links.length > 0) {
        const downloadedImageFileNames = [];

        for (let i = 0; i < links.length; i++) {
          const imageUrl = links[i];
          const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

          if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
          }
          const imageFileName = path.join(cacheFolder, `test${i + 1}.png`);
          fs.writeFileSync(imageFileName, imageResponse.data);

          downloadedImageFileNames.push(imageFileName);
        }

        const attachmentPromises = downloadedImageFileNames.map((imageFileName) => {
          return fs.createReadStream(imageFileName);
        });
        const attachments = await Promise.all(attachmentPromises);

        message.reply(
          {
            attachment: attachments,
            body: content,
          },
          (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID
            });

            for (const imageFileName of downloadedImageFileNames) {
              try {
                fs.unlinkSync(imageFileName);
                console.log(`Deleted ${imageFileName}`);
              } catch (error) {
                console.error("Error deleting file:", error.message);
              }
            }
          }
        );
      } else {
        message.reply({
          body: content
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID
          });
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
};
