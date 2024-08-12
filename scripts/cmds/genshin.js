const fetch = require('node-fetch'); // Import fetch for server-side usage
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
        vi: {},
        en: {}
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        const senderID = event.senderID;
        const userData = await usersData.get(senderID);

        // Define `exp` and `name` for the purpose of this example.
        const exp = userData.exp || 0; // Assuming `exp` is a property of `userData`
        const name = userData.name || 'Unknown'; // Assuming `name` is a property of `userData`

        // Define deltaNext for the purpose of this example
        const deltaNext = 1000; // You might want to adjust this value

        const levelUser = expToLevel(exp, deltaNext);

        const imageUrl = `http://13.127.169.105:3000/image?newImage=&text=${encodeURIComponent(name)}&uid=${senderID}&rank=${levelUser}`;

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            // Get the image as a buffer
            const imageBuffer = await response.buffer();
            
            // Reply with the image
            await message.reply({
                body: 'Here is your Genshin Impact card!',
                attachment: imageBuffer
            });
        } catch (error) {
            console.error('Error creating card:', error);
            await message.reply('There was an error creating your card.');
        }
    }
};

const expToLevel = (exp, deltaNextLevel = 1000) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
