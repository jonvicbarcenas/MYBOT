const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "ss",
        aliases: ["ss"],
        version: "1.2",
        author: "JV",
        countDown: 5,
        role: 0,
        description: {
            vi: "Chụp ảnh màn hình của một trang web",
            en: "Take a screenshot of a website"
        },
        category: "utility",
        guide: {
            vi: "",
            en: "{PREFIX}ss <link>\n\nFor more options like full page or mobile view, use the '{PREFIX}screenshot' command."
        }
    },

    langs: {
        vi: {
            // Add Vietnamese translations if needed
        },
        en: {
            missingUrl: "Please provide a link to take a screenshot.",
            error: "An error occurred while fetching the screenshot.",
            advanced: "For advanced screenshot options like full page or mobile view, try using '{PREFIX}screenshot' command."
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const url = args.join(" ");
        if (!url) return message.reply(getLang("missingUrl"));

        const access_key = "ad8d5716c26c413d8405cbd418b8fab0";
        const cacheDir = path.join(__dirname, 'cache');
        const filePath = path.join(cacheDir, `screenshot-${Date.now()}.png`);

        try {
            // Ensure the cache directory exists
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            const response = await axios.get(`https://api.apiflash.com/v1/urltoimage?access_key=${access_key}&wait_until=page_loaded&url=${encodeURIComponent(url)}`, {
                responseType: 'arraybuffer' 
            });

            if (!response || !response.data) {
                console.error(response);
                return message.reply(getLang("error"));
            }

            // Write the image to the cache directory
            fs.writeFileSync(filePath, response.data);

            // Send the image as an attachment with info about the advanced command
            return message.reply({
                body: `${getLang("advanced")}`,
                attachment: fs.createReadStream(filePath)
            }, () => {
                // Clean up the temporary file after sending
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Error deleting temporary file:", e);
                }
            });
        } catch (e) {
            console.error(e);
            return message.reply(getLang("error"));
        }
    }
};
