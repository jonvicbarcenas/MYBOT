const { getStreamsFromAttachment } = global.utils;
const axios = require('axios');

module.exports = {
	config: {
		name: "aniwatch",
		aliases: ["animepromo", "animead"],
		version: "1.0",
		author: "JV BARCENAS",
		countDown: 300,
		role: 2,
		description: {
			vi: "Gửi thông tin về ứng dụng AniWatch đến các nhóm",
			en: "Send AniWatch app advertisement to groups"
		},
		category: "owner",
		guide: {
			vi: "{pn} <threadID hoặc 'all'> [message]",
			en: "{pn} <threadID or 'all'> [custom message]"
		},
		envConfig: {
			delayPerGroup: 250,
			appDownloadUrl: "https://exxample.com" // Replace with actual URL
		}
	},

	langs: {
		vi: {
			sendingAd: "⏳ Bắt đầu gửi quảng cáo đến %1 nhóm...",
			sentSuccess: "✅ Đã gửi quảng cáo thành công đến %1 nhóm",
			errorSending: "❌ Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2",
			shortenError: "❌ Không thể rút gọn URL: %1"
		},
		en: {
			sendingAd: "⏳ Starting ad campaign to %1 groups...",
			sentSuccess: "✅ Successfully sent ad to %1 groups",
			errorSending: "❌ Error sending to %1 groups:\n%2",
			shortenError: "❌ Couldn't shorten URL: %1"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang }) {
		const { delayPerGroup, appDownloadUrl } = envCommands[commandName];
		const threadID = args[0];
		let customMessage = args.slice(1).join(" ");
		
		// Generate Ad Messages (randomize to keep it fresh)
		const adMessages = [
			// Dramatic messages
			"🔥🔥 ATTENTION ANIME FANS! 🔥🔥\n\nAre you tired of low-quality anime streams that buffer every 5 seconds? Is your current anime app BETRAYING YOU with ads that pop up during the most intense fight scenes?\n\n✨ YOUR ANIME SUFFERING ENDS TODAY! ✨\n\nIntroducing AniWatch - the LEGENDARY app that will transform your anime experience forever! With our app, you're not just watching anime, you're LIVING IT!",
			
			"🌟 BREAKING NEWS FOR WEEBS EVERYWHERE! 🌟\n\nScientists have discovered that watching anime on inferior platforms causes severe disappointment and dramatic sighing! But there's hope...\n\n✨ BEHOLD! ANIWATCH HAS ARRIVED! ✨\n\nThe ONLY anime streaming app approved by the Council of Anime Elders! Your favorite waifus and husbandos have been BEGGING you to download this app!",
			
			"🎭 DRAMATIC ANIME ANNOUNCEMENT! 🎭\n\n*intense music plays*\n\nIn a world where buffering ruins every climactic battle scene...\nOne app stands alone against the darkness...\n\n✨ ANIWATCH: THE AWAKENING ✨\n\nDownload now and unlock your final anime form! This isn't just an app upgrade, it's an ANIME LIFE UPGRADE!",
			
			// Funny messages
			"🤣 ATTENTION FELLOW HUMANS WHO PRETEND TO WORK WHILE ACTUALLY THINKING ABOUT ANIME! 🤣\n\nYour secret anime addiction just got an upgrade! Introducing AniWatch - the app so good, even your non-anime friends will become cultured!\n\nWarning: May cause excessive binge-watching and spontaneous Japanese phrases to slip into your everyday conversation. Your boss won't understand why you're suddenly shouting 'NANI?!' in meetings!",
			
			"🍜 RAMEN-EATING ANIME FANS ASSEMBLE! 🍜\n\nAre you still watching anime like it's 2010? That's more embarrassing than getting caught doing a Naruto run in public!\n\nLevel up your weeb game with AniWatch - it's like having a tiny anime convention in your pocket, minus the sweaty cosplayers! Download now before your waifu judges you for being behind the times!"
		];
		
		// Choose a random ad message if custom message not provided
		const baseAdMessage = customMessage || adMessages[Math.floor(Math.random() * adMessages.length)];
		
		// Try to shorten the URL
		let shortUrl;
		try {
			// Try TinyURL service
			const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(appDownloadUrl)}`, {
				timeout: 7000
			});
			shortUrl = response.data;
		} catch (err) {
			console.error("URL shortening error:", err.message);
			shortUrl = appDownloadUrl; // Use original URL if shortening fails
			message.reply(getLang("shortenError", err.message));
		}
		
		// Add download link and call to action
		const fullAdMessage = `${baseAdMessage}\n\n📱 DOWNLOAD NOW: ${shortUrl}\n\n⚡ Features:\n- HD streaming with NO buffering\n- MASSIVE library of anime\n- New episodes FASTER than anyone else\n- ZERO annoying pop-up ads\n- FREE (yes, actually free!)\n\n🔔 Don't miss out! Your anime journey awaits! Download now and thank me later! 🙏`;

		// Get list of threads to send to
		let threadIDsToSend = [];
		if (!threadID || threadID.toLowerCase() === 'all') {
			threadIDsToSend = (await threadsData.getAll())
				.filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup)
				.map(t => t.threadID);
		} else {
			threadIDsToSend.push(threadID);
		}

		// Notify about starting the campaign
		message.reply(getLang("sendingAd", threadIDsToSend.length));

		// Prepare message with any attachments
		const formSend = {
			body: fullAdMessage,
			attachment: await getStreamsFromAttachment(
				[
					...event.attachments,
					...(event.messageReply?.attachments || [])
				].filter(item => ["photo", "png", "animated_image", "video"].includes(item.type))
			)
		};

		// Send to all threads
		let sendSuccess = 0;
		const sendError = [];

		for (const tid of threadIDsToSend) {
			try {
				await api.sendMessage(formSend, tid);
				sendSuccess++;
				await new Promise(resolve => setTimeout(resolve, delayPerGroup));
			} catch (e) {
				sendError.push(tid);
				console.error(`Error sending to ${tid}:`, e);
			}
		}

		// Report results
		let msg = "";
		if (sendSuccess > 0)
			msg += getLang("sentSuccess", sendSuccess) + "\n";
		if (sendError.length > 0)
			msg += getLang("errorSending", sendError.length, sendError.join("\n"));
		message.reply(msg);
	}
}; 