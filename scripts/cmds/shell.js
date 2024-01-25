const { exec } = require("child_process");

module.exports = {
  config: {
    name: "terminal",
    aliases: ["shell", "$"],
    author: "Tokodori × Liane", // Convert To Goat By Tokodori
    role: 2,
    shortDescription: " ",
    longDescription: "asking ",
    category: "ai",
    guide: "{pn}",
  },

  onStart: async function ({ event, message, args }) {
    const allowedUserIds = ["100007150668975"];
    
    // Check if the user is authorized
    if (!allowedUserIds.includes(event.senderID)) {
      message.reply("You don't have permission to use this command.");
      return;
    }

    // Check if there are input arguments
    if (args.length === 0) {
      message.reply("Input arguments are required. Please provide a command to execute.");
      return;
    }

    message.reaction('🚀');
    exec(args.join(" "), (error, stdout, stderr) => {
      let result = "";
      if (error) {
        result += `Error: ${error.message}\n`;
      }
      if (stdout) {
        result += `${stdout}\n`;
      }
      if (stderr) {
        result += `${stderr}\n`;
      }

      message.reply(result);
      message.reaction("✅");
    });
  },
};