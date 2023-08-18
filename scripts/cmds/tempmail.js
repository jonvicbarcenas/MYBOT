const axios = require("axios");

module.exports = {
  config: {
    name: "tempmail",
    aliases: ["tmp"],
    version: "0.0.1",
    author: "James, CREDITS TO SENSUI FOR DEEZ NUTZ API", //goat mod by JV Barcenas and added new functions
    countdown: 5,
    role: 0,
    category: "generate",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      api.sendMessage(`Usage: ${global.GoatBot.config.prefix}tempmail gen\n\nTo get the messages:\n\nUse ${global.GoatBot.config.prefix}tempmail inbox [email]\nExample: ${global.GoatBot.config.prefix}tempmail inbox culyqdbm78o3@kzccv.com`, threadID, messageID);
    } else if (args[0] === "gen") {
      try {
        const response = await axios.get("https://tempmail-api.codersensui.repl.co/api/gen");
        const email = response.data.email;
        api.sendMessage(`Here's your temporary email:\n\n${email}`, threadID, messageID);
      } catch (error) {
        api.sendMessage("No messages found for the provided email address", threadID, messageID);
      }
    } else if (args[0] === "inbox") {
      const email = args[1];
      try {
        const response = await axios.get(`https://tempmail-api.codersensui.repl.co/api/getmessage/${email}`);
        const messages = response.data.messages;
        if (messages.length > 0) {
          let inboxMessage = "INBOX:\n\n";
          for (let i = 0; i < Math.min(messages.length, 10); i++) {
            const sender = messages[i].sender;
            const subject = messages[i].subject;
            const messageContent = messages[i].message;
            inboxMessage += `Sender: ${sender}\nSubject: ${subject}\nMessage: ${messageContent}\n\n`;
          }
          api.sendMessage(inboxMessage, threadID, messageID);
        } else {
          api.sendMessage(`No messages found for the provided email address: ${email}`, threadID, messageID);
        }
      } catch (error) {
        api.sendMessage("An error occurred while fetching inbox messages.", threadID, messageID);
      }
    }
  }
};
