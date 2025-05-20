const axios = require('axios');

module.exports = {
	config: {
		name: 'joke',
		version: '1.0',
		author: 'JV BARCENAS',
		countDown: 5,
		role: 0,
		description: {
			vi: 'Hiển thị một câu chuyện cười ngẫu nhiên',
			en: 'Display a random joke'
		},
		category: 'fun',
		guide: {
			vi: '{pn} [programming|general]',
			en: '{pn} [programming|general]'
		}
	},

	langs: {
		vi: {
			error: '❌ Đã xảy ra lỗi: %1',
			loading: '⏳ Đang tìm một câu chuyện cười hay...',
			categories: 'Danh mục có sẵn: general, programming'
		},
		en: {
			error: '❌ An error occurred: %1',
			loading: '⏳ Looking for a good joke...',
			categories: 'Available categories: general, programming'
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const category = args[0]?.toLowerCase();
		
		// Send loading message
		message.reply(getLang('loading'));
		
		try {
			let apiUrl = 'https://v2.jokeapi.dev/joke/';
			
			// If category is specified and valid, use it
			if (category === 'programming') {
				apiUrl += 'Programming';
			} else if (category === 'general') {
				apiUrl += 'Miscellaneous';
			} else if (category) {
				// If category is specified but invalid
				return message.reply(getLang('categories'));
			} else {
				// Default: any category (programming or general)
				apiUrl += 'Programming,Miscellaneous';
			}
			
			// Add parameters to exclude inappropriate content
			apiUrl += '?blacklistFlags=nsfw,religious,political,racist,sexist,explicit';
			
			// Get joke from API
			const response = await axios.get(apiUrl);
			
			// Format the joke based on type
			let jokeText = '';
			if (response.data.type === 'single') {
				jokeText = response.data.joke;
			} else if (response.data.type === 'twopart') {
				jokeText = `${response.data.setup}\n\n${response.data.delivery}`;
			}
			
			// Send the joke
			return message.reply(jokeText);
			
		} catch (err) {
			return message.reply(getLang('error', err.message));
		}
	}
};
