const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "dain",
    version: "1.0",
    author: "JV BARCENAS",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "ASK DAIN POWERED BY BARD-GPT",
      en: "ASK DAIN POWERED BY BARD-GPT"
    },
    longDescription: {
      vi: "ASK DAIN POWERED BY BARD-GPT",
      en: "ASK DAIN POWERED BY BARD-GPT"
    },
    category: "ai"
  },
  //onStart: async function ({ api, event, args, message, threadsData, usersData }) {
    //return api.sendMessage(
      //`testing`,
     // event.threadID,
      //event.messageID
    //);
  //},
  onStart: async function({ message, event, args, commandName, api, threadsData, usersData }) {
    const id = event.senderID;
    const prompt = args.join(" ");

    // Check if the prompt is empty or not provided
    if (!prompt) {
      message.reply({
        body: "Please enter a prompt or question."
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID
        });
      });
      return; // Exit the function, as there's nothing to process further
    }

    try {
      const response = await axios.get(`https://bard-gpt.corpselaugh.repl.co/?id=${id}&ask=${encodeURIComponent(prompt)}`);

      const content = response.data.content;
      const links = response.data.links;
      const cacheFolder = path.join(__dirname, "cache");

      if (links && links.length > 0) {
        // Create an array to store the downloaded image filenames
        const downloadedImageFileNames = [];

        // Loop through the image links and download/save them
        for (let i = 0; i < links.length; i++) {
          const imageUrl = links[i];

          // Download the image
          const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

          // Save the image to the cache folder with the specified filename format
          if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
          }
          const imageFileName = path.join(cacheFolder, `test${i + 1}.png`);
          fs.writeFileSync(imageFileName, imageResponse.data);

          // Add the downloaded image filename to the array
          downloadedImageFileNames.push(imageFileName);
        }

        // Send the text content along with all downloaded images as attachments to the user
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

            // After sending the attachments, delete the image files
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
        // If there are no image links, send the text content only
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
  onReply: async function({ message, event, Reply, args }) {
    let { author, commandName, messageID } = Reply;
    if (event.senderID != author) return;
    const id = event.senderID;
    const prompt = args.join(" ");

    try {
      const response = await axios.get(`https://bard-gpt.corpselaugh.repl.co/?id=${id}&ask=${encodeURIComponent(prompt)}`);

      const content = response.data.content;
      const links = response.data.links;
      const cacheFolder = path.join(__dirname, "cache");

      if (links && links.length > 0) {
        // Create an array to store the downloaded image filenames
        const downloadedImageFileNames = [];

        // Loop through the image links and download/save them
        for (let i = 0; i < links.length; i++) {
          const imageUrl = links[i];

          // Download the image
          const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

          // Save the image to the cache folder with the specified filename format
          if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
          }
          const imageFileName = path.join(cacheFolder, `test${i + 1}.png`);
          fs.writeFileSync(imageFileName, imageResponse.data);

          // Add the downloaded image filename to the array
          downloadedImageFileNames.push(imageFileName);
        }

        // Send the text content along with all downloaded images as attachments to the user
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

            // After sending the attachments, delete the image files
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
        // If there are no image links, send the text content only
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
