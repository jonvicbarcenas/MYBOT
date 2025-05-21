const axios = require("axios");

module.exports = {
  config: {
    name: "tempmail",
    aliases: ["tmp"],
    version: "0.0.4",
    author: "James, CREDITS TO SENSUI FOR DEEZ NUTZ API",
    countdown: 5,
    role: 0,
    category: "generate",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const apiUrl = "https://api.mail.tm";

    if (!args[0]) {
      api.sendMessage(`Usage: ${global.GoatBot.config.prefix}tempmail gen\n\nTo get the messages:\n\nUse ${global.GoatBot.config.prefix}tempmail inbox [email] [password]\nExample: ${global.GoatBot.config.prefix}tempmail inbox example@dcpa.net password123`, threadID, messageID);
    } else if (args[0] === "gen") {
      try {
        // First fetch available domains
        const domainsResponse = await axios.get(`${apiUrl}/domains`);
        const domains = domainsResponse.data["hydra:member"];
        
        if (!domains || domains.length === 0) {
          api.sendMessage("No email domains available at the moment. Please try again later.", threadID, messageID);
          return;
        }
        
        // Use the first available domain (usually dcpa.net)
        const domain = domains[0].domain;
        
        // Generate random username
        const randomUsername = Math.random().toString(36).substring(2, 10);
        const randomPassword = Math.random().toString(36).substring(2, 10);
        const email = `${randomUsername}@${domain}`;
        
        const response = await axios.post(`${apiUrl}/accounts`, {
          address: email,
          password: randomPassword
        });

        api.sendMessage(`Here's your temporary email:\n\nEmail: ${email}\nPassword: ${randomPassword}\n\nTo check messages, use: ${global.GoatBot.config.prefix}tempmail inbox ${email} ${randomPassword}`, threadID, messageID);
      } catch (error) {
        console.error("Tempmail error:", error.response?.data || error.message);
        api.sendMessage("An error occurred while generating a temporary email.", threadID, messageID);
      }
    } else if (args[0] === "inbox") {
      const email = args[1];
      const password = args[2];
      
      if (!email || !password) {
        api.sendMessage(`Please provide both email and password.\nExample: ${global.GoatBot.config.prefix}tempmail inbox example@dcpa.net password123`, threadID, messageID);
        return;
      }
      
      try {
        // Login to get token
        const loginResponse = await axios.post(`${apiUrl}/token`, {
          address: email,
          password: password
        });
        
        const token = loginResponse.data.token;
        
        // Get messages using the token
        const messagesResponse = await axios.get(`${apiUrl}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const messages = messagesResponse.data["hydra:member"] || messagesResponse.data;

        if (messages.length > 0) {
          let inboxMessage = "📬 INBOX:\n\n";
          for (let i = 0; i < Math.min(messages.length, 10); i++) {
            const message = messages[i];
            const sender = message.from?.address || "Unknown Sender";
            const subject = message.subject || "No Subject";
            
            // Get message content
            const messageDetailResponse = await axios.get(`${apiUrl}/messages/${message.id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            const messageContent = messageDetailResponse.data.text || "No Content";
            inboxMessage += `From: ${sender}\nSubject: ${subject}\nMessage: ${messageContent}\n\n`;
          }
          api.sendMessage(inboxMessage, threadID, messageID);
        } else {
          api.sendMessage(`No messages found for the email address: ${email}`, threadID, messageID);
        }
      } catch (error) {
        console.error("Tempmail inbox error:", error.response?.data || error.message);
        api.sendMessage("An error occurred while fetching inbox messages. Make sure your email and password are correct.", threadID, messageID);
      }
    }
  }
};
