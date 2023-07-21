const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");
const path = require("path");

// Cooldown tracking object
const cooldowns = {};

module.exports = {
	config: {
		name: "pinterest",
		aliases: ["pin"],
		version: "1.0.2",
		author: "JVB",
		role: 0,
		countDown: 50,
		shortDescription: {
			en: "Search for images on Pinterest"
		},
		longDescription: {
			en: ""
		},
		category: "Search",
		guide: {
			en: "{prefix}pinterest <search query> -<number of images>"
		}
	},

	onStart: async function ({ api, event, args }) {
		try {
			// Check if the user is on cooldown
			const cooldownTime = this.config.countDown * 1000; // Convert seconds to milliseconds
			const userID = event.senderID;
			if (cooldowns[userID] && cooldowns[userID] > Date.now()) {
				const remainingTime = Math.ceil((cooldowns[userID] - Date.now()) / 1000);
				return api.sendMessage(
					`Sorry, you are on cooldown. Please wait ${remainingTime} seconds before using this command again.`,
					event.threadID,
					event.messageID
				);
			}

			// Update the cooldown for the user
			cooldowns[userID] = Date.now() + cooldownTime;

			const keySearch = args.join(" ");
			if (!keySearch.includes("-")) {
				return api.sendMessage(`Please enter the search query and number of images to return in the format: ${this.config.guide.en}`, event.threadID, event.messageID);
			}
			const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
			const numberSearch = parseInt(keySearch.split("-").pop().trim()) || 6;

			const res = await axios.get(`https://api-dien.kira1011.repl.co/pinterest?search=${encodeURIComponent(keySearchs)}`);
			const data = res.data.data;
			const imgData = [];

			for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
				const imgResponse = await axios.get(data[i], { responseType: 'arraybuffer' });
				const imgPath = path.join(__dirname, 'cache', `${i + 1}.jpg`);
				await fs.outputFile(imgPath, imgResponse.data);
				imgData.push(fs.createReadStream(imgPath));
			}

			await api.sendMessage({
				attachment: imgData,
				body: `Here are the top ${imgData.length} image results for "${keySearchs}":`
			}, event.threadID, event.messageID);

			await fs.remove(path.join(__dirname, 'cache'));
		} catch (error) {
			console.error(error);
			return api.sendMessage(`An error occurred. Please try again later.`, event.threadID, event.messageID);
		}
	}
};
