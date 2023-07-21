const axios = require('axios');
const request = require('request');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'imganime',
    aliases: ['animepic'],
    version: '1.0',
    author: 'Shinpei',
    countDown: 5,
    role: 0,
    shortDescription: {
      en: 'get a random anime picture'
    },
    longDescription: {
      en: 'get a random anime picture'
    },
    category: 'Anime',
    guide: {
      en: '{p}imganime'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const response = await axios.get('https://anime.ocvat2810.repl.co/');
      const ext = response.data.data.substring(response.data.data.lastIndexOf('.') + 1);
      
      const cacheDirectory = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDirectory)) {
        fs.mkdirSync(cacheDirectory);
      }

      const callback = () => {
        api.sendMessage(
          {
            attachment: fs.createReadStream(`${cacheDirectory}/anime.${ext}`)
          },
          event.threadID,
          () => fs.unlinkSync(`${cacheDirectory}/anime.${ext}`)
        );
      };
      
      request(response.data.data)
        .pipe(fs.createWriteStream(`${cacheDirectory}/anime.${ext}`))
        .on('close', callback);
    } catch (error) {
      console.error(error);
      api.sendMessage('Sorry, something went wrong while fetching the anime picture.', event.threadID);
    }
  }
};
