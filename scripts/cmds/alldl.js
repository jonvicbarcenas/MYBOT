const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "alldl",
    version: "1.6",
    author: "Samir Œ",
    countDown: 5,
    role: 0,
    shortDescription: "download content by link",
    longDescription: "download content",
    category: "download",
    guide: "{pn} link"
  },
  onStart: async function() {},
  onChat: async function ({ message, args }) {
    const link = args.join(" ");
    if (!link)
      return;
    else {
      let BASE_URL;

      if (link.includes("facebook.com")) {
        BASE_URL = `https://api-samir.onrender.com/fbdl?vid_url=${encodeURIComponent(link)}`;
      } else if (link.includes("twitter.com")) {
        BASE_URL = `https://api-samir.onrender.com/twitter?url=${encodeURIComponent(link)}`;
      } else if (link.includes("tiktok.com")) {
        BASE_URL = `https://api-samir.onrender.com/tiktok?url=${encodeURIComponent(link)}`;
      } else if (link.includes("open.spotify.com")) {
        BASE_URL = `https://api-samir.onrender.com/spotifydl?url=${encodeURIComponent(link)}`;

        try {
          const apiResponse = await axios.get(BASE_URL);

          if (apiResponse.data.success) {
            const metadata = apiResponse.data.metadata;
            const audioUrl = apiResponse.data.link;

            message.reply("⬇ | Downloading the content for you");

            const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(__dirname + '/cache/spotify.mp3', Buffer.from(audioResponse.data));

            message.reply({
              body: `• Title: ${metadata.title}\n• Album: ${metadata.album}\n• Artist: ${metadata.artists}\n• Released: ${metadata.releaseDate}`,
              attachment: fs.createReadStream(__dirname + '/cache/spotify.mp3')
            });
          } else {
            message.reply("Sorry, the Spotify content could not be downloaded.");
          }
        } catch (error) {
          console.error(error);
          message.reply("Sorry, an error occurred while processing your request.");
        }

        return;
      } else if (link.includes("youtu.be") || link.includes("youtube.com")) {
        const providedURL = `https://api-samir.onrender.com/ytdl?url=${link}`;
        message.reply({
          attachment: await global.utils.getStreamFromURL(providedURL),
        });
        return;
      } else if (link.includes("instagram.com")) {
        BASE_URL = `https://api-samir.onrender.com/igdl?url=${encodeURIComponent(link)}`;
      } else {
        return;
      }

      message.reply("Auto Downloading...");

      try {
        let res = await axios.get(BASE_URL);

        let contentUrl;

        if (link.includes("facebook.com")) {
          contentUrl = res.data.links["Download High Quality"];
        } else if (link.includes("twitter.com")) {
          contentUrl = res.data.HD;
        } else if (link.includes("tiktok.com")) {
          contentUrl = res.data.hdplay;
        } else if (link.includes("instagram.com")) {
          const instagramResponse = res.data;
          if (Array.isArray(instagramResponse.url) && instagramResponse.url.length > 0) {
            const mp4UrlObject = instagramResponse.url.find(obj => obj.type === 'mp4');
            if (mp4UrlObject) {
              contentUrl = mp4UrlObject.url;
            }
          }
        }

        const response = {
          attachment: await global.utils.getStreamFromURL(contentUrl)
        };

        await message.reply(response);
      } catch (e) {
        message.reply(`Sorry, the content could not be downloaded.`);
      }
    }
  }
};