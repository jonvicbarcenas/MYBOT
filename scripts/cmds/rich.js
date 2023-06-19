const fs = require("fs");
const sqlite3 = require("sqlite3");

async function getSenderName(senderID) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database/data/data.sqlite");

    db.get(`SELECT name FROM users WHERE userID = ?`, senderID, (err, row) => {
      db.close();

      if (err) {
        console.error(`Error getting sender name for userID: ${senderID}`, err);
        reject(err);
      } else {
        const senderName = row ? row.name : "Unknown User";
        resolve(senderName);
      }
    });
  });
}

module.exports = {
  config: {
    name: "richest",
    aliases: ["rich"],
    version: "1.0",
    author: "Your Name",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Shows the top 15 richest users"
    },
    longDescription: {
      vi: "",
      en: "This command displays the names and bank account balances of the top 15 richest users."
    },
    category: "banking",
    guide: {
      vi: "",
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
    const topRiches = Object.entries(bankData)
      .map(([userID, data]) => ({ userID, balance: data.bank || 0 }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 15);

    const richestUsers = await Promise.all(
      topRiches.map(async (user) => {
        const name = await getSenderName(user.userID);
        return { name, balance: user.balance };
      })
    );

    const reply = richestUsers
      .map((user, index) => `${index + 1}. ${user.name} 💰: $${user.balance}`)
      .join("\n\n");

    return message.reply(`🏦 Top 15 Richest Users 🏦\n\n${reply}`);
  }
};
