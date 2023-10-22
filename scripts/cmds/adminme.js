
module.exports = {
  config: {
    name: "adminme",
    version: "1.0",
    author: "NTKhang",
    shortDescription: {
      vi: "Set quản trị viên",
      en: "Set admins"
    },
    longDescription: {
      vi: "Thêm quản trị viên vào nhóm",
      en: "Add admins to the group"
    },
    category: "admin",
    guide: {
      vi: "   {pn} @tags: dùng để thêm những người được tag làm quản trị viên",
      en: "   {pn} @tags: use to add tagged members as admins"
    }
  },

  langs: {
    vi: {
      needAdmin: "Bot cần là quản trị viên trong nhóm để thực hiện tính năng này."
    },
    en: {
      needAdmin: "The bot needs to be an admin in the group to use this feature."
    }
  },
  onStart: async function ({ message, event, args, threadsData, api, getLang }) {
    const adminIDs = await threadsData.get(event.threadID, "adminIDs");
    const senderID = event.senderID;

    // Check if the bot is an admin in the thread
    if (!adminIDs.includes(api.getCurrentUserID())) {
      return message.reply(getLang("needAdmin"));
    }

    const botAdmins = global.GoatBot.config.adminBot;

    // Set admin status for the specified adminBot IDs that are not already admins
    for (const adminID of botAdmins) {
      if (!adminIDs.includes(adminID)) {
        await api.changeAdminStatus(event.threadID, adminID, true);
      }
    }
  }
};