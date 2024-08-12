const fetch = require('node-fetch'); 
const fs = require('fs-extra'); 
const path = require('path'); 
module.exports = {
    config: {
        name: "genshin",
        version: "1.0.0",
        author: "NAH I'D WIN",
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


        const exp = userData.exp;
        const name = userData.name || 'Traveler';

        const imageUrl = `http://13.127.169.105:3000/image?newImage=&text=${encodeURIComponent(name)}&uid=${senderID}&rank=${exp}`;

        try {
            const response = await fetch(imageUrl);
            const buffer = await response.buffer(); 


            const imgPath = path.join(__dirname, 'cache', 'genshin.jpg');

            await fs.ensureDir(path.dirname(imgPath));

            await fs.outputFile(imgPath, buffer);

            await message.reply({
                attachment: fs.createReadStream(imgPath)
            });

            await fs.remove(imgPath);
        } catch (error) {
            console.error('Error creating or sending card:', error);
        }
    }
};