async function image(args, event, message, shortenURL) {
  const imageUrl = event.messageReply && event.messageReply.attachments[0].url ? event.messageReply.attachments[0].url : args.join(" ");
  if (!imageUrl) {
    return message.reply("❌ No image URL provided.");
  }

  const shortenedUrl = await shortenURL(imageUrl);

  message.reply(`${shortenedUrl}`);
}

module.exports = {
  config: {
    name: "downloadimage",
    aliases: ["downloadimg"],
    version: "1.0",
    author: "jv",
    countDown: 5,
    role: 0,
    shortDescription: "Get TinyURL for an image",
    longDescription: {
      vi: "Lấy TinyURL cho hình ảnh",
      en: "Get TinyURL for an image"
    },
    category: "media",
    guide: {
      vi: "   {pn} [image|-i|i]: dùng để lấy TinyURL cho hình ảnh.",
      en: "   {pn} [image|-i|i]: use to get TinyURL for an image."
    }
  },

  onStart: async function ({ args, message, getLang, event }) {
    await image(args, event, message, global.utils.shortenURL);
  }
};
