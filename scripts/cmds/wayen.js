const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "wayen", 
		version: "1.0.0", 
		author: "JVB", 
		role: 2,
		shortDescription:{
			en: "Get a random image"}, 
		longDescription:{
			en:"This command returns a random image using the 'https://restfully.dreamcorps.repl.co/random-picture' API."}, 
		category: "Fun", 
		guide: {
			en: "{prefix}randomimage"
		}
	}, 

	onStart: async function({ api, event }) {
		try {
			const res = await axios.get("https://showw.dreamcorps.repl.co/api.php", { responseType: 'arraybuffer' });
			const imgPath = path.join(__dirname, 'cache', `random.jpg`);
			await fs.outputFile(imgPath, res.data);
			const imgData = fs.createReadStream(imgPath);

			await api.sendMessage({
				attachment: imgData,
				body: `Here's a random image:`
			}, event.threadID, event.messageID);

			await fs.remove(path.join(__dirname, 'cache'));
		} catch (error) {
			console.error(error);
			return api.sendMessage(`An error occurred. Please try again later.`, event.threadID, event.messageID);
		}
	}
};
