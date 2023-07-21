const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "setmoney",
    version: "1.0",
    author: "JV BARCENAS",
    shortDescription: "Set the amount of virtual coins for the mentioned users or yourself.",
    category: "fun",
    role: 2,
    countDown: 3000,
    guide: "{prefix}setmoney <amount> [@user1 @user2 ...]"
  },

  langs: {
    vi: {
      setMoneySuccess: "Đã cài đặt số tiền cho người dùng!",
      setMoneyInvalidAmount: "Số tiền không hợp lệ. Vui lòng nhập một số nguyên dương!",
      syntaxError: "Cú pháp không đúng. Vui lòng sử dụng: {prefix}setmoney <amount> [@user1 @user2 ...]"
    },
    en: {
      setMoneySuccess: "Successfully set money for the mentioned users!",
      setMoneyInvalidAmount: "Invalid amount. Please enter a positive integer!",
      syntaxError: "Incorrect syntax. Please use: {prefix}setmoney <amount> [@user1 @user2 ...]"
    }
  },

  onStart: async function ({ args, api, event, getLang, usersData }) {
    const { mentions, senderID, threadID, messageReply } = event;
  
    const amount = parseInt(args[0]);
  
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage(getLang("setMoneyInvalidAmount"), threadID);
    }
  
    let msg = "";
  
    // Helper function to get the name of a user by ID, either from mentions or usersData
    async function getUserName(userID) {
      const mentionedUser = mentions[userID];
      if (mentionedUser) {
        return mentionedUser.replace("@", "");
      } else {
        const user = await usersData.getName(userID);
        return user || "someone";
      }
    }
  
    // If there is a replied message, set money for the user who sent the replied message
    if (messageReply) {
      const repliedUserID = messageReply.senderID;
      const repliedUserName = await getUserName(repliedUserID);
      setMoneyForUser(repliedUserID, amount);
      const senderName = await usersData.getName(senderID);
  
      if (repliedUserID === senderID) {
        msg += `You set money for yourself: ${amount}\n`;
      } else {
        msg += `${senderName} sets money for ${repliedUserName}: ${amount}\n`;
      }
    } else {
      // Otherwise, set money for mentioned users whose ID starts with "1000"
      const mentionedIDs = Object.keys(mentions);
  
      for (const id of mentionedIDs) {
        const userID = id.toString();
        if (/^1000/.test(userID)) {
          const userName = await getUserName(userID);
          setMoneyForUser(userID, amount);
          const senderName = await usersData.getName(senderID);
  
          if (userID === senderID) {
            msg += `You set money for yourself: ${amount}\n`;
          } else {
            msg += `${senderName} sets money for ${userName}: ${amount}\n`;
          }
        }
      }
    }
  
    // If no valid mentions and no replied message, set money for the user who triggered the command
    if (msg === "") {
      const receiverID = senderID.toString();
      const receiverName = await getUserName(receiverID);
      setMoneyForUser(receiverID, amount);
      const senderName = await usersData.getName(senderID);
  
      if (receiverID === senderID) {
        msg += `You set money for yourself: ${amount}\n`;
      } else {
        msg += `${senderName} sets money for ${receiverName}: ${amount}\n`;
      }
    }
  
    api.sendMessage(msg, threadID);
  },
};

function setMoneyForUser(userID, amount) {
  // Update user's bank data with the desired amount
  const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
  bankData[userID] = {
    bank: amount,
    lastInterestClaimed: bankData[userID]?.lastInterestClaimed || 0 // Preserve the existing "lastInterestClaimed" value if it exists
  };
  fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2), "utf8");
}