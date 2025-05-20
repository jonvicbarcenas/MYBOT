const axios = require('axios');

module.exports = {
	config: {
		name: "shorten",
		version: "1.0",
		author: "JV BARCENAS",
		countDown: 5,
		role: 0,
		description: {
			vi: "Rút gọn URL dài thành URL ngắn hơn",
			en: "Shorten long URLs into compact ones"
		},
		category: "utility",
		guide: {
			vi: "{pn} <URL cần rút gọn>",
			en: "{pn} <URL to shorten>"
		}
	},

	langs: {
		vi: {
			error: "❌ Đã xảy ra lỗi: %1",
			missingUrl: "❌ Vui lòng nhập URL cần rút gọn",
			invalidUrl: "❌ URL không hợp lệ. Vui lòng cung cấp URL đầy đủ (bao gồm http:// hoặc https://)",
			success: "✅ URL đã được rút gọn:\n\n📎 URL gốc: %1\n🔗 URL rút gọn: %2"
		},
		en: {
			error: "❌ An error occurred: %1",
			missingUrl: "❌ Please provide a URL to shorten",
			invalidUrl: "❌ Invalid URL. Please provide a complete URL (including http:// or https://)",
			success: "✅ URL has been shortened:\n\n📎 Original: %1\n🔗 Shortened: %2"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const url = args[0];
		
		// Check if URL is provided
		if (!url) {
			return message.reply(getLang("missingUrl"));
		}
		
		// Validate URL format
		const urlRegex = /^(http|https):\/\/[^ "]+$/;
		if (!urlRegex.test(url)) {
			return message.reply(getLang("invalidUrl"));
		}
		
		try {
			// Try multiple URL shortening APIs in case some fail
			const services = [
				// TinyURL API
				async () => {
					const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
						timeout: 7000
					});
					return response.data;
				},
				// Cleanuri API
				async () => {
					const response = await axios.post('https://cleanuri.com/api/v1/shorten', 
						`url=${encodeURIComponent(url)}`,
						{
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded'
							},
							timeout: 7000
						}
					);
					return response.data.result_url;
				},
				// Shrtco.de API
				async () => {
					const response = await axios.get(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`, {
						timeout: 7000
					});
					return response.data.result.full_short_link;
				}
			];
			
			// Try each service until one works
			let shortUrl = null;
			let error = null;
			
			for (const service of services) {
				try {
					shortUrl = await service();
					if (shortUrl) break;
				} catch (err) {
					error = err;
					// Continue to next service
				}
			}
			
			if (!shortUrl) {
				throw error || new Error("All URL shortening services failed");
			}
			
			return message.reply(getLang("success", url, shortUrl));
		} catch (err) {
			console.error("URL shortening error:", err.message);
			return message.reply(getLang("error", err.message));
		}
	}
}; 