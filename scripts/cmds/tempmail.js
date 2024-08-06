const axios = require("axios");

module.exports = {
  config: {
    name: "tempmail",
    aliases: ["tmp"],
    version: "0.0.2",
    author: "James, CREDITS TO SENSUI FOR DEEZ NUTZ API",
    countdown: 5,
    role: 0,
    category: "generate",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const apiUrl = "https://api.mail.tm";

    if (!args[0]) {
      api.sendMessage(`Usage: ${global.GoatBot.config.prefix}tempmail gen\n\nTo get the messages:\n\nUse ${global.GoatBot.config.prefix}tempmail inbox [email]\nExample: ${global.GoatBot.config.prefix}tempmail inbox example@mail.com`, threadID, messageID);
    } else if (args[0] === "gen") {
      try {
        const response = await axios.post(`${apiUrl}/accounts`, {
          // Make sure to include required data for creating an account
        });
        const email = response.data.address;
        api.sendMessage(`Here's your temporary email:\n\n${email}`, threadID, messageID);
      } catch (error) {
        api.sendMessage("An error occurred while generating a temporary email.", threadID, messageID);
      }
    } else if (args[0] === "inbox") {
      const email = args[1];
      try {
        // Retrieve account ID from the email address
        const accountResponse = await axios.get(`${apiUrl}/accounts`);
        const account = accountResponse.data.find(acc => acc.address === email);

        if (!account) {
          api.sendMessage(`No account found for the provided email address: ${email}`, threadID, messageID);
          return;
        }

        const messagesResponse = await axios.get(`${apiUrl}/accounts/${account.id}/messages`);
        const messages = messagesResponse.data;

        if (messages.length > 0) {
          let inboxMessage = "INBOX:\n\n";
          for (let i = 0; i < Math.min(messages.length, 10); i++) {
            const sender = messages[i].sender;
            const subject = messages[i].subject || "No Subject";
            const messageContent = messages[i].message || "No Content";
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
