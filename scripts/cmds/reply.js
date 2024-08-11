module.exports = {
    config: {
        name: "test",
        version: "1.5",
        author: "Jv Barcenas",
        countDown: 5,
        role: 0,
        description: {
            vi: "",
            en: "reply echo"
        },
        category: "utility",
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

    onStart: async function ({ args, message }) {
        const echoMessage = args.join(" ");
        message.reply({
            body: echoMessage
        }, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: info.commandName,
                messageID: info.messageID,
            });
        });
    },
    onReply: async function ({ Reply, api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const { messageID } = Reply;
        const messageReply = args.join(" ");
        return message.reply({
            body: messageReply
        });
    }
};