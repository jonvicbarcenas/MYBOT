module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "1.0",
    author: "Dainsleif",
    role: 0,
    shortDescription: {
      en: "Displays the uptime of the bot."
    },
    longDescription: {
      en: "Displays the amount of time that the bot has been running for."
    },
    category: "utility",
    guide: {
      en: "Use {p}uptime to display the uptime of the bot."
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const uptime = process.uptime();
      const seconds = Math.floor(uptime % 60);
      const minutes = Math.floor((uptime / 60) % 60);
      const hours = Math.floor((uptime / (60 * 60)) % 24);
      const days = Math.floor(uptime / (60 * 60 * 24));

      const uptimeMessage = `Bot Uptime: ${days} days(s) \n${hours} hour(s) \n${minutes} minute(s) \n${seconds} seconds`;

      console.log('Sending message:', uptimeMessage);
      return api.sendMessage(`Hello User, here is the bot's uptime:\n${uptimeMessage}`, event.threadID);
    } catch (error) {
      console.error('Error occurred:', error);
      return api.sendMessage("Error occurred during the uptime check.", event.threadID);
    }
  }
};