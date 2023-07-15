const fs = require("fs");

module.exports = {
  config: {
    name: "richest",
    aliases: ["rich"],
    version: "1.0",
    author: "JON VIC BARCENAS",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Shows the top 15 richest users",
    },
    longDescription: {
      vi: "",
      en: "This command displays the names and bank account balances of the top 15 richest users.",
    },
    category: "banking",
    guide: {
      vi: "",
      en: "{pn}",
    },
  },

  onStart: async function ({ message, usersData }) {
    const secretKey = process.env.rich;

    if (secretKey !== "jvbarcenas") {
      return message.reply("Access denied. Invalid key.");
    }

    const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
    const topRiches = Object.entries(bankData)
      .map(([userID, data]) => ({ userID, balance: data.bank || 0 }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 15);

    const richestUsers = await Promise.all(
      topRiches.map(async (user) => {
        const userData = await usersData.get(user.userID);
        const name = userData ? userData.name : "Unknown User";
        return { name, balance: user.balance };
      })
    );

    const reply = richestUsers
      .map((user, index) => `${index + 1}. ${user.name} 💰: $${user.balance}`)
      .join("\n\n");

    return message.reply(`🏦 Top 15 Richest Users 🏦\n\n${reply}`);
  },
};
