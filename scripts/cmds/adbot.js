const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "addbot",
    aliases: ["addu"],
    version: "1.0",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Thêm người dùng vào tất cả các nhóm chat",
      en: "Add user to all chat groups"
    },
    longDescription: {
      vi: "Thêm người dùng vào tất cả các nhóm chat",
      en: "Add user to all chat groups"
    },
    category: "owner",
    guide: {
      en: "{pn} <uid>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    vi: {
      missingUid: "Vui lòng nhập ID người dùng bạn muốn thêm vào tất cả các nhóm",
      addingUser: "Đang thêm người dùng vào %1 nhóm chat",
      successMessage: "Đã thêm người dùng vào %1 nhóm thành công",
      errorMessage: "Lỗi khi thêm người dùng vào %1 nhóm:\n%2",
      alreadyExistsMessage: "Người dùng đã có trong nhóm %1, bỏ qua",
      backupNotification: "This is a backup note"
    },
    en: {
      missingUid: "Please enter the user ID you want to add to all groups",
      addingUser: "Adding user to %1 chat groups",
      successMessage: "Added user to %1 groups successfully",
      errorMessage: "An error occurred while adding user to %1 groups:\n%2",
      alreadyExistsMessage: "User already exists in group %1, skipping",
      backupNotification: "This is a backup note"
    }
  },

  onStart: async function ({ message, api, threadsData, args, commandName, envCommands, getLang }) {
    const { delayPerGroup } = envCommands[commandName];

    if (!args[0]) {
      return message.reply(getLang("missingUid"));
    }

    const allThreadID = threadsData
      .getAll()
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    message.reply(getLang("addingUser", allThreadID.length));

    const uid = args[0];
    const addSuccess = [];
    const addError = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      const threadMembers = thread.members.map(member => member.userID);

      if (threadMembers.includes(uid)) {
        addError.push(tid);
        continue;
      }

      try {
        await api.addUserToGroup(uid, tid);
        addSuccess.push(tid);
      } catch (error) {
        addError.push(tid);
      }

      await new Promise(resolve => setTimeout(resolve, delayPerGroup));
    }

    let msg = "";
    if (addSuccess.length > 0) {
      msg += getLang("successMessage", addSuccess.length) + "\n";
    }
    if (addError.length > 0) {
      const errorDescription = getLang("errorMessage", addError.length);
      const alreadyExistsDescription = getLang("alreadyExistsMessage", addError.length);
      msg += `${errorDescription}\n - ${alreadyExistsDescription}\n  + ${addError.join("\n  + ")}`;
    }
    message.reply(msg);

    // Send backup notification
    if (addSuccess.length > 0) {
      message.send(getLang("backupNotification"));
    }
  }
};
