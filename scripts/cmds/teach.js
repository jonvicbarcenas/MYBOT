const axios = require("axios");

module.exports = {
  config: {
    name: "teach",
    aliases: ["simteach"],
    version: "1.0",
    author: "Jeybeh",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "teach sim"
    },
    longDescription: {
      en: "teach sim"
    },
    category: "box chat",
    guide: {
      en: "{p}teach your ask | my answer"
    }
  },
  onStart: async function ({ api, event, args }) {
    const { messageID, threadID, senderID, body } = event;
    const tid = threadID,
      mid = messageID;
    const content = args.join(" ").split("|").map(item => item.trim());
    const ask = content[0];
    const ans = content[1];
    if (!args[0]) return api.sendMessage("Use /teach your ask | sim respond", tid, mid);
    const res = await axios.get(`https://simsimi.fun/api/v2/?mode=teach&lang=ph&message=${ask}&answer=${ans}`);
    api.sendMessage(`Thank you for teaching sim!\nYour ask: ${ask}\nSim respond: ${ans}`, tid, mid);
  }
};
