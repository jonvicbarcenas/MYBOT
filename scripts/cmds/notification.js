const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "notification",
		aliases: ["notify", "noti"],
		version: "1.8",
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
			errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2",
			replyNotification: "Phản hồi tin nhắn này để gửi phản hồi đến admin bot",
			reply: "📍 Phản hồi từ nhóm %1:\n─────────────────\n%2\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về nhóm",
			replySuccess: "Đã gửi phản hồi của bạn về nhóm thành công!",
			feedback: "📝 Phản hồi từ admin %1:\n─────────────────\n%2\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về admin"
		},
		en: {
			missingMessage: "Please enter the message you want to send",
			notification: "Notification from admin bot",
			sendingNotification: "Start sending notification",
			sentNotification: "✅ Sent notification successfully to %1 groups",
			errorSendingNotification: "An error occurred while sending to %1 groups:\n%2",
			replyNotification: "Reply to this message to send feedback to admin bot",
			reply: "📍 Reply from group %1:\n─────────────────\n%2\n─────────────────\nReply to this message to send message to the group",
			replySuccess: "Sent your reply to the group successfully!",
			feedback: "📝 Feedback from admin %1:\n─────────────────\n%2\n─────────────────\nReply to this message to send message to admin"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang, usersData }) {
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

		const senderID = event.senderID;
		const senderName = await usersData.getName(senderID);
		
		const formSend = {
			body: `${getLang("notification")}\n────────────────\n${messageContent}\n────────────────\n${getLang("replyNotification")}`,
			attachment: await getStreamsFromAttachment(
				[
					...event.attachments,
					...(event.messageReply?.attachments || [])
				].filter(item => mediaTypes.includes(item.type))
			)
		};

		let sendSuccess = 0;
		const sendError = [];

		for (const tid of threadIDsToSend) {
			try {
				const messageSend = await api.sendMessage(formSend, tid);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID: event.threadID,
					messageIDSender: event.messageID,
					adminID: senderID,
					adminName: senderName,
					type: "notification"
				});
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
	},

	onReply: async function ({ args, event, api, message, Reply, usersData, threadsData, getLang }) {
		const { type, threadID, messageIDSender, adminID, adminName } = Reply;
		const senderID = event.senderID;
		const senderName = await usersData.getName(senderID);

		switch (type) {
			case "notification": {
				const threadInfo = await threadsData.get(event.threadID);
				const formMessage = {
					body: getLang("reply", threadInfo.threadName, args.join(" ")),
					mentions: [{
						id: senderID,
						tag: String(senderName)
					}],
					attachment: await getStreamsFromAttachment(
						event.attachments.filter(item => mediaTypes.includes(item.type))
					)
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err)
						return message.err(err);
					message.reply(getLang("replySuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName: Reply.commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID: event.threadID,
						adminID: Reply.adminID, 
						adminName: Reply.adminName,
						type: "adminReply"
					});
				}, messageIDSender);
				break;
			}
			case "adminReply": {
				const formMessage = {
					body: getLang("feedback", adminName, args.join(" ")),
					mentions: [{
						id: adminID,
						tag: String(adminName)
					}],
					attachment: await getStreamsFromAttachment(
						event.attachments.filter(item => mediaTypes.includes(item.type))
					)
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err)
						return message.err(err);
					message.reply(getLang("replySuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName: Reply.commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						adminID: adminID,
						adminName: adminName,
						threadID: event.threadID,
						type: "notification"
					});
				}, messageIDSender);
				break;
			}
			default: {
				break;
			}
		}
	}
};