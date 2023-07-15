module.exports = {
  config: {
    name: "joinbotgroup",
    aliases: ['joingp', 'joingroup', 'join', 'joinbotgp'],
    version: "1.4",
    author: "jvb",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Tham gia vào nhóm chat",
      en: "Join user to chat group"
    },
    longDescription: {
      vi: "Tham gia vào nhóm chat có sẵn",
      en: "Join user to an existing chat group"
    },
    category: "box chat",
    guide: {
      en: "   {pn}"
    }
  },

  langs: {
    vi: {
      successAdd: "- Đã tham gia thành công vào nhóm",
      failedAdd: "- Không thể tham gia vào nhóm",
      approve: "- Đã thêm %1 thành viên vào danh sách phê duyệt"
    },
    en: {
      successAdd: "- Successfully joined the group",
      failedAdd: "- Failed to join the group",
      approve: "- Added %1 members to the approval list"
    }
  },

  onStart: async function ({ message, api, event, getLang }) {
    try {
      await api.addUserToGroup(event.senderID, "6695207353846930");
      await message.reply(getLang("successAdd"));
    } catch (err) {
      await message.reply(getLang("failedAdd"));
    }
  }
};
