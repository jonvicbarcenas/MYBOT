module.exports = {
  config: {
    name: "admintp",
    aliases: ['tp', 'teleport'],
    version: "1.4",
    author: "jvbeeg",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Tham gia vào nhóm chat",
      en: "Join user to chat group"
    },
    longDescription: {
      vi: "Tham gia vào một nhóm chat cụ thể",
      en: "Join user to a specific chat group"
    },
    category: "owner",
    guide: {
      en: "   {pn} [groupID]"
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
      approve: "- Added you to the approval list"
    }
  },

  onStart: async function ({ message, api, event, args, getLang, usersData }) {
    try {
      const groupID = args[0];
      await api.addUserToGroup(event.senderID, groupID);
  
      const memberApproval = true;
      const senderName = await usersData.getName(event.senderID); // Get the sender name using event.senderID
        
      if (memberApproval) {
        await api.sendMessage(`New member requested to join the group: 
 [BOT ADMIN] ${senderName}`, groupID); // Replace event.senderID with senderName
        await message.reply(getLang("approve", 1));
      } else {
        await api.sendMessage("ADMIN ADDED", groupID);
        await message.reply(getLang("successAdd"));
      }
    } catch (err) {
      await message.reply(getLang("failedAdd"));
    }
  }
};
