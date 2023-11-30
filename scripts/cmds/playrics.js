const axios = require("axios");
const fs = require("fs-extra");
const ytdl = require("ytdl-core");
const request = require("request");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "playrics",
    aliases: ["playlyrics", "playlyric", "playrics"],
    version: "1.0",
    author: "JV Goat Mod | Grey",
    countDown: 20,
    role: 0,
    shortDescription: {
      vi: "Nhận lời bài hát",
      en: "Get song lyrics"
    },
    longDescription: {
      en: "Get song lyrics with music thanks to grey api"
    },
    category: "info",
    guide: {
      en: "{pn} <song name>"
    }
  },

  onStart: async function ({ api, event }) {
    const input = event.body;
    const text = input.substring(12);
    const data = input.split(" ");

    if (data.length < 2) {
      return api.sendMessage("Please put a song", event.threadID);
    }

    data.shift();
    const song = data.join(" ");

    try {
      // Create cache folder if it doesn't exist
      const cacheFolderPath = __dirname + '/cache';
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      api.sendMessage(`Finding lyrics for "${song}". Please wait...`, event.threadID);

      const res = await axios.get(`https://api.heckerman06.repl.co/api/other/lyrics2?song=${encodeURIComponent(song)}`);
      const lyrics = res.data.lyrics || "Not found!";
      const title = res.data.title || "Not found!";
      const artist = res.data.artist || "Not found!";

      const searchResults = await yts(song);
      if (!searchResults.videos.length) {
        return api.sendMessage("Error: Invalid request.", event.threadID, event.messageID);
      }

      const video = searchResults.videos[0];
      const videoUrl = video.url;

      const stream = ytdl(videoUrl, { filter: "audioonly" });

      const fileName = `${event.senderID}.mp3`;
      const filePath = cacheFolderPath + `/${fileName}`;

      stream.pipe(fs.createWriteStream(filePath));

      stream.on('response', () => {
        console.info('[DOWNLOADER]', 'Starting download now!');
      });

      stream.on('info', (info) => {
        console.info('[DOWNLOADER]', `Downloading ${info.videoDetails.title} by ${info.videoDetails.author.name}`);
      });

      stream.on('end', () => {
        console.info('[DOWNLOADER] Downloaded');

        if (fs.statSync(filePath).size > 26214400) {
          fs.unlinkSync(filePath);
          return api.sendMessage('[ERR] The file could not be sent because it is larger than 25MB.', event.threadID);
        }

        const message = {
          body: `Here's your music request\n\nTitle: ${title}\nArtist: ${artist}\n\nLyrics: ${lyrics}`,
          attachment: fs.createReadStream(filePath)
        };

        api.sendMessage(message, event.threadID, () => {
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage('An error occurred while processing the command.', event.threadID);
    }
  }
};
