const axios = require("axios");
const { getStreamFromURL } = global.utils;
const path = require("path");
const fs = require("fs");

module.exports = {
  config: {
    name: "quiz",
    version: "1.0",
    author: "Your Name",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "trò chơi câu hỏi",
      en: "quiz game"
    },
    longDescription: {
      vi: "chơi trò chơi câu hỏi",
      en: "play quiz game"
    },
    category: "game",
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
      notPlayer: "Bạn không phải là người chơi."
    },
    en: {
      reply: "Please reply this message with the answer (letter only)",
      correct: "🎉 Congratulations you have answered correctly and received %1$",
      wrong: "⚠️ You have answered incorrectly",
      invalidTopic: "Invalid quiz topic.",
      notPlayer: "You are not a player.",
      guide: "{pn} <topic>"
    }
  },

  onStart: async function ({ message, event, commandName, getLang, args }) {
    const topic = args[0]; // Assumes the topic is passed as the first argument

    if (!topic) {
      const availableTopics = getAvailableTopics();
      const tutorialMessage = `Here are some available topics:\n\n${availableTopics}\n\nTutorial: ${getLang("guide")}`;
      return message.reply(tutorialMessage);
    }

    let quizData;
    if (topic === "physics") {
      quizData = require(path.join(__dirname, "quiz/physics/physics.json"));
    } else if (topic === "chemistry") {
      quizData = require(path.join(__dirname, "quiz/chemistry/chemistry.json"));
    } else if (topic === "history") {
      quizData = require(path.join(__dirname, "quiz/history/history.json"));
    } else if (topic === "math") {
      quizData = require(path.join(__dirname, "quiz/math/math.json"));
    } else {
      // Handle invalid topic
      return message.reply(getLang("invalidTopic"));
    }

    const question = getRandomQuestion(quizData);
    const { question: questionText } = question;

    message.reply({
      body: getLang("reply") + "\n\n" + questionText
    }, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        question,
        playerData: {}
      });
    });
  },

  onReply: async ({ message, Reply, event, getLang, usersData, envCommands, commandName }) => {
    const { author, question, messageID, playerData } = Reply;
    if (event.senderID != author)
      return message.reply(getLang("notPlayer"));

    const userAnswer = formatText(event.body);
    if (userAnswer === question.answer) {
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
      fs.writeFileSync("bank.json", JSON.stringify(bankData));

      message.reply(getLang("correct", envCommands[commandName].reward));
    } else {
      message.reply(getLang("wrong"));
    }

    message.unsend(event.messageReply.messageID);

    if (!playerData[event.senderID]) {
      playerData[event.senderID] = { wrong: 0 };
    }
    playerData[event.senderID].wrong++;
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
  const quizPath = path.join(__dirname, "quiz");
  const topics = fs.readdirSync(quizPath);
  return topics.map(topic => topic.replace(".json", "")).join("\n");
}
