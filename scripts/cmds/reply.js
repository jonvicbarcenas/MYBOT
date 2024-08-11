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
        try {
            const replyMessage = await message.reply({
                body: echoMessage
            });

            // Ensure global.GoatBot.onReply is initialized as a Map
            if (!global.GoatBot.onReply) {
                global.GoatBot.onReply = new Map();
            }

            global.GoatBot.onReply.set(replyMessage.messageID, {
                commandName: this.config.name,
                author: message.senderID,
                messageID: replyMessage.messageID,
            });
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    },

    onReply: async function ({ Reply, message, event }) {
        const { messageID, author } = Reply;
        if (author !== event.senderID) {
            return;
        }

        // Ensure args are correctly passed
        const messageReply = event.args.join(" ");
        try {
            await message.reply({
                body: messageReply
            });
        } catch (error) {
            console.error("Error replying to message:", error);
        }
    }
};
