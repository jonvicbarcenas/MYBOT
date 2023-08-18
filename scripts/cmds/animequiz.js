const axios = require("axios");
const { getStreamFromURL } = global.utils;
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

function getPlayerScore(playerID) {
  const aniquiztopPath = path.join(__dirname, "aniquiztop.json");
  const aniquiztopData = JSON.parse(fs.readFileSync(aniquiztopPath));
  const player = aniquiztopData.find(player => player.uid === playerID);
  return player ? player.correct : 0;
}

module.exports = {
  config: {
    name: "animequiz",
    aliases: ['anquiz', 'aniquiz'],
    version: "1.0",
    author: "JV Barcenas",
    countDown: 18,
    role: 0,
    shortDescription: {
      vi: "trò chơi câu hỏi",
      en: "quiz game for weebs"
    },
    longDescription: {
      en: "play anime quiz game for weebs"
    },
    category: "games",
    guide: {
      en: "{pn} <topic>"
    },
    envConfig: {
      reward: 1000
    }
  },

  langs: {
    vi: {
      reply: "Hãy reply tin nhắn này với câu trả lời",
      correct: "🎉 Chúc mừng bạn đã trả lời đúng và nhận được %1$",
      wrong: "⚠️ Bạn đã trả lời sai",
      invalidTopic: "Chủ đề câu hỏi không hợp lệ.",
      notPlayer: "Bạn không phải là người chơi.",
      timeout: "Oops timeout!!",
      guide: "{pn} <topic>"
    },
    en: {
      reply: "Please reply this message with the answer",
      ddd: "Please reply this message with the answer (word/s)\n-⌛15s",
      correct: "🎉 Congratulations you have answered correctly and received %1$",
      wrong: "⚠️ You have answered incorrectly",
      invalidTopic: "Invalid quiz topic.",
      notPlayer: "You are not a player.",
      timeout: "Oops timeout!!",
      guide: "{pn} <topic>",
      top: " ◦ ≫ SHOW TOP: {pn} top",
      score: " ◦ ≫ SHOW SCORE: {pn} score"
    }
  },

  onStart: async function ({ message, event, commandName, getLang, args }) {
    let topic = args[0]; // Assumes the topic is passed as the first argument

    if (!topic) {
      const availableTopics = getAvailableTopics();
      const formattedTopics = availableTopics.map(topic => `⪢${topic}`).join("\n");
      const tutorialMessage = `Here are some available anime topics:\n\n◤━━━━━━━━━◥\n${formattedTopics}\n◣━━━━━━━━━◢\n\n ◦ ≫ TUTORIAL: ${getLang("guide")} \n\n${getLang("top")}\n\n${getLang("score")}`;
      return message.reply(tutorialMessage);
    }

    // Handle variations of the "onepiece" topic
    if (topic.toLowerCase() === "op" || (topic.toLowerCase() === "one" && args[1] === "piece") || topic.toLowerCase() === "onepiece") {
      topic = "onepiece";
    }
    // Handle variations of the "tokyo revengers" topic
    else if (topic.toLowerCase() === "tr" || (topic.toLowerCase() === "tokyo" && args[1] === "revengers") || topic.toLowerCase() === "tokyorevengers") {
      topic = "tr";
    }
    else if (topic.toLowerCase() === "jjk" || (topic.toLowerCase() === "jujutsu" && args[1] === "kaisen") || topic.toLowerCase() === "jujutsukaisen") {
      topic = "jjk";
    }

    switch (topic) {
      case "top":
        const topPlayers = getTopPlayers(10); // Get top 10 players
        const topPlayersMessage = formatTopPlayersMessage(topPlayers, getLang);
        return message.reply(topPlayersMessage);

      case "score":
        const senderID = event.senderID.toString();
        const playerScore = getPlayerScore(senderID); // Retrieve the player's score
        return message.reply(`Your score is: ${playerScore}`);

      case "random":
        quizData = require(path.join(__dirname, "aniquiz/random/random.json"));
        break;

      case "onepiece":
        quizData = require(path.join(__dirname, "aniquiz/one piece | op/onepiece.json"));
        break;

      case "naruto":
        quizData = require(path.join(__dirname, "aniquiz/naruto/naruto.json"));
        break;

      case "jjba":
        quizData = require(path.join(__dirname, "aniquiz/jjba/jjba.json"));
        break;

      case "jjk":
        quizData = require(path.join(__dirname, "aniquiz/jujutsu kaisen | jjk/jjk.json"));
        break;

      case "tr":
        quizData = require(path.join(__dirname, "aniquiz/tokyo revengers | tr/tr.json"));
        break;

      default:
        // Handle invalid topic
        return message.reply(getLang("invalidTopic"));
    }

    const question = getRandomQuestion(quizData);
    const { question: questionText } = question;

    const prompt = topic === "flag" ? getLang("flag") : `${getLang("reply")} (letters)\n-⌛15s`; // Prompt for the correct words or letters

    const replyMessage = `${prompt}\n\n${questionText}`;

    message.reply({
      body: replyMessage
    }, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        question,
        playerData: {}
      });

      // Set a timeout of 20 seconds
      setTimeout(() => {
        const replyData = global.GoatBot.onReply.get(info.messageID);
        if (replyData) {
          const { messageID, question } = replyData;
          global.GoatBot.onReply.delete(messageID);
          message.unsend(messageID);
        }
      }, 15000); // 20 seconds in milliseconds
    });
  },

  onReply: async function ({ message, Reply, event, getLang, usersData, envCommands, commandName }) {
    const { author, question, messageID, playerData } = Reply;
    if (event.senderID != author)
      return message.reply(getLang("notPlayer"));

    const userAnswer = formatText(event.body);
    const correctAnswer = formatText(question.answer); // Normalize the correct answer

    if (userAnswer === correctAnswer) { // Compare the normalized answers
      global.GoatBot.onReply.delete(messageID);

      // Add money to the bank.json file
      const bankData = JSON.parse(fs.readFileSync("bank.json"));
      const userId = event.senderID.toString();
      if (!bankData[userId]) {
        bankData[userId] = {
          bank: 0,
          lastInterestClaimed: Date.now()
        };
      }
      bankData[userId].bank += envCommands[commandName].reward;
      fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));

      message.reply(getLang("correct", envCommands[commandName].reward));

      // Store user data with name
      const aniquiztopPath = path.join(__dirname, "aniquiztop.json");
      let aniquiztopData = [];
      try {
        aniquiztopData = JSON.parse(fs.readFileSync(aniquiztopPath));
      } catch (error) {
        console.error("Error reading aniquiztop.json:", error);
      }

      const senderID = event.senderID.toString();
      const userData = await usersData.get(senderID);
      const senderName = userData ? userData.name : "Unknown User";
      const playerIndex = aniquiztopData.findIndex(player => player.uid === senderID);
      if (playerIndex !== -1) {
        aniquiztopData[playerIndex].name = senderName; // Replace user ID with name in aniquiztop.json
        aniquiztopData[playerIndex].correct++;
      } else {
        aniquiztopData.push({ uid: senderID, name: senderName, correct: 1 });
      }
      fs.writeFileSync(aniquiztopPath, JSON.stringify(aniquiztopData));
    } else {
      message.reply(getLang("wrong"));
      if (!playerData[event.senderID]) {
        playerData[event.senderID] = { wrong: 0 };
      }
      playerData[event.senderID].wrong++;
    }

    message.unsend(event.messageReply.messageID);
  }
};

function getRandomQuestion(quizData) {
  const { questions } = quizData;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

function formatText(text) {
  return text.normalize("NFD").toUpperCase();
}

function getAvailableTopics() {
  const quizPath = path.join(__dirname, "aniquiz");
  const topics = fs.readdirSync(quizPath);
  return topics.map(topic => topic.replace(".json", ""));
}

function getTopPlayers(count) {
  const aniquiztopPath = path.join(__dirname, "aniquiztop.json");
  const aniquiztopData = JSON.parse(fs.readFileSync(aniquiztopPath));
  const sortedData = aniquiztopData.sort((a, b) => b.correct - a.correct);
  return sortedData.slice(0, count);
}

function formatTopPlayersMessage(players, getLang) {
  let message = "🏆 Anime-quiz Top Players 🏆\n\n";
  players.forEach((player, index) => {
    const { name, correct } = player;
    message += `${index + 1}. ${name} - ${correct}\n`;
  });
  return message;
}
