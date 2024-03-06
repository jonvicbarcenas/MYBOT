const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "1.6",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Gửi thông báo từ admin đến all box",
      en: "Send notification from admin to all box"
    },
    longDescription: {
      vi: "Gửi thông báo từ admin đến all box",
      en: "Send notification from admin to all box"
    },
    category: "owner",
    guide: {
      en: "{pn} <groupID> <message>"
    },
    envConfig: {
      delayPerGroup: 550
    }
  },

  langs: {
    vi: {
      missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm",
      notification: "Thông báo từ admin bot đến tất cả nhóm chat (không phản hồi tin nhắn này)",
      sendingNotification: "Bắt đầu gửi thông báo từ admin bot đến %1 nhóm chat",
      sentNotification: "✅ Đã gửi thông báo đến %1 nhóm thành công",
      errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2"
    },
    en: {
      missingMessage: "Please enter the message you want to send to all groups",
      notification: "Notification from admin bot to specific chat group (do not reply to this message)",
      sendingNotification: "Start sending notification from admin bot to %1 chat group",
      sentNotification: "✅ Sent notification to %1 group successfully",
      errorSendingNotification: "An error occurred while sending to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, getLang }) {
    const { delayPerGroup } = envCommands[commandName];
    if (args.length < 2)
      return message.reply(getLang("missingMessage"));

    const groupID = args[0];
    const notificationMessage = args.slice(1).join(" ");

    const formSend = {
      body: `${getLang("notification")}\n────────────────\n${notificationMessage}`,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    let allThreadID = [];

    if (groupID.toLowerCase() === "all") {
      allThreadID = (await api.getThreadList(100, null, ["INBOX"])).filter(t => t.isGroup);
    } else {
      try {
        const thread = await api.getThreadInfo(groupID);
        if (thread && thread.isGroup) {
          allThreadID.push(thread);
        } else {
          return message.reply("Invalid group ID provided.");
        }
      } catch (error) {
        console.error(error);
        return message.reply("An error occurred while fetching thread information.");
      }
    }

    message.reply(getLang("sendingNotification", allThreadID.length > 0 ? allThreadID.length : "all"));

    let sendSuccess = 0;
    const sendError = [];
    const waitingSend = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      try {
        waitingSend.push({
          threadID: tid,
          pending: api.sendMessage(formSend, tid)
        });
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      } catch (e) {
        sendError.push(tid);
      }
    }

    for (const sent of waitingSend) {
      try {
        await sent.pending;
        sendSuccess++;
      } catch (e) {
        const { errorDescription } = e;
        if (!sendError.some(item => item.errorDescription == errorDescription))
          sendError.push({
            threadIDs: [sent.threadID],
            errorDescription
          });
        else
          sendError.find(item => item.errorDescription == errorDescription).threadIDs.push(sent.threadID);
      }
    }

    let msg = "";
    if (sendSuccess > 0)
      msg += getLang("sentNotification", sendSuccess) + "\n";
    if (sendError.length > 0)
      msg += getLang(
        "errorSendingNotification",
        sendError.reduce((total, item) => total + item.threadIDs.length, 0),
        sendError.reduce(
          (acc, item) => acc + `\n - ${item.errorDescription}\n  + ${item.threadIDs.join("\n  + ")}`,
          ""
        )
      );
    message.reply(msg);
  }
};
