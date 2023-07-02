const fs = require('fs');
const path = require('path');
const { getTime } = global.utils;

module.exports = {
  config: {
    name: "thread",
    version: "1.4",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Manage group chat"
    },
    longDescription: {
      en: "Manage group chat in bot system"
    },
    category: "owner",
    guide: {
      en: "   {pn} [find | -f | search | -s] <name to find>: search group chat in bot data by name"
        + "\n   {pn} [find | -f | search | -s] [-j | joined] <name to find>: search group chat in bot data that bot still joined by name"
        + "\n   {pn} [ban | -b] [<tid> | leave blank] <reason>: use to ban group with id <tid> or current group using bot"
        + "\n   Example:"
        + "\n    {pn} ban 3950898668362484 spam bot"
        + "\n    {pn} ban spam too much"
        + "\n\n   {pn} unban [<tid> | leave blank] to unban group with id <tid> or current group"
        + "\n   Example:"
        + "\n    {pn} unban 3950898668362484"
        + "\n    {pn} unban"
    }
  },

  langs: {
    en: {
      noPermission: "You don't have permission to use this feature",
      found: "🔎 Found %1 group matching the keyword \"%2\" in bot data:\n%3",
      notFound: "❌ No group found matching the keyword: \"%1\" in bot data",
      hasBanned: "Group with id [%1 | %2] has been banned before:\n» Reason: %3\n» Time: %4",
      banned: "Banned group with id [%1 | %2] using bot.\n» Reason: %3\n» Time: %4",
      notBanned: "Group with id [%1 | %2] is not banned using bot",
      unbanned: "Unbanned group with tid [%1 | %2] using bot",
      missingReason: "Ban reason cannot be empty",
      info: "» Box ID: %1\n» Name: %2\n» Date created data: %3\n» Total members: %4\n» Boy: %5 members\n» Girl: %6 members\n» Total messages: %7%8"
    }
  },

  onStart: async function ({ args, threadsData, message, role, event, getLang }) {
    const type = args[0];

    switch (type) {
      case 'find':
      case 'search':
      case '-f':
      case '-s': {
        if (role < 2)
          return message.reply(getLang("noPermission"));
        let allThread = await threadsData.getAll();
        let keyword = args.slice(1).join(" ");
        if (['-j', '-join'].includes(args[1])) {
          allThread = allThread.filter(thread => thread.members.some(member => member.userID == global.GoatBot.botID && member.inGroup));
          keyword = args.slice(2).join(" ");
        }
        const result = allThread.filter(item => item.threadID.length > 15 && (item.threadName || "").toLowerCase().includes(keyword.toLowerCase()));
        const resultText = result.reduce((i, thread) => i += `\n╭Name: ${thread.threadName}\n╰ID: ${thread.threadID}`, "");
        let msg = "";
        if (result.length > 0)
          msg += getLang("found", result.length, keyword, resultText);
        else
          msg += getLang("notFound", keyword);
        message.reply(msg);
        break;
      }

      case 'ban':
      case '-b': {
        if (role < 2)
          return message.reply(getLang("noPermission"));
        let tid, reason;
        if (!isNaN(args[1])) {
          tid = args[1];
          reason = args.slice(2).join(" ");
        }
        else {
          tid = event.threadID;
          reason = args.slice(1).join(" ");
        }
        if (!tid)
          return message.SyntaxError();
        if (!reason)
          return message.reply(getLang("missingReason"));
        reason = reason.replace(/\s+/g, ' ');
        const threadData = await threadsData.get(tid);
        const name = threadData.threadName;
        const status = threadData.banned.status;

        if (status)
          return message.reply(getLang("hasBanned", tid, name, threadData.banned.reason, threadData.banned.date));
        const time = getTime("DD/MM/YYYY HH:mm:ss");
        await threadsData.set(tid, {
          banned: {
            status: true,
            reason,
            date: time
          }
        });

        // Save banned data to banned.json
        const bannedData = {
          tid: tid,
          name: name,
          reason: reason,
          date: time,
          status: 'on'
        };

        const bannedFilePath = path.join(__dirname, 'banned.json');
        let bannedJson = [];

        try {
          const existingData = fs.readFileSync(bannedFilePath, 'utf8');
          bannedJson = JSON.parse(existingData);
        } catch (error) {
          console.error('Error reading banned.json:', error);
        }

        bannedJson.push(bannedData);

        try {
          fs.writeFileSync(bannedFilePath, JSON.stringify(bannedJson, null, 2), 'utf8');
        } catch (error) {
          console.error('Error writing to banned.json:', error);
        }

        return message.reply(getLang("banned", tid, name, reason, time));
      }

      case 'unban':
      case '-u': {
        if (role < 2)
          return message.reply(getLang("noPermission"));
        let tid;
        if (!isNaN(args[1]))
          tid = args[1];
        else
          tid = event.threadID;
        if (!tid)
          return message.SyntaxError();

        const threadData = await threadsData.get(tid);
        const name = threadData.threadName;
        const status = threadData.banned.status;

        if (!status)
          return message.reply(getLang("notBanned", tid, name));
        await threadsData.set(tid, {
          banned: {}
        });

        // Remove banned data from banned.json
        const bannedFilePath = path.join(__dirname, 'banned.json');

        try {
          const existingData = fs.readFileSync(bannedFilePath, 'utf8');
          const bannedJson = JSON.parse(existingData);
          const updatedJson = bannedJson.filter(entry => entry.tid !== tid);
          fs.writeFileSync(bannedFilePath, JSON.stringify(updatedJson, null, 2), 'utf8');
        } catch (error) {
          console.error('Error updating banned.json:', error);
        }

        return message.reply(getLang("unbanned", tid, name));
      }

      // Other case statements...

      default: {
        // Default behavior...
      }
    }
  }
};
