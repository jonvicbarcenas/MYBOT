const fetch = require('node-fetch');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "anime",
    aliases: ["neko"],
    author: "NTKhang",
    version: "1.2",
    countDown: 5,
    role: 0,
    shortDescription: "random anime image",
    longDescription: "random anime image",
    category: "image",
    guide: {
      vi: "{pn} <endpoint>"
        + "\n   Danh sách enpoint: neko, hug, pat, waifu, kiss, slap, smug",
      en: "{pn} <endpoint>"
        + "\n   List of endpoint: neko, hug, pat, waifu, kiss, slap, smug"
    }
  },

  langs: {
    vi: {
      loading: "Đang khởi tạo hình ảnh, vui lòng chờ đợi...",
      error: "Đã có lỗi xảy ra, vui lòng thử lại sau"
    },
    en: {
      loading: "Initializing image, please wait...",
      error: "An error occurred, please try again later"
    }
  },

  onStart: async function ({ args, message, getLang }) {
    message.reply(getLang("loading"));
    let endpoint;
    const listEndpoint = ["neko", "hug", "pat", "waifu", "kiss", "slap", "smug"];
    if (listEndpoint.includes(args[0]))
      endpoint = args[0];
    else
      endpoint = listEndpoint[Math.floor(Math.random() * listEndpoint.length)];

    try {
      const response = await fetch(`https://nekos.life/api/v2/img/${endpoint}`);
      const data = await response.json();

      const imageRandom = await getStreamFromURL(data.url);
      return message.reply({
        attachment: imageRandom
      });
    } catch (err) {
      return message.reply(getLang("error"));
    }
  }
};
