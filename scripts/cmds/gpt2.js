const axios = require("axios");

module.exports = {
  config: {
    name: "gpt2",
    version: "1.0",
    author: "SiAM",
    countDown: 15,
    role: 0,
    shortDescription: {
      vi: "",
      en: ""
    },
    longDescription: {
      vi: "",
      en: "GPT backup"
    },
    category: "AI",
    guide: {
      en: "{pn} 'prompt'\nExample:\n{pn} who are you"
    }
  },
  onStart: async function ({ message, event, args, commandName }) {
    
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);
    const prompt = args.join(' ');
    if (!prompt) {
      message.reply(`Please provide some text.\n\nExample: ${p}gpt hi there`);
      return;
    }
    try {
      const response = await axios.get("https://apis.marinmain.repl.co/chatbot/gpt", {
        params: {
          ask: prompt,
          apikey: "siamxmarin77"
        }
      });

      if (response.status === 200 && response.data.status === "success") {
        message.reply({ body: `𝙂𝙋𝙏:\n\n${response.data.answer}` });
      } else {
        console.error("API Error:", response.data);
        sendErrorMessage(message, "I don't know the answer to this question.");
      }

    } catch (error) {
      console.error("Request Error:", error.message);
      sendErrorMessage(message, "Server not responding..\ntry again.");
    }
  }
};

function sendErrorMessage(message, errorMessage) {
  message.reply({ body: errorMessage });
}