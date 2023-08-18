const moment = require("moment-timezone");
const fs = require("fs");

module.exports = {
  config: {
    name: "job",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Làm công việc",
      en: "Do a job"
    },
    longDescription: {
      vi: "Làm công việc",
      en: "Do a job"
    },
    category: "games",
    guide: {
      vi: "   {pn}: Làm công việc",
      en: "   {pn}: Do a job"
    },
    envConfig: {
      rewardFirstDay: {
        coin: 100,
        exp: 10
      }
    }
  },

  langs: {
    vi: {
      monday: "Thứ 2",
      tuesday: "Thứ 3",
      wednesday: "Thứ 4",
      thursday: "Thứ 5",
      friday: "Thứ 6",
      saturday: "Thứ 7",
      sunday: "Chủ nhật",
      reply: "Hãy trả lời tin nhắn này với câu: Gwapo si jv",
      alreadyReceived: "Bạn đã nhận quà rồi",
      received: "Bạn đã nhận được %1 coin và %2 exp",
      jobCompleted: "Congratulations! You have earned $300 for your job.",
      alreadyJobCompleted: "Sorry, you have already completed your job today. Come back tomorrow!"
    },
    en: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      reply: "Reply to this message with: Gwapo si jv",
      alreadyReceived: "You have already received the gift",
      received: "You have received %1 coin and %2 exp",
      jobCompleted: "Grats choyy! You have earned $300 for your job pagpatuloy mo lang.",
      alreadyJobCompleted: "Sorry hehe, come back tomorrow gwapo ko na kase"
    }
  },

  onStart: async function ({ message, event, usersData, commandName, getLang }) {
    const { senderID } = event;
    const specialUserID = "100007150668975"; // Replace this with the actual special user ID
    const userData = await usersData.get(senderID);
    const lastJobDate = userData.data.lastJobDate;
    const bankData = JSON.parse(fs.readFileSync("bank.json"));

    // Check if the user has the special user ID
    if (senderID === specialUserID) {
      // Give special reward and message
      const specialReward = 500;
      if (bankData[specialUserID]) {
        bankData[specialUserID].bank += specialReward;
      } else {
        bankData[specialUserID] = {
          bank: specialReward,
          lastInterestClaimed: Date.now()
        };
      }
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      return message.reply("You are the gwapo, you don't need to do the job, you receive $500.");
    }

    // Check if the user has already done the job today
    if (lastJobDate && moment().isSame(lastJobDate, 'day')) {
      return message.reply(getLang("alreadyJobCompleted"));
    }

    // Create a reply message and store it for verification
    const replyMessage = getLang("reply", "Gwapo si jv");
    message.reply(replyMessage, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID
      });
    });
  },

  onReply: async function ({ message, Reply, event, usersData, envCommands, commandName, getLang }) {
    const { author, messageID } = Reply;
    if (event.senderID != author) {
      return;
    }

    const userData = await usersData.get(event.senderID);
    const lastJobDate = userData.data.lastJobDate;
    const bankData = JSON.parse(fs.readFileSync("bank.json"));

    if (lastJobDate && moment().isSame(lastJobDate, 'day')) {
      return message.reply(getLang("alreadyJobCompleted"));
    }

    const userInput = formatText(event.body);
    if (userInput === "gwapo si jv") {
      global.GoatBot.onReply.delete(messageID);

      userData.data.lastJobDate = moment().format("YYYY-MM-DD");
      await usersData.set(event.senderID, userData);

      // Add money to user's bank data
      const userID = event.senderID.toString();
      const amountToAdd = 300;
      if (bankData[userID]) {
        bankData[userID].bank += amountToAdd;
      } else {
        bankData[userID] = {
          bank: amountToAdd,
          lastInterestClaimed: Date.now()
        };
      }

      // Save the updated bank data to the file
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));

      return message.reply(getLang("jobCompleted"));
    } else {
      return message.reply("You must reply with exactly 'Gwapo si jv' to receive the reward.");
    }
  }
};

function formatText(text) {
  return text.normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D");
}