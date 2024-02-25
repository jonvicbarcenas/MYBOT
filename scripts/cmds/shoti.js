const axios = require("axios");
const fs = require("fs");
const request = require("request");

module.exports = {
  config: {
    name: "shoti",
    description: "Fetch a short video from Shoti",
    category: "chatbox",
    author: "Jhon Talamera",
  },

  onStart: async function ({ message, api, event }) {
    message.reply("Shoti video is coming, please wait...");

    try {
      const apiKey = "$shoti-1hms52u6bn1rlvspndo";
      let response = await axios.post(
        "https://shoti-srv1.onrender.com/api/v1/get",
        { apikey: apiKey }
      );

      if (
        response.data.code === 200 &&
        response.data.data &&
        response.data.data.url
      ) {
        const videoUrl = response.data.data.url;
        const filePath = __dirname + "/cache/shoti.mp4";
        const file = fs.createWriteStream(filePath);
        const rqs = request(encodeURI(videoUrl));

        rqs.pipe(file);

        file.on("finish", async () => {
          const userInfo = response.data.data.user;
          const username = userInfo.username;
          const nickname = userInfo.nickname;

          await message.reply({
            body: `Username: @${username}\nNickname: ${nickname}`,
            attachment: fs.createReadStream(filePath),
          });
        });
      } else {
        message.reply("No video URL found in the API response.");
      }
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while fetching the video.");
    }
  },
};