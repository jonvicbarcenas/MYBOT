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
        vi: {},
        en: {}
    },

    onStart: async function ({ args, message }) {
        const echoMessage = args.join(" ");
        message.reply({
            body: echoMessage
        }, (err, info) => {
            if (err) {
                console.error("Error sending message:", err);
                return;
            }
            // Ensure global.GoatBot.onReply is initialized as a Map
            if (!global.GoatBot.onReply) {
                global.GoatBot.onReply = new Map();
            }
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: message.senderID,
                messageID: info.messageID,
            });
        });
    },

    onReply: async function ({ Reply, api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const { messageID, author } = Reply;
        if (author != event.senderID) {
            return;
        }
        
        // Verify if args is defined and contains the message text
        const messageReply = args.join(" ") || "No reply message provided.";
        
        // Ensure message.reply is correctly called
        return message.reply({
            body: messageReply
        });
    }
};
