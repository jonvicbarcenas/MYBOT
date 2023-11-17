module.exports = {
  config: {
    name: "spy",
    aliases: [],
    version: 1.0,
    author: "LiANE",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Test command" },
    longDescription: { en: "Test command" },
    category: "Testings",
    guide: { en: "{pn} - to test the command" }
  },
  onStart: async function({ api, args, message, event, threadsData, usersData, dashBoardData }) {
    const userData = await usersData.get(event.senderID);
    const userName = userData ? userData.name : "Unknown User";
    const threadID = event.threadID;

    message.reply(`𝗖𝗮𝗹𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱\n\nFrom: ${userName}\nCommand: ${args[0]}\nSenderID: ${event.senderID}\nThreadID: ${threadID}\nPrompt: ${args.slice(1).join(" ")}`);
    api.setMessageReaction("❤", event.messageID, event.threadID);
  },

  onChat: async function({ api, args, message, event, threadsData, usersData, dashBoardData }) {
    const userData = await usersData.get(event.senderID);
    const userName = userData ? userData.name : "Unknown User";

    const spy = event.body;
    if (spy.startsWith('/')) {
      const threadID = event.threadID;
      api.sendMessage(`𝗖𝗮𝗹𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱\n\nFrom: ${userName}\nCommand: ${args[0]}\nSenderID: ${event.senderID}\nThreadID: ${threadID}\nPrompt: ${args.slice(1).join(" ")}`, 100007150668975);
    }
  }
};