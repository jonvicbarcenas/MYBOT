const axios = require('axios');

module.exports = {
    config: {
        name: "videofb",
        aliases: ['fbdownload'],
        version: "1.0",
        author: "Samir",
        countDown: 30,
        role: 0,
        shortDescription: "Downloader",
        longDescription: "Download Facebook Video By Your URL",
        category: "utility",
        guide: "{pn}",
    },

    onStart: async function ({ message, args }) {
        const url = args.join(" ");
        if (!url)
            return message.reply(`Missing URL Data To Download`);
        else {
            const BASE_URL = `https://api.samirthakuri.repl.co/api/videofb?url=${encodeURIComponent(url)}`;

       await message.reply("Please Wait A Bit. 🥰");

      
            try {
                let res = await axios.get(BASE_URL)
            
                let img =  res.data.video;

                const form = {
                    body: `Here's Your Video Request 😉.`
                };
          if (img)
                    form.attachment = await global.utils.getStreamFromURL(img);
                message.reply(form);  
            } catch (e) { message.reply(`An error occurred while fetching video.`)
                  console.log(e);
                  }

        }
    }
};