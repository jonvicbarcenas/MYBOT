const { text } = require("express");
const uid = require("./uid");

module.exports = {
    config: {
        name: "genshin",
        version: "1.0.0",
        author: "JV Barcenas",
        countDown: 1,
        role: 0,
        description: {
            vi: "",
            en: "Creates a genshin impact card"
        },
        category: "Game",
        guide: {
            vi: "",
            en: "{prefix}genshin "
        }
    },

    langs: {
        vi: {
            
        },
        en: {
            
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const senderID = event.senderID;
        const userData = await usersData.get(senderID);
        const name = userData.name;
        const { exp } = await usersData.get(senderID);
        const levelUser = expToLevel(exp, deltaNext);

        // Fetch the user's avatar URL
        const avatarUrl = await usersData.getAvatarUrl(senderID);

        message.reply(avatarUrl);
    }
};