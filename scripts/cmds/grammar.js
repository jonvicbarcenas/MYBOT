module.exports = {
  config: {
    name: "fixgrammar",
    aliases: ["fixgram", "gram", "grammar"],
    version: "1.4",
    author: "dain | jvb",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Wrong grammar? Ew, fix it with this command."
    },
    longDescription: {
      en: "Fixes your embarrassing grammar."
    },
    category: "AI",
    guide: {
      en: "{pn} [content]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    const prefix = global.GoatBot.config.prefix;
    const commandName = this.config.name;
    const pn = prefix + commandName;
    let { threadID, messageID } = event;
    const jvb = args.join(" ");

    if (!jvb) {
      return api.sendMessage(
        `❌ Wrong Format\nUse: ${pn} [content]`,
        threadID,
        messageID
      );
    }

    try {
      const res = await axios.get(
        `https://chatgayfeyti.archashura.repl.co?gpt=fix grammar "${jvb}" and put the corrected grammar inside the [" "].`,
      );
      const { content } = res.data;
      api.sendMessage(`📜 Correct Paragraph:\n\n${content}`, threadID, messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage("❌ An error occurred while making the API request.", threadID, messageID);
    }
  }
};
