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

    const nsfwCommands = commandFiles
      .filter(
        (file) =>
          file.endsWith(".js") &&
          file !== thisFileName &&
          !unloadedCommands.includes(file)
      )
      .map((file) => {
        const commandPath = path.join(__dirname, file);
        const commandData = require(commandPath);

        if (commandData.config.category === "NSFW") {
          return {
            name: commandData.config.name,
            shortDescription: commandData.config.shortDescription.en,
            longDescription: commandData.config.longDescription.en,
          };
        } else {
          return null; // Return null for non-NSFW commands
        }
      })
      .filter(Boolean);

    if (nsfwCommands.length === 0) {
      return api.sendMessage(
        "No NSFW commands available.",
        event.threadID,
        event.messageID
      );
    }

    const commandInfo = nsfwCommands
      .map(
        (command) =>
          `𝐍𝐚𝐦𝐞: /${command.name}\n𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${command.shortDescription}\n`
      )
      .join("\n");

    const header = "𝐇𝐄𝐑𝐄 𝐀𝐑𝐄 𝐒𝐎𝐌𝐄 𝐍𝐒𝐅𝐖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒";
    const message = `${header}\n\n${commandInfo}`;

    api.sendMessage(message, event.threadID, event.messageID);
  },
};