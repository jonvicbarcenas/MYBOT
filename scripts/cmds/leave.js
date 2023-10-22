module.exports = {
  config: {
    name: "Leave",
    version: "1.0",
    author: "AL-Rulex(loufi)",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "",
      en: " 😌"
    },
    longDescription: {
      vi: "",
      en: " "
    },
    category: "Owner",
    guide: {
      vi: "",
      en: "{pn} or {pn} <reason>"
    }
  },
  onStart: async function ({ api, args, message, event }) {
    const groupId = args[0];
    if (isNaN(groupId)) {
      api.sendMessage("Already left", event.threadID);
      return;
    }
    
    const messageToSend = args.slice(1).join(" ");
    
    api.sendMessage("Left the group " + groupId, event.threadID);
    
    if (messageToSend) {
      api.sendMessage("Left the group with a Message of: " + messageToSend, groupId);
    }
    
    api.removeUserFromGroup(api.getCurrentUserID(), groupId);
  }
}