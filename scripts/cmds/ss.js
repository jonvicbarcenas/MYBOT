const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "ss",
        aliases: ["screenshot"],
        version: "1.0.0",
        author: "JV",
        countDown: 5,
        role: 0,
        description: {
            vi: "",
            en: ""
        },
        category: "",
        guide: {
            vi: "",
            en: "{PREFIX}ss <link>"
        }
    },

    langs: {
        vi: {
            // Add Vietnamese translations if needed
        },
        en: {
            // Add English translations if needed
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const url = args.join(" ");
        if (!url) return message.reply("Please provide a link to take a screenshot.");

        const access_key = "ad8d5716c26c413d8405cbd418b8fab0";
        const cacheDir = path.join(__dirname, 'cache');
        const filePath = path.join(cacheDir, `screenshot-${Date.now()}.png`);

        try {
            // Ensure the cache directory exists
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            const response = await global.utils.request.get({
                url: `https://api.apiflash.com/v1/urltoimage?access_key=${access_key}&wait_until=page_loaded&url=${encodeURIComponent(url)}`,
                encoding: null 
            });

            if (!response || !response.body) {
                console.error(response);
                return message.reply("An error occurred while fetching the screenshot.");
            }

            fs.writeFileSync(filePath, response.body);

            return message.reply({
                attachment: fs.createReadStream(filePath),
            });
        } catch (e) {
            console.error(e);
            return message.reply("An error occurred while fetching the screenshot.");
        }
    }
};
