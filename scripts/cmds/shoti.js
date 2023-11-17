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

  onStart: async function ({ api, event }) {
    api.sendMessage("Your shoti video is coming, please wait😏...", event.threadID);

    try {
      const apiKey = "$shoti-1hefkn6gmebuvbmp2j";
      let response = await axios.post(
        "https://api--v1-shoti.vercel.app/api/v1/get",
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

          await api.sendMessage(
            {
              attachment: fs.createReadStream(filePath),
            },
            event.threadID
          );
          api.sendMessage(
            `Username: @${username}\Nickname: ${nickname}`,
            event.threadID
          );
        });
      } else {
        api.sendMessage(
          "No video URL found in the API response.",
          event.threadID
        );
      }
    } catch (error) {
      console.error(error);
      api.sendMessage(
        "An error occurred while fetching the video.",
        event.threadID
      );
    }
  },
};