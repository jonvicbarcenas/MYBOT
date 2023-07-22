const axios = require('axios');
const request = require('request');
const fs = require("fs");

module.exports = {
  config: {
    name: "logo",
    version: "1.4",
    author: "JV Barcenas", //goat modified
    countDown: 25,
    role: 0,
    shortDescription: {
      en: "logo maker"
    },
    longDescription: {
      en: "make logo"
    },
    category: "Image",
    guide: {
      en: "  {pn} "
    }
  },

  onStart: async function ({ api, event, args }) {
    if (!args[0]) {
      return api.sendMessage("[!] Need a logo style to proceed.", event.threadID, event.messageID);
    }

    const logoStyle = args[0];
    let req = args.slice(1).join(" ");

    if (!req) {
      req = logoStyle;
    }

    const wordCount = req.split(" ").length;
    if (wordCount > 3) {
      return api.sendMessage("[!] The logo text should not exceed 3 words.", event.threadID, event.messageID);
    }

    let themeUrl = "";
    let apiUrl = "";
    let message = "";

    switch (logoStyle) {
      case "metal":
        themeUrl = "https://textpro.me/create-3d-liquid-metal-text-effect-1112.html";
        break;
      case "naruto":
        themeUrl = "https://textpro.me/create-naruto-logo-style-text-effect-online-1125.html";
        break;
      case "cloud":
        themeUrl = "https://textpro.me/create-a-cloud-text-effect-on-the-sky-online-1004.html";
        break;
      case "blackpink":
        themeUrl = "https://textpro.me/create-blackpink-logo-style-online-1001.html";
        break;
      case "artpaper":
        themeUrl = "https://textpro.me/create-art-paper-cut-text-effect-online-1022.html";
        break;
      case "glass1":
        themeUrl = "https://textpro.me/blue-glass-text-effect-908.html";
        break;
      case "glass2":
        themeUrl = "https://textpro.me/orange-glass-text-effect-911.html";
        break;
      case "greenhorror":
        themeUrl = "https://textpro.me/create-green-horror-style-text-effect-online-1036.html";
        break;
      case "lightneon":
        themeUrl = "https://textpro.me/neon-light-text-effect-online-882.html";
        break;
      case "matrix":
        themeUrl = "https://textpro.me/matrix-style-text-effect-online-884.html";
        break;
      case "neon":
        themeUrl = "https://textpro.me/neon-text-effect-online-879.html";
        break;
      case "futureneon":
        themeUrl = "https://textpro.me/create-a-futuristic-technology-neon-light-text-effect-1006.html";
        break;
      case "transformer":
        apiUrl = `https://chards-bot-api.richardretadao1.repl.co/api/photooxy/transformer?text=${req}`;
        message = "[TRANSFORMER] Logo created:";
        break;
      case "flowerlogo":
        apiUrl = `https://chards-bot-api.richardretadao1.repl.co/api/photooxy/flower-typography?text=${req}`;
        message = "› Logo created:";
        break;
      case "harry":
        apiUrl = `https://chards-bot-api.richardretadao1.repl.co/api/photooxy/harry-potter?text=${req}`;
        message = "[HARRY POTTER] Logo created:";
        break;
      case "gura":
        apiUrl = `https://chards-bot-api.richardretadao1.repl.co/api/canvas/gura?teks=${req}`;
        message = "[GURA LOGO] Logo created:";
        break;
      case "graffiti":
        apiUrl = `https://chards-bot-api.richardretadao1.repl.co/api/photooxy/graffiti1?text=${req}`;
        message = "[GRAFFITI] Logo created:";
        break;
      case "help":
        return api.sendMessage(
          `∘₊✧───Available Logos───✧₊∘\n\n»» ${global.GoatBot.config.prefix}logo metal {text}\n»» ${global.GoatBot.config.prefix}logo naruto {text}\n»» ${global.GoatBot.config.prefix}logo cloud {text}\n»» ${global.GoatBot.config.prefix}logo blackpink {text}\n»» ${global.GoatBot.config.prefix}logo artpaper {text}\n»» ${global.GoatBot.config.prefix}logo glass1 {text}\n»» ${global.GoatBot.config.prefix}logo glass2 {text}\n»» ${global.GoatBot.config.prefix}logo greenhorror {text}\n»» ${global.GoatBot.config.prefix}logo lightneon {text}\n»» ${global.GoatBot.config.prefix}logo matrix {text}\n»» ${global.GoatBot.config.prefix}logo neon {text}\n»» ${global.GoatBot.config.prefix}logo futureneon {text}\n»» ${global.GoatBot.config.prefix}logo transformer {text}\n»» ${global.GoatBot.config.prefix}logo flowerlogo {text}\n»» ${global.GoatBot.config.prefix}logo harry {text}\n»» ${global.GoatBot.config.prefix}logo gura {text}\n»» ${global.GoatBot.config.prefix}logo graffiti {text}\n\nModified by: JV\n\nApi Credits: Sensui.`,
          event.threadID,
          event.messageID
        );
      default:
        return api.sendMessage("[!] Invalid logo style.", event.threadID, event.messageID);
    }

    if (apiUrl) {
      axios.get(apiUrl, { responseType: 'stream' })
        .then(response => {
          const callback = function () {
            api.sendMessage({
              body: message,
              attachment: fs.createReadStream(__dirname + `/cache/logo.jpg`)
            }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/logo.jpg`), event.messageID);
          };
          response.data.pipe(fs.createWriteStream(__dirname + `/cache/logo.jpg`)).on("close", callback);
        })
        .catch(err => {
          console.error(err);
          api.sendMessage("[!] Failed to create the logo.", event.threadID, event.messageID);
        });
    } else {
      axios.get(`https://logo-maker-api.codersensui.repl.co/create?theme=${themeUrl}&text=${encodeURI(req)}`)
        .then(res => {
          const callback = function () {
            api.sendMessage({
              body: `»» Logo Created:`,
              attachment: fs.createReadStream(__dirname + `/cache/logo.jpg`)
            }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/logo.jpg`), event.messageID);
          };
          request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/logo.jpg`)).on("close", callback);
        })
        .catch(err => {
          console.error(err);
          api.sendMessage("[!] Failed to create the logo.", event.threadID, event.messageID);
        });
    }
  }
};