async function iko(args, event, message) {
  const messageReply = event.messageReply;
  if (!messageReply) {
    return message.reply("❌ No message to reply to.");
  }

  const body = messageReply.body;

  message.reply(`The message being replied is: ${body}`);
}

module.exports = {
  config: {
    name: "iko",
    aliases: ["downloadimg"],
    version: "1.0",
    author: "jv",
    countDown: 5,
    role: 0,
    shortDescription: "Get the body of the replied message",
    longDescription: {
      vi: "Lấy nội dung của tin nhắn được trả lời.",
      en: "Get the body of the replied message"
    },
    category: "media",
    guide: {
      vi: "   {pn} [image|-i|i]: dùng để lấy nội dung của tin nhắn được trả lời.",
      en: "   {pn} [image|-i|i]: use to get the body of the replied message."
    }
  },

  onStart: async function ({ args, message, getLang, event }) {
    await iko(args, event, message);
  }
};
