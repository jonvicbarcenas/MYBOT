module.exports = {
    config: {
        name: "firstlet",
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
            en: ""
        }
    },

    langs: {
        vi: {
            
        },
        en: {
            
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        try {
            const senderID = event.senderID;
            const userData = await usersData.get(senderID);
            const fl = userData.name[0];
            api.sendMessage(`First letter: ${fl}`);
        } catch (error) {
            console.error(error);
            message.reply("An error occurred while fetching the name.");
        }
    }
};