module.exports = {
	config: {
		name: "poll",
		version: "1.0",
		author: "JV BARCENAS",
		countDown: 5,
		role: 0,
		description: {
			vi: "Tạo một cuộc thăm dò ý kiến",
			en: "Create a poll for users to vote on"
		},
		category: "group",
		guide: {
			vi: "{pn} <câu hỏi> | <lựa chọn 1> | <lựa chọn 2> | ... (tối đa 10 lựa chọn)",
			en: "{pn} <question> | <option 1> | <option 2> | ... (maximum 10 options)"
		}
	},

	langs: {
		vi: {
			syntaxError: "❌ Sai cú pháp! Hãy sử dụng: {pn} <câu hỏi> | <lựa chọn 1> | <lựa chọn 2> | ...",
			tooFewOptions: "❌ Vui lòng cung cấp ít nhất 2 lựa chọn!",
			tooManyOptions: "❌ Chỉ được phép tối đa 10 lựa chọn!",
			created: "📊 Cuộc thăm dò ý kiến đã được tạo!\n\nHãy thả cảm xúc từ 1️⃣ đến 🔟 để bình chọn!",
			pollFormat: "📊 THĂM DÒ Ý KIẾN\n\n❓ %1\n\n%2"
		},
		en: {
			syntaxError: "❌ Incorrect syntax! Please use: {pn} <question> | <option 1> | <option 2> | ...",
			tooFewOptions: "❌ Please provide at least 2 options!",
			tooManyOptions: "❌ Only a maximum of 10 options is allowed!",
			created: "📊 Poll created!\n\nReact with 1️⃣ to 🔟 to vote!",
			pollFormat: "📊 POLL\n\n❓ %1\n\n%2"
		}
	},

	onStart: async function ({ args, message, commandName, getLang }) {
		const content = args.join(" ");
		
		// Check if the command has the correct format
		if (!content.includes("|")) {
			return message.reply(getLang("syntaxError").replace("{pn}", commandName));
		}
		
		// Split the content by the pipe character
		const parts = content.split("|").map(item => item.trim()).filter(item => item);
		const question = parts[0];
		const options = parts.slice(1);
		
		// Check if there are enough options
		if (options.length < 2) {
			return message.reply(getLang("tooFewOptions"));
		}
		
		// Check if there are too many options
		if (options.length > 10) {
			return message.reply(getLang("tooManyOptions"));
		}
		
		// Emoji numbers for reactions
		const emojiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
		
		// Format options with emoji numbers
		const formattedOptions = options.map((option, index) => 
			`${emojiNumbers[index]} ${option}`
		).join("\n");
		
		// Create poll message
		const pollMessage = getLang("pollFormat", question, formattedOptions);
		
		// Send poll message
		const info = await message.reply(pollMessage);
		
		// Add reaction to the poll message
		if (info && info.messageID) {
			// Store the poll in global variable for future reference if needed
			if (!global.GoatBot.polls) global.GoatBot.polls = [];
			global.GoatBot.polls.push({
				messageID: info.messageID,
				author: message.senderID,
				question,
				options,
				votes: {}
			});
			
			// Let the user know the poll has been created
			message.reply(getLang("created"));
		}
	}
}; 