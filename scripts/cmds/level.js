const { expToLevel } = global.client; // Ensure expToLevel is available from the global client

module.exports = {
    config: {
        name: "getlevel",
        version: "1.0",
        author: "YourName", // Replace with your name or identifier
        countDown: 5,
        role: 0,
        description: {
            vi: "Xem cấp độ của bạn",
            en: "View your level"
        },
        category: "rank",
        guide: {
            vi: "{pn}",
            en: "{pn}"
        }
    },

    onStart: async function ({ message, event, usersData }) {
        try {
            // Fetch user experience
            const userData = await usersData.get(event.senderID);
            const exp = userData.exp || 0; // Default to 0 if experience is not found

            // Get deltaNext from environment configuration
            const deltaNext = global.client.config.envConfig.deltaNext || 5;

            // Calculate the user’s level
            const level = expToLevel(exp, deltaNext);

            // Send the level as a message
            return message.reply(`Your level is: ${level}`);
        } catch (error) {
            // Handle any errors that occur
            console.error("Error fetching user level:", error);
            return message.reply("There was an error fetching your level. Please try again later.");
        }
    }
};
