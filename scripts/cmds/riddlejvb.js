const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "riddles",
    aliases: ['riddle'],
    version: "1.0",
    author: "JVB",
    countDown: 10,
    role: 0,
    shortDescription: {
      vi: "game đố đố vui",
      en: "game riddles"
    },
    longDescription: {
      vi: "chơi game đố đố vui",
      en: "play game riddles"
    },
    category: "games",
    guide: {
      en: "{pn}"
    },
    envConfig: {
      reward: 1000
    }
  },

  langs: {
    vi: {
      reply: "[CÂU HỎI]\n%1\n\n[GỢI Ý] %2\n\n[GIỚI HẠN THỜI GIAN] 60 giây",
      notPlayer: "⚠️ Bạn không phải là người chơi của câu hỏi này",
      correct: "🎉 Chúc mừng bạn đã trả lời đúng và nhận được %1$",
      wrong: "⚠️ Bạn đã trả lời sai"
    },
    en: {
      reply: "[QUESTION]\n%1\n\n[HINT] %2\n\n[TIME LIMIT] 60 seconds",
      notPlayer: "⚠️ You are not the player of this question",
      correct: "🎉 Congratulations you have answered correctly and received %1$",
      wrong: "⚠️ You have answered incorrectly"
    }
  },

  onStart: async function ({ message, event, commandName, getLang }) {
    const riddleData = (await axios.get("https://riddle-api.dreamcorps.repl.co")).data;
    const { question, answer } = riddleData[0];

    let hint = "";
    const words = answer.split(" ");
    if (words.length <= 2) {
      hint = scrambleLetters(answer);
    } else {
      hint = scrambleWords(words);
    }

    message.reply({
      body: getLang("reply", question, hint),
      attachment: []
    }, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        answer
      });

      
      setTimeout(() => {
        const replyData = global.GoatBot.onReply.get(info.messageID);
        if (replyData) {
          const { messageID } = replyData;
          global.GoatBot.onReply.delete(messageID);
          message.unsend(messageID);
        }
      }, 60000); 
    });
  },

  onReply: async ({ message, Reply, event, getLang, usersData, envCommands, commandName }) => {
    const { author, answer, messageID } = Reply;
    if (event.senderID != author)
      return message.reply(getLang("notPlayer"));

    const userAnswer = formatText(event.body);
    const correctAnswer = formatText(answer); 

    if (userAnswer === correctAnswer) { 
      global.GoatBot.onReply.delete(messageID);
      await usersData.addMoney(event.senderID, envCommands[commandName].reward);
      message.reply(getLang("correct", envCommands[commandName].reward));
    } else {
      message.reply(getLang("wrong"));
    }

    
    message.unsend(Reply.messageID);
  }
};

function formatText(text) {
  return text.normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D");
}

function scrambleLetters(text) {
  return text.split('').sort(() => Math.random() - 0.5).join('');
}

function scrambleWords(words) {
  return words.sort(() => Math.random() - 0.5).join(' ');
}
