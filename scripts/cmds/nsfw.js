const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "nsfw",
    aliases: [],
    version: "1.0.0",
    author: "JV Barcenas",
    role: 0,
    shortDescription: {
      en: "Get NSFW command details",
    },
    longDescription: {
      en:
        "This command displays the names and details of NSFW commands.",
    },
    category: "Utility",
    guide: {
      en: "{prefix}nsfw",
    },
  },

  onStart: function ({ api, event }) {
    const commandFiles = fs.readdirSync(__dirname);

    const thisFileName = path.basename(__filename); // Get the current filename
    const unloadedCommands =
      global.GoatBot.configCommands.commandUnload || [];

    const nsfwCommands = [];
    const unloadedNsfwCommands = [];

    commandFiles.forEach((file) => {
      if (file.endsWith(".js") && file !== thisFileName) {
        const commandPath = path.join(__dirname, file);
        const commandData = require(commandPath);

        if (commandData.config.category === "NSFW") {
          if (unloadedCommands.includes(file)) {
            unloadedNsfwCommands.push(commandData.config.name);
          } else {
            nsfwCommands.push({
              name: commandData.config.name,
              shortDescription: commandData.config.shortDescription.en,
              longDescription: commandData.config.longDescription.en,
            });
          }
        }
      }
    });

    if (nsfwCommands.length === 0 && unloadedNsfwCommands.length === 0) {
      return api.sendMessage(
        "No NSFW commands available.",
        event.threadID,
        event.messageID
      );
    }

    let message = "𝐇𝐄𝐑𝐄 𝐀𝐑𝐄 𝐒𝐎𝐌𝐄 𝐍𝐒𝐅𝐖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒\n\n";

    if (nsfwCommands.length > 0) {
      const commandInfo = nsfwCommands
        .map(
          (command) =>
            `𝐍𝐚𝐦𝐞: /${command.name}\n𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${command.shortDescription}\n`
        )
        .join("\n");
      message += `𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐍𝐒𝐅𝐖 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n${commandInfo}\n`;
    }

    if (unloadedNsfwCommands.length > 0) {
      const unloadedCommandsList = unloadedNsfwCommands
        .map((command) => `- ${command}`)
        .join("\n");
      message += `𝐔𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐍𝐒𝐅𝐖 𝐜𝐦𝐝 𝐛𝐲 𝐭𝐡𝐞 𝐀𝐝𝐦𝐢𝐧𝐬\n${unloadedCommandsList}\n`;
    }

    api.sendMessage(message, event.threadID, event.messageID);
  },
};
