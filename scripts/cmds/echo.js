module.exports = {
  config: {
    name: "echo",
    aliases: ["repeat"],
    version: "1.0",
    author: "JV Barcenas",
    role: 0,
    shortDescription: {
      en: "Repeats the user's prompts or arguments."
    },
    longDescription: {
      en: "Echoes back whatever the user has prompted or entered as arguments."
    },
    category: "utility",
    guide: {
      en: "Use {p}echo <your_message> to have the bot repeat your message."
    }
  },
  onStart: async function ({ api, event, args }) {
    const echoMessage = args.join(" ");

    if (echoMessage) {
      api.sendMessage(`${echoMessage}`, event.threadID);
    } else {
      api.sendMessage("Please provide a message to echo.", event.threadID);
    }
  }
};
