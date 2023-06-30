const fs = require("fs");

module.exports = {
  config: {
    name: "rps",
    version: "1.0",
    author: "JV BARCENAS",
    countDown: 10,
    shortDescription: "Play rock-paper-scissors game with the bot.",
    category: "fun",
    guide: "{prefix}rps <rock|paper|scissors|✊|✋|✌️>"
  },

  langs: {
    vi: {
      rpsWin: "Bạn đã chiến thắng! 🎉 You won 150 coins!",
      rpsLose: "Bạn đã thua! 😔 You lost 100 coins!",
      rpsTie: "Hòa! ⚖️ It's a tie! 10 coins!",
      rpsInvalidChoice: "Vui lòng chọn rock, paper, scissors, ✊, ✋, hoặc ✌️!"
    },
    en: {
      rpsWin: "You won! 🎉 You won 150 coins!",
      rpsLose: "You lost! 😔 You lost 100 coins!",
      rpsTie: "It's a tie! ⚖️ You got 10 coins!",
      rpsInvalidChoice: "Please choose either rock, paper, scissors, ✊, ✋, or ✌️!"
    }
  },

  onStart: async function ({ args, message, event, getLang }) {
    const { senderID } = event;

    const textChoices = ["rock", "paper", "scissors"];
    const emojiChoices = ["✊", "✋", "✌️"];

    const userChoice = args[0];

    if (!userChoice || (!textChoices.includes(userChoice.toLowerCase()) && !emojiChoices.includes(userChoice))) {
      return message.reply(getLang("rpsInvalidChoice"));
    }

    let botChoice;

    if (textChoices.includes(userChoice.toLowerCase())) {
      botChoice = textChoices[Math.floor(Math.random() * textChoices.length)];
    } else {
      botChoice = emojiChoices[Math.floor(Math.random() * emojiChoices.length)];
    }

    const resultMessage = `You chose ${userChoice}. I chose ${botChoice}.`;

    if (userChoice.toLowerCase() === botChoice || userChoice === botChoice) {
      const tieMessage = getLang("rpsTie");
      const amountToAdd = 10;
      // Add money to user's bank data
      const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
      const userID = senderID.toString();
      if (bankData[userID]) {
        bankData[userID].bank += amountToAdd;
      } else {
        bankData[userID] = {
          bank: amountToAdd
        };
      }
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2), "utf8");
      message.reply(`${resultMessage}\n${tieMessage}`);
    } else if (
      (userChoice.toLowerCase() === "rock" && botChoice === "scissors") ||
      (userChoice.toLowerCase() === "paper" && botChoice === "rock") ||
      (userChoice.toLowerCase() === "scissors" && botChoice === "paper") ||
      (userChoice === "✊" && botChoice === "✌️") ||
      (userChoice === "✋" && botChoice === "✊") ||
      (userChoice === "✌️" && botChoice === "✋")
    ) {
      const winMessage = getLang("rpsWin");
      const amountToAdd = 150;
      // Add money to user's bank data
      const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
      const userID = senderID.toString();
      if (bankData[userID]) {
        bankData[userID].bank += amountToAdd;
      } else {
        bankData[userID] = {
          bank: amountToAdd
        };
      }
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2), "utf8");
      message.reply(`${winMessage}\n${resultMessage}`);
    } else {
      const loseMessage = getLang("rpsLose");
      const amountToDeduct = 100;
      // Deduct money from user's bank data
      const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
      const userID = senderID.toString();
      if (bankData[userID]) {
        bankData[userID].bank -= amountToDeduct;
      }
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2), "utf8");
      message.reply(`${loseMessage}\n${resultMessage}`);
    }
  },
};
