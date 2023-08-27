const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "setname",
    version: "1.0",
    author: "JV BARCENAS",
    shortDescription: "Set the name of the user data for the sender.",
    category: "fun",
    role: 2,
    countDown: 3,
    guide: "{prefix}setname [senderID] <newName>"
  },

  onStart: async function ({ args, api, event, getLang, usersData }) {
    const { senderID, threadID } = event;
    let targetID = senderID; // Default to the sender ID

    if (args.length >= 2 && /^\d+$/.test(args[0])) {
      // If the first argument is a valid number, assume it's a sender ID
      targetID = args.shift(); // Remove the sender ID from args
    }

    const newName = args.join(" ");

    if (!newName) {
      return api.sendMessage("Please provide a new name.", threadID);
    }

    // Update the user's name in usersData
    usersData.set(targetID, { name: newName });

    api.sendMessage(`User's name has been updated to "${newName}".`, threadID);
  },
};