const axios = require("axios");

module.exports = {
  config: {
    name: "bard1",
    version: "1.0",
    author: "loufi",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "._."
    },
    longDescription: {
      vi: "",
      en: ""
    },
    category: "Bard"
  },
  onStart: async function ({ message, event, args, commandName }) {
    const userID = event.senderID;
    const prompt = args.join(" ");

    try {
      const response = await axios.get("https://bardapibyloufi.projectofloufi.repl.co/bard", {
        params: {
          prompt: prompt,
          userID: userID
        }
      });

      message.reply(
        {
          body: `${response.data.response}`
        },
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      );
    } catch (error) {
      console.error("Error:", error.message);
    }
  },
  onReply: async function ({ message, event, args }) {
    let { author, commandName, messageID } = Reply;
    if (event.senderID != author) return;
    const userID = author;
    const prompt = args.join(" ");

    try {
      const response = await axios.get("https://bardapibyloufi.projectofloufi.repl.co/bard", {
        params: {
          prompt: prompt,
          userID: userID
        }
      });
      if (response.data.response == "Your conversation has been reset.") {
        global.GoatBot.onReply.delete(messageID);
        message.reply("DONE ✅");
      } else {
        message.reply(
          {
            body: `${response.data.response}`
          },
          (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID
            });
          }
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
};
