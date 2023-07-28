const DIG = require("discord-image-generation");
const fetch = require("node-fetch");
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "pet",
		version: "1.0",
		author: "JV Brcns",
		countDown: 5,
		role: 0,
		shortDescription: "Pet image",
		longDescription: "Pet image",
		category: "image",
		guide: {
			en: "   {pn} @tag"
		}
	},

	langs: {
		vi: {
			noTag: "Bạn phải tag người bạn muốn thú cưng"
		},
		en: {
			noTag: "You must tag the person you want to pet"
		}
	},

	onStart: async function ({ event, message, usersData, args, getLang }) {
		const uid1 = event.senderID;
		const uid2 = Object.keys(event.mentions)[0];
		if (!uid2)
			return message.reply(getLang("noTag"));

		const avatarURL1 = await usersData.getAvatarUrl(uid1);
		const avatarURL2 = await usersData.getAvatarUrl(uid2);

		const petEndpoint = `https://api.popcat.xyz/pet?image=${encodeURIComponent(avatarURL2)}`;
		const response = await fetch(petEndpoint);
		const buffer = await response.buffer();

		const pathSave = `${__dirname}/tmp/${uid1}_${uid2}Pet.png`;
		fs.writeFileSync(pathSave, buffer);

		const content = args.join(' ').replace(Object.keys(event.mentions)[0], "");
		message.reply({
			body: `${(content || "tutututut")}`,
			attachment: fs.createReadStream(pathSave)
		}, () => fs.unlinkSync(pathSave));
	}
};
