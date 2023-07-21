const fs = require("fs");

module.exports = {
  config: {
    name: "resetmoney",
    version: "1.9",
    author: "LøüFï/alrulex", /*don't change my credit please 😠*/
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Reset all users' money to zero"
    },
    longDescription: {
      vi: "",
      en: "Reset the money of all users to zero. 😊💗 (by løüfï)"
    },
    category: "banking",
    guide: {
      vi: "",
      en: "{pn}\nReset the money of all users to zero."
    }
  },
  onStart: async function ({ args, message, event, usersData }) {
    // Check if the user has permission to use this command (role 0 for everyone)
    if (this.config.role > 0) {
      return message.reply("You don't have permission to use this command.");
    }

    const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
    const allUserIds = Object.keys(bankData);

    // Reset money of all users to zero
    allUserIds.forEach(userId => {
      const userData = usersData.get(userId);
      userData.money = 0;
      usersData.set(userId, userData);

      bankData[userId].bank = 0;
      bankData[userId].lastInterestClaimed = Date.now();
    });

    // Save updated bank data to "bank.json" file
    fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));

    return message.reply("All users' money has been reset to zero.");
  }
};

/*DO NOT CHANGE CREDIT 🐸*/
