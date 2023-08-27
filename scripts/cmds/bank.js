const fs = require("fs");

module.exports = {
  config: {
    name: "bank",
    version: "1.9",
    author: "LøüFï/alrulex | JV",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "virtual bank system"
    },
    longDescription: {
      vi: "",
      en: "Bank system updated by jv"
    },
    category: "banking",
    guide: {
      vi: "",
      en: "{pn} [transfer | withdraw | show | deposit | interest]\nbank transfer (amount) (uid of who you want to transfer) without ()\nbank interest: get interest.\nbank show: show money in your account.\nbank deposit (amount of your money)\nbank withdraw (amount of money)"
    }
  },
  onStart: async function ({ args, message, event, usersData }) {
    const userMoney = await usersData.get(event.senderID, "money");
    const user = parseInt(event.senderID);
    const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));

    if (!bankData[user]) {
      bankData[user] = {
        bank: 0,
        lastInterestClaimed: Date.now()
      };
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
    }

    const command = args[0];
    const amount = parseInt(args[1]);
    const recipientUID = parseInt(args[2]);

    if (command === "deposit") {
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Please enter the amount you wish to deposit in the bank.");
      }
      if (userMoney < amount) {
        return message.reply("You don't have enough money.");
      }

      bankData[user].bank += amount;
      await usersData.set(event.senderID, {
        money: userMoney - amount
      });

      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      return message.reply(`${amount} $ has been deposited into your bank account.`);
    } else if (command === "withdraw") {
      const balance = bankData[user].bank || 0;

      if (isNaN(amount) || amount <= 0) {
        return message.reply("Please enter the amount you wish to withdraw from your bank account.");
      }

      if (amount > balance) {
        return message.reply("The amount you want to withdraw is not available in your bank account.");
      }

      bankData[user].bank = balance - amount;
      const userMoney = await usersData.get(event.senderID, "money");
      await usersData.set(event.senderID, {
        money: userMoney + amount
      });

      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      return message.reply(`${amount} $ has been withdrawn from your bank account.`);
    } else if (command === "show") {
      const balance = bankData[user].bank !== undefined && !isNaN(bankData[user].bank) ? bankData[user].bank : 0;

      return message.reply(`Your bank account balance is ${balance} $.`);
    } else if (command === "interest") {
      const interestRate = 0.0001;
      const lastInterestClaimed = bankData[user].lastInterestClaimed || Date.now();
      const currentTime = Date.now();
      const timeDiffInSeconds = (currentTime - lastInterestClaimed) / 1000;
      const interestEarned = bankData[user].bank * (interestRate / 365) * timeDiffInSeconds;

      bankData[user].lastInterestClaimed = currentTime;
      bankData[user].bank += interestEarned;

      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      return message.reply(`Interest has been added to your bank account balance. The interest earned is ${interestEarned.toFixed(2)} $.`);
    } else if (command === "transfer") {
      const balance = bankData[user].bank || 0;

      if (isNaN(amount) || amount <= 0) {
        return message.reply("Please enter the amount you wish to transfer to the recipient.");
      }

      if (balance < amount) {
        return message.reply("The amount you wish to transfer is greater than your bank account balance.");
      }

      if (!isValidUID(recipientUID)) {
        return message.reply("Please enter a valid recipient ID (15 digits starting with UserID-1000***).");
      }

      if (!bankData[recipientUID]) {
        bankData[recipientUID] = {
          bank: 0,
          lastInterestClaimed: Date.now()
        };
        fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      }

      bankData[user].bank -= amount;
      bankData[recipientUID].bank += amount;

      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
      return message.reply(`${amount} converted to the recipient with id ${recipientUID}.`);
    } else {
      return message.reply("========[Bank]========\nThe following services are available:\n❏/bank deposit: Put money into the bank.\n❏/bank withdraw: withdraw money from the bank from your account.\n❏/bank show: Show the amount of your bank account.\n❏/bank interest: You get good interest.\n⭓ use /help bank to know how to use.======================");
    }
  }
};

function isValidUID(uid) {
  const uidString = uid.toString();
  return uidString.length === 15 && uidString.startsWith("1000");
}

/*DO NOT CHANGE CREDIT 🐸*/
