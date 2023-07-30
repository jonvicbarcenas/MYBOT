const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "rest",
    aliases: ['sleep'],
    version: "1.0",
    author: "JVB",
    role: 2,
    shortDescription: {
      vi: "Cập nhật thời gian nghỉ",
      en: "Update rest time",
    },
    longDescription: {
      vi: "Cập nhật thời gian nghỉ",
      en: "Update rest time",
    },
    category: "Owner",
    guide: {
      vi: "   {pn}: Cập nhật thời gian nghỉ",
      en: "   {pn}: Update rest time",
    },
  },

  langs: {
    vi: {
      updateSuccess: "✅ | Đã cập nhật thời gian nghỉ:",
    },
    en: {
      updateSuccess: "✅ | Rest time updated! Waking at :",
    },
  },

  onLoad: function ({ api }) {
    const pathFile = `${__dirname}/tmp/rest.txt`;
    if (fs.existsSync(pathFile)) {
      const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
      api.sendMessage(
        `✅ | The Bot is awake.\n⏰ | The time taken was: ${(Date.now() - time) / 1000}s`,
        tid
      );
      fs.unlinkSync(pathFile);
    }
  },

  onStart: async function ({ message, event, args, getLang, api }) {
    const permission = ["100007150668975"];

    if (!permission.includes(event.senderID)) {
      return api.sendMessage(
        "You don't have permission to use this command.",
        event.threadID,
        event.messageID
      );
    }

    if (args.length < 2) {
      await message.reply("❌ | Invalid format. Use: rest <hours> <minutes>");
      return;
    }

    const hours = parseInt(args[0]);
    const minutes = parseInt(args[1]);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
      await message.reply(
        "❌ | Invalid input. Hours and minutes must be non-negative integers."
      );
      return;
    }

    let timeData;
    try {
      timeData = fs.readJSONSync("time.json");
    } catch (error) {
      timeData = {
        hour: 0,
        minute: 0,
        second: 0,
        timezone: "Asia/Manila",
      };
    }

    const currentTime = moment().tz(timeData.timezone);
    currentTime.add(hours, "hours");
    currentTime.add(minutes, "minutes");
    timeData.hour = currentTime.hours();
    timeData.minute = currentTime.minutes();

    fs.writeJSONSync("time.json", timeData, { spaces: 2 });

    const restFolderPath = path.join("rest");
    const accountFilePath = path.join("account.txt");
    const accountFileDestination = path.join(restFolderPath, "account.txt");

    fs.ensureDirSync(restFolderPath);
    fs.moveSync(accountFilePath, accountFileDestination, { overwrite: true });

    await message.reply(`${getLang("updateSuccess")} ${currentTime.format("HH:mm")}`);

    const pathFile = `${__dirname}/tmp/rest.txt`;
    fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);

    process.exit(2);
  },
};
