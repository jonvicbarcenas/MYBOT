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
    category: "game",
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
      alreadyReceived: "You have already received the gift",
      received: "You have received %1 coin and %2 exp",
      jobCompleted: "Grats choyy! You have earned $300 for your job pagpatuloy mo lang.",
      alreadyJobCompleted: "Sorry hehe, come back tomorrow gwapo ko na kase"
    }
  },

  onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const lastJobDate = userData.data.lastJobDate;
    const bankData = JSON.parse(fs.readFileSync("bank.json"));

    // Check if the user has already done the job today
    if (lastJobDate && moment().isSame(lastJobDate, 'day')) {
      return message.reply(getLang("alreadyJobCompleted"));
    }

    if (args.length > 0) {
      const userInput = args.join(" ");
      if (userInput === "gwapo si jv") {
        userData.data.lastJobDate = moment().format("YYYY-MM-DD");
        await usersData.set(senderID, userData);

        // Add money to user's bank data
        const userID = senderID.toString();
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
      }
    }

    return message.reply("sabihin mo '/job gwapo si jv'");
  }
};