const os = require('os');

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "1.0",
    author: "Dainsleif & Johnxyryll-Orig-code",
    role: 0,
    shortDescription: {
      en: "Displays the uptime and machine specifications of the bot."
    },
    longDescription: {
      en: "Displays the amount of time that the bot has been running for and machine specifications."
    },
    category: "utility",
    guide: {
      en: "Use {p}uptime to display the uptime and machine specifications of the bot."
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const uptime = process.uptime();
      const seconds = Math.floor(uptime % 60);
      const minutes = Math.floor((uptime / 60) % 60);
      const hours = Math.floor((uptime / (60 * 60)) % 24);
      const days = Math.floor(uptime / (60 * 60 * 24));

      const uptimeMessage = `Bot Uptime: ${days} day(s), ${hours} hour(s), ${minutes} minute(s), ${seconds} second(s)`;

      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = `Memory Usage: ${((totalMemory - freeMemory) / totalMemory * 100).toFixed(2)}%`;

      const cpuModel = os.cpus()[0].model;
      const cpuSpeed = os.cpus()[0].speed;
      const cpuInfo = `CPU: ${cpuModel} @ ${cpuSpeed} MHz`;

      const osType = os.type();
      const osRelease = os.release();
      const osInfo = `OS: ${osType} ${osRelease}`;

      const machineSpecs = `${memoryUsage}\n${cpuInfo}\n${osInfo}`;

      console.log('Sending message:', uptimeMessage);
      console.log('Sending message:', machineSpecs);

      return api.sendMessage(`Hello User, here is the bot's uptime:\n${uptimeMessage}\n\nMachine Specifications:\n${machineSpecs}`, event.threadID, event.messageID);
    } catch (error) {
      console.error('Error occurred:', error);
      return api.sendMessage("Error occurred during the uptime and machine specifications check.", event.threadID);
    }
  }
};