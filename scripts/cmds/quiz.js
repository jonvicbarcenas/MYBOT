const axios = require("axios");
const { getStreamFromURL } = global.utils;
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();


function getPlayerScore(playerID) {
  const quiztopPath = path.join(__dirname, "quiztop.json");
  const quiztopData = JSON.parse(fs.readFileSync(quiztopPath));
  const player = quiztopData.find(player => player.uid === playerID);
  return player ? player.correct : 0;
}

module.exports = {
  config: {
    name: "quiz",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 18,
    role: 0,
    shortDescription: {
      vi: "trò chơi câu hỏi",
      en: "quiz game"
    },
    longDescription: {
      vi: "chơi trò chơi câu hỏi",
      en: "play quiz game"
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
      flag: "Please reply this message with the answer (word/s)\n-⌛15s",
      correct: "🎉 Congratulations you have answered correctly and received %1$",
      wrong: "⚠️ You have answered incorrectly",
      invalidTopic: "Invalid quiz topic.",
      notPlayer: "You are not a player.",
      timeout: "Oops timeout!!",
      guide: "{pn} <topic>",
      top: "- ͙۪۪̥˚┊❛ SHOW TOP: {pn} top  - ͙۪۪̥˚┊❛ ,",
      score: "- ͙۪۪̥˚┊❛ SHOW SCORE: {pn} score  - ͙۪۪̥˚┊❛ ,"
    }
  },

  onStart: async function ({ message, event, commandName, getLang, args }) {
    const topic = args[0]; // Assumes the topic is passed as the first argument
  
    if (!topic) {
      const availableTopics = getAvailableTopics();
      const tutorialMessage = `Here are some available topics:\n\n${availableTopics}\n\n- ͙۪۪̥˚┊❛ TUTORIAL: ${getLang("guide")} - ͙۪۪̥˚┊❛ \n\n${getLang("top")}\n\n${getLang("score")}`;
      return message.reply(tutorialMessage);
    }
  
    if (topic === "top") {
      const topPlayers = getTopPlayers(10); // Get top 10 players
      const topPlayersMessage = formatTopPlayersMessage(topPlayers, getLang);
      return message.reply(topPlayersMessage);
    }

        // Check if the player wants to check their score
    if (topic === "score") {
      const senderID = event.senderID.toString();
      const playerScore = getPlayerScore(senderID); // Retrieve the player's score
      return message.reply(`Your score is: ${playerScore}`);
    }
  
    let quizData;
    let prompt;
    if (topic === "flag") {
      prompt = getLang("flag"); // Prompt for the correct words
    } else {
      prompt = `${getLang("reply")} (letters)\n-⌛15s`; // Prompt for letters
    }
  
    if (topic === "physics") {
      quizData = require(path.join(__dirname, "quiz/physics/physics.json"));
    } else if (topic === "geography") {
      quizData = require(path.join(__dirname, "quiz/geography/geography.json"));
    } else if (topic === "chemistry") {
      quizData = require(path.join(__dirname, "quiz/chemistry/chemistry.json"));
    } else if (topic === "history") {
      quizData = require(path.join(__dirname, "quiz/history/history.json"));
    } else if (topic === "math") {
      quizData = require(path.join(__dirname, "quiz/math/math.json"));
    } else if (topic === "astronomy") {
      quizData = require(path.join(__dirname, "quiz/astronomy/astronomy.json"));
    } else if (topic === "exobiology") {
      quizData = require(path.join(__dirname, "quiz/exobiology/exobiology.json"));
    } else if (topic === "zoology") {
      quizData = require(path.join(__dirname, "quiz/zoology/zoology.json"));
    } else if (topic === "biology") {
      quizData = require(path.join(__dirname, "quiz/biology/biology.json"));
    } else if (topic === "flag") {
      quizData = require(path.join(__dirname, "quiz/flag/flag.json"));
    } else {
      // Handle invalid topic
      return message.reply(getLang("invalidTopic"));
    }
  
    const question = getRandomQuestion(quizData);
    const { question: questionText } = question;
  
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


  onReply: async ({ message, Reply, event, getLang, usersData, envCommands, commandName }) => {
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
      const quiztopPath = path.join(__dirname, "quiztop.json");
      let quiztopData = [];
      try {
        quiztopData = JSON.parse(fs.readFileSync(quiztopPath));
      } catch (error) {
        console.error("Error reading quiztop.json:", error);
      }
  
      const senderID = event.senderID.toString();
      const userData = await usersData.get(senderID);
      const senderName = userData ? userData.name : "Unknown User";
      const playerIndex = quiztopData.findIndex(player => player.uid === senderID);
      if (playerIndex !== -1) {
        quiztopData[playerIndex].name = senderName; // Replace user ID with name in quiztop.json
        quiztopData[playerIndex].correct++;
      } else {
        quiztopData.push({ uid: senderID, name: senderName, correct: 1 });
      }
      fs.writeFileSync(quiztopPath, JSON.stringify(quiztopData));
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
  const quizPath = path.join(__dirname, "quiz");
  const topics = fs.readdirSync(quizPath);
  return topics.map(topic => topic.replace(".json", "")).join("\n");
}

function getTopPlayers(count) {
  const quiztopPath = path.join(__dirname, "quiztop.json");
  const quiztopData = JSON.parse(fs.readFileSync(quiztopPath));
  const sortedData = quiztopData.sort((a, b) => b.correct - a.correct);
  return sortedData.slice(0, count);
}

function formatTopPlayersMessage(players, getLang) {
  let message = "🏆 Quiz Top Players 🏆\n\n";
  players.forEach((player, index) => {
    const { name, correct } = player;
    message += `${index + 1}. ${name} - ${correct}\n`;
  });
  return message;
}