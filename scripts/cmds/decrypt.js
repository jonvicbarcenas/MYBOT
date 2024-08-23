const axios = require("axios");
module.exports = {
  config: {
    name: "decrypt",
    category: "tools"
  },
  onStart: async function ({
    message,
    args
  }) {
    const url = args[0];
    if (!url || !url.startsWith("https://")) {
      return message.reply("Please provide a valid URL and make sure the url is a raw and contains an obfuscated code");
    }
    try {
      const {
        data: {
          result
        }
      } = await axios.post("https://apiv3-2l3o.onrender.com/decrypt", {
        url,
        token: "" // gist token (optional to upload to your own gist)
      });
      message.reply(result);
    } catch (e) {
      message.reply(e.response?.data?.error || e.message || "An error occurred");
    }
  }
};