const fs = require('fs');
const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
  config: {
    name: "totalban",
    version: "1.6",
    author: "jvb",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Lệnh ban tổng hợp",
      en: "Total ban command"
    },
    longDescription: {
      uid: "Ban người dùng và lưu thông tin vào totalban.json",
      en: "Ban a user and save information to totalban.json"
    },
    category: "moderation",
    guide: {
      vi: "   {pn} <number>: Ban người bằng user ID và lưu thông tin vào totalban.json"
        + "\n   Phản hồi tin nhắn của người khác kèm lệnh để ban và lưu thông tin vào totalban.json"
        + "\n   {pn} unban <number>: Bỏ ban người dùng và cập nhật totalban.json",
      en: "   {pn} <number>: Ban user by user ID and save information to totalban.json"
        + "\n   Reply to someone's message with the command to ban and save information to totalban.json"
        + "\n   {pn} unban <number>: Unban a user and update totalban.json"
    }
  },

  langs: {
    vi: {
      syntaxError: "Vui lòng nhập một số nguyên để ban.",
      banned: "Người dùng đã được ban và thông tin đã được lưu vào totalban.json",
      alreadyBanned: "Người dùng đã được ban trước đó và không thể ban lại",
      unbanned: "Người dùng đã được bỏ ban và thông tin đã được cập nhật trong totalban.json"
    },
    en: {
      syntaxError: "Please enter an uid(integer) to ban.",
      banned: "User has been banned, and information has been saved to totalban.json",
      alreadyBanned: "User has been previously banned and cannot be banned again",
      unbanned: "User has been unbanned, and information has been updated in totalban.json"
    }
  },

  onStart: async function ({ message, event, args, getLang }) {
    const currentDate = new Date().toLocaleDateString('en-GB');

    if (args[0] === 'unban') {
      if (args[1]) {
        const unbannedID = args[1];
        fs.readFile('totalban.json', 'utf8', (readErr, data) => {
          if (readErr) {
            console.error(`Error reading totalban.json: ${readErr.message}`);
            return;
          }

          let existingData = [];
          try {
            existingData = JSON.parse(data);
          } catch (parseError) {
            console.error(`Error parsing totalban.json: ${parseError.message}`);
          }

          const updatedData = existingData.filter((ban) => ban.banID !== unbannedID);
          fs.writeFile('totalban.json', JSON.stringify(updatedData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
              console.error(`Error writing to totalban.json: ${writeErr.message}`);
            } else {
              console.log('Data has been updated in totalban.json (user unbanned)');
              message.reply(getLang("unbanned"));
            }
          });
        });
      } else {
        return message.reply("Please provide the ID of the user you want to unban.");
      }
    } else {
      // Remaining part of the code for banning users (unchanged)
      const totalBanData = [];

      if (args[0]) {
        for (const arg of args) {
          const isNumeric = /^\d+$/.test(arg);
          if (isNumeric) {
            const isAlreadyBanned = totalBanData.some((ban) => ban.banID === arg);
            if (!isAlreadyBanned) {
              totalBanData.push({ banID: arg, date: currentDate });
            } else {
              return message.reply(getLang("alreadyBanned"));
            }
          } else {
            return message.reply(getLang("syntaxError"));
          }
        }
      } else if (event.messageReply) {
        const bannedUserID = event.messageReply.senderID;
        totalBanData.push({ banID: bannedUserID, date: currentDate });
      } else {
        return message.reply(getLang("syntaxError"));
      }

      fs.readFile('totalban.json', 'utf8', (readErr, data) => {
        if (readErr) {
          console.error(`Error reading totalban.json: ${readErr.message}`);
          return;
        }

        let existingData = [];
        try {
          existingData = JSON.parse(data);
        } catch (parseError) {
          console.error(`Error parsing totalban.json: ${parseError.message}`);
        }

        const isAlreadyBanned = existingData.some((ban) => totalBanData.some((newBan) => newBan.banID === ban.banID));
        if (!isAlreadyBanned) {
          const updatedData = [...existingData, ...totalBanData];
          fs.writeFile('totalban.json', JSON.stringify(updatedData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
              console.error(`Error writing to totalban.json: ${writeErr.message}`);
            } else {
              console.log('Data has been saved to totalban.json');
              message.reply(getLang("banned"));
            }
          });
        } else {
          message.reply(getLang("alreadyBanned"));
        }
      });
    }
  }
};

