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
            
        },
        en: {
            
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const url = args.join(" ");
        if (!url) return message.reply("Please provide a link to take a screenshot.");
        const access_key = "ad8d5716c26c413d8405cbd418b8fab0"

        try {
            const { body } = await global.utils.request.get(`https://api.apiflash.com/v1/urltoimage?access_key=${access_key}&wait_until=page_loaded&url=${encodeURIComponent(url)}`);
            if (!body) return message.reply("An error occurred while fetching the screenshot.");

            return message.reply({
                attachment: body,
                body: "Here is the screenshot."
            });
        }catch (e) {
            return message.reply("An error occurred while fetching the screenshot.");
        }
    }
};