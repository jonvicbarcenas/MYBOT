// File zsheesh.js here you are:
// File zsheesh.js here you are:

// Define the bannedReturn function to check and respond if the user is banned
async function bannedReturn(api, event, userData) {
  if (userData && userData.banned && userData.banned.status === true) {
    const banReason = userData.banned.reason || "No reason provided";
    const banTime = userData.banned.date || "Unknown date";
    const banMessage = `You are banned.\nReason: ${banReason}\nTime: ${banTime}`;
    await api.sendMessage(banMessage, event.threadID, event.messageID);
    return true; // User is banned
  }
  return false; // User is not banned
}

module.exports = {
  config: {
    name: "sheesh",
    version: "1.0",
    author: "XyryllPanget",
    countDown: 5,
    role: 0,
    shortDescription: "auto reply 😎",
    longDescription: "auto reply 😎",
    category: "reply",
  },
  onStart: async function () {},
  onChat: async function ({ event, message, getLang, api, usersData }) {
    const sheeshRegex = /^(shesh|sheesh|sheeesh|sheeeesh|sheeeeesh|sheeeeeesh|sheeeeeeesh)$/i;

    if (event.body && sheeshRegex.test(event.body)) {
      const senderID = event.senderID;
      const userData = await usersData.get(senderID);

      // Call the bannedReturn function to check if the user is banned
      if (await bannedReturn(api, event, userData)) {
        return; // Do not proceed to send "😎" if the user is banned.
      }

      await api.sendMessage("😎", event.threadID, event.messageID);
    }
  },
};