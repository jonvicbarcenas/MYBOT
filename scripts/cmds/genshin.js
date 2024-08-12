const fetch = require('node-fetch'); // Import fetch for server-side usage
const fs = require('fs-extra'); // For file operations
const path = require('path'); // For handling file paths
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
        const exp = userData.exp; // Assuming `exp` is a property of `userData`
        const name = userData.name || 'Traveler'; // Assuming `name` is a property of `userData`

        const imageUrl = `http://13.127.169.105:3000/image?newImage=&text=${encodeURIComponent(name)}&uid=${senderID}&rank=${exp}`;

        try {
            const response = await fetch(imageUrl);
            const buffer = await response.buffer(); // Get image as buffer

            // Define image path
            const imgPath = path.join(__dirname, 'cache', 'genshin.jpg');

            // Ensure cache directory exists
            await fs.ensureDir(path.dirname(imgPath));

            // Save image to file
            await fs.outputFile(imgPath, buffer);

            // Send the image (adjust according to your API or method of sending files)
            await message.reply({
                attachment: fs.createReadStream(imgPath)
            });

            // Delete the image after sending
            await fs.remove(imgPath);
        } catch (error) {
            console.error('Error creating or sending card:', error);
        }
    }
};