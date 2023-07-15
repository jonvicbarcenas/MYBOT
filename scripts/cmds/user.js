const fs = require('fs');
const path = require('path');
const { getTime } = global.utils;

// Get the absolute file path for "bannedusers.json"
const bannedUsersFilePath = path.join(__dirname, 'bannedusers.json');

module.exports = {
  config: {
    name: "user",
    version: "1.3",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Manage users"
    },
    longDescription: {
      en: "Manage users in bot system"
    },
    category: "owner",
    guide: {
      vi: "   {pn}",
      en: "   {pn} [find | -f | search | -s] <name to find>: search for users in bot data by name" +
        "\n" +
        "\n   {pn} [ban | -b] [<uid> | @tag | reply message] <reason>: to ban user with id <uid> or tagged user or sender of message replied using bot" +
        "\n" +
        "\n   {pn} unban [<uid> | @tag | reply message]: to unban user using bot"
    }
  },

  langs: {
    en: {
      noUserFound: "❌ No user found with name matching keyword: \"%1\" in bot data",
      userFound: "🔎 Found %1 user with name matching keyword \"%2\" in bot data:\n%3",
      uidRequired: "Uid of user to ban cannot be empty, please enter uid or tag or reply message of 1 user by user ban <uid> <reason>",
      reasonRequired: "Reason to ban user cannot be empty, please enter uid or tag or reply message of 1 user by user ban <uid> <reason>",
      userHasBanned: "User with id [%1 | %2] has been banned before:\n» Reason: %3\n» Date: %4",
      userBanned: "User with id [%1 | %2] has been banned:\n» Reason: %3\n» Date: %4",
      uidRequiredUnban: "Uid of user to unban cannot be empty",
      userNotBanned: "User with id [%1 | %2] is not banned",
      userUnbanned: "User with id [%1 | %2] has been unbanned"
    }
  },

  onStart: async function ({ args, usersData, message, event, prefix, getLang }) {
    const type = args[0];
    switch (type) {
			case "find":
			case "-f":
			case "search":
			case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				const msg = result.reduce((i, user) => i += `\n╭Name: ${user.name}\n╰ID: ${user.userID}`, "");
				message.reply(result.length == 0 ? getLang("noUserFound", keyWord) : getLang("userFound", result.length, keyWord, msg));
				break;
			}
      case "ban":
      case "-b": {
        let uid, reason;
        if (event.type === "message_reply") {
          uid = event.messageReply.senderID;
          reason = args.slice(1).join(" ");
        } else if (Object.keys(event.mentions).length > 0) {
          const { mentions } = event;
          uid = Object.keys(mentions)[0];
          reason = args.slice(1).join(" ").replace(mentions[uid], "");
        } else if (args[1]) {
          uid = args[1];
          reason = args.slice(2).join(" ");
        } else {
          return message.SyntaxError();
        }

        if (!uid)
          return message.reply(getLang("uidRequired"));
        if (!reason)
          return message.reply(getLang("reasonRequired", prefix));
        reason = reason.replace(/\s+/g, ' ');

        const userData = await usersData.get(uid);
        const name = userData.name;
        const status = userData.banned.status;

        if (status)
          return message.reply(getLang("userHasBanned", uid, name, userData.banned.reason, userData.banned.date));
        const time = getTime("DD/MM/YYYY HH:mm:ss");
        await usersData.set(uid, {
          banned: {
            status: true,
            reason,
            date: time
          }
        });

        // Save banned user data in "bannedusers.json" file
        const bannedUserData = {
          userID: uid,
          name: name,
          reason: reason,
          date: time,
          status: "on"
        };

        fs.readFile(bannedUsersFilePath, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          let bannedUsers = [];
          if (data) {
            bannedUsers = JSON.parse(data);
          }

          bannedUsers.push(bannedUserData);

          fs.writeFile(bannedUsersFilePath, JSON.stringify(bannedUsers, null, 2), 'utf8', err => {
            if (err) {
              console.error(err);
              return;
            }

            console.log("Banned user data saved successfully.");
          });
        });

        message.reply(getLang("userBanned", uid, name, reason, time));
        break;
      }
      case "unban":
      case "-u": {
        let uid;
        if (event.type === "message_reply") {
          uid = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
          const { mentions } = event;
          uid = Object.keys(mentions)[0];
        } else if (args[1]) {
          uid = args[1];
        } else {
          return message.SyntaxError();
        }

        if (!uid)
          return message.reply(getLang("uidRequiredUnban"));
        const userData = await usersData.get(uid);
        const name = userData.name;
        const status = userData.banned.status;
        if (!status)
          return message.reply(getLang("userNotBanned", uid, name));

        // Remove banned user data from "bannedusers.json" file
        fs.readFile(bannedUsersFilePath, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          let bannedUsers = [];
          if (data) {
            bannedUsers = JSON.parse(data);
          }

          const index = bannedUsers.findIndex(user => user.userID === uid);
          if (index !== -1) {
            bannedUsers.splice(index, 1);

            fs.writeFile(bannedUsersFilePath, JSON.stringify(bannedUsers, null, 2), 'utf8', err => {
              if (err) {
                console.error(err);
                return;
              }

              console.log("Banned user data removed successfully.");
            });
          }
        });

        await usersData.set(uid, {
          banned: {}
        });
        message.reply(getLang("userUnbanned", uid, name));
        break;
      }
      default:
        return message.SyntaxError();
    }
  }
};
