const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "rps",
    version: "1.0",
    author: "JV BARCENAS",
    countDown: 10,
    shortDescription: "Play rock-paper-scissors game with the bot.",
    category: "games",
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

  choices: {
    rock: {
      label: "rock",
      image: "https://i.imgur.com/uAEjEMr.gif"
    },
    paper: {
      label: "paper",
      image: "https://i.imgur.com/0YEYqXC.gif"
    },
    scissors: {
      label: "scissors",
      image: "https://i.imgur.com/y1t798S.gif"
    },
    "✊": {
      label: "✊",
      image: "https://i.imgur.com/uAEjEMr.gif"
    },
    "✋": {
      label: "✋",
      image: "https://i.imgur.com/0YEYqXC.gif"
    },
    "✌": {
      label: "✌️",
      image: "https://i.imgur.com/y1t798S.gif"
    }
  },

  onStart: async function ({ args, api, event, getLang }) {
    const { senderID } = event;

    const userChoice = args[0];

    if (!userChoice || !(userChoice in this.choices)) {
      return api.sendMessage(getLang("rpsInvalidChoice"), event.threadID);
    }

    const botChoices = Object.keys(this.choices);
    const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];

    const resultMessage = `You chose ${this.choices[userChoice].label}. I chose ${this.choices[botChoice].label}.`;
    const resultImage = this.choices[botChoice].image;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    const cacheFilePath = path.join(cacheDir, "rps.gif");

    downloadFile(resultImage, cacheFilePath, (error) => {
      if (error) {
        console.error("Failed to download image:", error);
        return api.sendMessage("Failed to download image. Please try again.", event.threadID);
      }

      if (userChoice === botChoice) {
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
        const message = `${resultMessage}\n${tieMessage}`;
        sendRpsMessage(api, event.threadID, message, cacheFilePath);
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
        const message = `${winMessage}\n${resultMessage}`;
        sendRpsMessage(api, event.threadID, message, cacheFilePath);
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
        const message = `${loseMessage}\n${resultMessage}`;
        sendRpsMessage(api, event.threadID, message, cacheFilePath);
      }
    });
  },
};

function downloadFile(url, filePath, callback) {
  const file = fs.createWriteStream(filePath);
  const request = https.get(url, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      file.close(callback);
    });
  }).on("error", function (error) {
    fs.unlink(filePath);
    if (callback) callback(error.message);
  });
}

function sendRpsMessage(api, threadID, message, filePath) {
  api.sendMessage(
    {
      body: message,
      attachment: fs.createReadStream(filePath)
    },
    threadID,
    (error, messageInfo) => {
      if (error) {
        console.error("Failed to send message:", error);
      } else {
        console.log("Message sent successfully");
      }
    }
  );
}
