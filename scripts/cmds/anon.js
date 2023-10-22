const { getStreamsFromAttachment } = global.utils;
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "anon",
		aliases: ["anonymous"],
		version: "1.0",
		author: "JV BARCENAS",
		countDown: 5,
		role: 0,
		shortDescription: {
			vi: "gửi tin nhắn ẩn danh",
			en: "send anonymous message"
		},
		longDescription: {
			vi: "gửi tin nhắn ẩn danh tới người dùng",
			en: "send anonymous message to user"
		},
		category: "contacts admin",
		guide: {
			vi: "   {pn} <người dùng> <tin nhắn>",
			en: "   {pn} <user> <message>"
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về người dùng",
			sendByGroup: "\n- Được gửi từ nhóm: %1\n- Thread ID: %2",
			sendByUser: "\n- Được gửi từ người dùng",
			content: "\n\nNội dung:\n─────────────────\n%1\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về người dùng",
			success: "Đã gửi tin nhắn của bạn thành công!\n%2",
			failed: "Đã có lỗi xảy ra khi gửi tin nhắn của bạn\n%2",
			reply: "📍 Phản hồi từ người dùng %1:\n─────────────────\n%2\n─────────────────\nPhản hồi tin nhắn này để tiếp tục gửi tin nhắn về người dùng",
			replySuccess: "Đã gửi phản hồi của bạn thành công!",
			feedback: "📝 Phản hồi từ người dùng %1:\n- User ID: %2%3\n\nNội dung:\n─────────────────\n%4\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về người dùng",
			replyUserSuccess: "Đã gửi phản hồi của bạn về người dùng thành công!",
			noAdmin: "Hiện tại bot chưa có admin nào"
		},
		en: {
			missingMessage: "Please enter the message you want to send to the user",
			sendByGroup: "\n- Sent from group: %1\n- Thread ID: %2",
			sendByUser: "\n- Sent from user",
			content: "\n\nContent:\n─────────────────\n%1\n─────────────────\nReply this message to send message to user",
			success: "Sent your message successfully!\n%2",
			failed: "An error occurred while sending your message\n%2",
			reply: "📍 Reply from user %1:\n─────────────────\n%2\n─────────────────\nReply this message to continue send message to user",
			replySuccess: "Sent your reply successfully!",
			feedback: "📝 Feedback from user %1:\n\nContent:\n─────────────────\n%4\n─────────────────\nReply this message to send message to user",
			replyUserSuccess: "Sent your reply to user successfully!",
			noAdmin: "Bot has no admin at the moment"
		}
	},

  onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
      const { config } = global.GoatBot;
      if (args.length < 2)
          return message.reply(getLang("missingMessage"));
  
      const recipientID = args[0]; // The ID of the user to send the message to
      const messageContent = args.slice(1).join(" "); // The content of the message
  
      const { threadID, isGroup } = event;
      if (config.adminBot.length === 0)
          return message.reply(getLang("noAdmin"));
  
      const recipientName = await usersData.getName(recipientID); // Get the recipient's name
      const groupName = isGroup ? (await threadsData.get(threadID)).threadName : "Unknown Group";
      const threadIDStr = `Thread ID: ${threadID}`;
      const msg = `==📨️ ANONYMOUS MESSAGE 📨️==`
          + `\n- Recipient Name: ${recipientName}`
          + (isGroup ? `\n- Sent from group: ${groupName}\n- ${threadIDStr}` : "")
          + `\n\nContent:\n─────────────────\n${messageContent}`
          + `\n─────────────────\nReply this message to send message to the anonymous user`;
  
      const formMessage = {
          body: msg,
          mentions: [],
          attachment: await getStreamsFromAttachment(
              [...event.attachments, ...(event.messageReply?.attachments || [])]
                  .filter(item => mediaTypes.includes(item.type))
          )
      };
  
      try {
          const messageSend = await api.sendMessage(formMessage, recipientID);
          global.GoatBot.onReply.set(messageSend.messageID, {
              commandName,
              messageID: messageSend.messageID,
              threadID,
              messageIDSender: event.messageID,
              type: "userAnonymous"
          });
  
          return message.reply("Your anonymous message has been sent successfully!");
      } catch (err) {
          if (err.errorDescription === "This person isn't available right now.") {
              return message.reply("Sorry, the recipient isn't available right now.");
          } else {
              return message.reply("An error occurred while sending your anonymous message.");
          }
      }
  },

  onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
      const { type, threadID, messageIDSender } = Reply;
      const recipientName = await usersData.getName(event.senderID); // Get the sender's name
      const { isGroup } = event;
  
      switch (type) {
          case "userAnonymous": {
              const formMessage = {
                  body: getLang("reply", '', args.join(" ")), // Exclude the sender's name
                  mentions: [],
                  attachment: await getStreamsFromAttachment(
                      event.attachments.filter(item => mediaTypes.includes(item.type))
                  )
              };
  
              api.sendMessage(formMessage, threadID, (err, info) => {
                  if (err)
                      return message.err(err);
                  message.reply(getLang("replyUserSuccess"));
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName,
                      messageID: info.messageID,
                      messageIDSender: event.messageID,
                      threadID: event.threadID,
                      type: "adminReply"
                  });
              }, messageIDSender);
              break;
          }
          case "adminReply": {
              let sendByGroup = "";
              if (isGroup) {
                  const { threadName } = await api.getThreadInfo(event.threadID);
                  sendByGroup = getLang("sendByGroup", threadName, event.threadID);
              }
              const formMessage = {
                  body: getLang("feedback", '', '', sendByGroup, args.join(" ")), // Exclude the sender's name
                  mentions: [],
                  attachment: await getStreamsFromAttachment(
                      event.attachments.filter(item => mediaTypes.includes(item.type))
                  )
              };
  
              api.sendMessage(formMessage, threadID, (err, info) => {
                  if (err)
                      return message.err(err);
                  message.reply(getLang("replySuccess"));
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName,
                      messageID: info.messageID,
                      messageIDSender: event.messageID,
                      threadID: event.threadID,
                      type: "userAnonymous"
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