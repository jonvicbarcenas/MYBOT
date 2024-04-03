const { getStreamsFromAttachment } = global.utils;

module.exports = {
	config: {
		name: "notification",
		aliases: ["notify", "noti"],
		version: "1.7",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Gửi thông báo từ admin đến tất cả các nhóm hoặc một nhóm cụ thể",
			en: "Send notification from admin to all groups or a specific group"
		},
		category: "owner",
		guide: {
			en: "{pn} <threadID or 'all'> <message>"
		},
		envConfig: {
			delayPerGroup: 250
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi",
			notification: "Thông báo từ admin bot",
			sendingNotification: "Bắt đầu gửi thông báo",
			sentNotification: "✅ Đã gửi thông báo thành công đến %1 nhóm",
			errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2"
		},
		en: {
			missingMessage: "Please enter the message you want to send",
			notification: "Notification from admin bot",
			sendingNotification: "Start sending notification",
			sentNotification: "✅ Sent notification successfully to %1 groups",
			errorSendingNotification: "An error occurred while sending to %1 groups:\n%2"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang }) {
		const { delayPerGroup } = envCommands[commandName];
		const threadID = args[0];
		const messageContent = args.slice(1).join(" ");
		
		if (!threadID || !messageContent)
			return message.reply(getLang("missingMessage"));

		let threadIDsToSend = [];
		if (threadID.toLowerCase() === 'all') {
			threadIDsToSend = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup).map(t => t.threadID);
		} else {
			threadIDsToSend.push(threadID);
		}

		message.reply(getLang("sendingNotification", threadIDsToSend.length));

		const formSend = {
			body: `${getLang("notification")}\n────────────────\n${messageContent}`,
			attachment: await getStreamsFromAttachment(
				[
					...event.attachments,
					...(event.messageReply?.attachments || [])
				].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
			)
		};

		let sendSuccess = 0;
		const sendError = [];

		for (const tid of threadIDsToSend) {
			try {
				await api.sendMessage(formSend, tid);
				sendSuccess++;
				await new Promise(resolve => setTimeout(resolve, delayPerGroup));
			} catch (e) {
				sendError.push(tid);
			}
		}

		let msg = "";
		if (sendSuccess > 0)
			msg += getLang("sentNotification", sendSuccess) + "\n";
		if (sendError.length > 0)
			msg += getLang("errorSendingNotification", sendError.length, sendError.join("\n"));
		message.reply(msg);
	}
};