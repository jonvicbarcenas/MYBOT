const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: 'claim',
    aliases: ["coin", "coins"],
    version: '1.1',
    author: 'JV Barcenas',
    countDown: 5,
    role: 0,
    shortDescription: {
      en: 'Receive daily bard request gift'
    },
    longDescription: {
      en: 'Receive daily bard request gift to use the bard command'
    },
    category: 'games',
    guide: {
      en: '   {pn}' + '\n   {pn}: To receive daily bard request gift '
    },
    envConfig: {
      rewardFirstDay: {
        coin: 3
      }
    }
  },

  langs: {
    vi: {
      alreadyReceived: 'Bạn đã nhận quà rồi',
      received: 'Bạn đã nhận được %1 xu!',
      viewBalance: 'Số dư của bạn là: %1 xu.'
    },
    en: {
      alreadyReceived: 'You have already received the Bard coin for today\'s gift.',
      received: 'You have received %1 BARD coins!',
      viewBalance: 'Your balance is: %1 coins.'
    }
  },

  onStart: async function ({ args, message, event }) {
    const dateTime = moment.tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
    const { senderID } = event;

    let coinData = [];
    try {
      const data = fs.readFileSync('coins.json', 'utf8');
      coinData = JSON.parse(data);
      if (!Array.isArray(coinData)) {
        coinData = [];
      }
    } catch (err) {
      console.error('Error reading or parsing coins.json:', err);
    }

    if (args[0] === 'balance' || args[0] === 'bal') {
      const userCoinData = coinData.find((data) => data.senderID === senderID);
      const userCoins = userCoinData ? userCoinData.coins : 0;
      message.reply(this.langs.en.viewBalance.replace('%1', userCoins));
      return;
    }

    if (args[0] === 'coin' || args[0] === 'claim') {
      const userCoinData = coinData.find((data) => data.senderID === senderID);
      if (userCoinData && userCoinData.date === dateTime) {
        message.reply(this.langs.en.alreadyReceived);
        return;
      }

      // Give 2 coins.
      const getCoin = 3;
      const updatedData = {
        senderID: senderID,
        date: dateTime,
        coins: (userCoinData ? userCoinData.coins : 0) + getCoin
      };

      // Update or add the user's data.
      const index = coinData.findIndex((data) => data.senderID === senderID);
      if (index !== -1) {
        coinData[index] = updatedData;
      } else {
        coinData.push(updatedData);
      }

      try {
        fs.writeFileSync('coins.json', JSON.stringify(coinData, null, 2));
      } catch (err) {
        console.error('Error writing to coins.json:', err);
      }

      message.reply(this.langs.en.received.replace('%1', getCoin));
      return;
    }

    if (args[0] === 'gift') {
      const targetUserID = args[1];
      const coinAmount = parseInt(args[2]);

      if (!targetUserID || !coinAmount || isNaN(coinAmount) || coinAmount <= 0) {
        message.reply('Invalid gift command. Usage: /coin gift <userID> <coinAmount>');
        return;
      }

      // Check if the target user's data is in the JSON.
      const targetUserCoinData = coinData.find((data) => data.senderID === targetUserID);
      if (!targetUserCoinData) {
        message.reply(`User ${targetUserID} is not found in the coin data. Cannot gift coins.`);
        return;
      }

      // Deduct the gifted coins from the sender's balance.
      const senderUserCoinData = coinData.find((data) => data.senderID === senderID);
      if (senderUserCoinData) {
        if (senderUserCoinData.coins < coinAmount) {
          message.reply('You do not have enough coins to gift this amount.');
          return;
        }
        senderUserCoinData.coins -= coinAmount;
      } else {
        message.reply('You do not have enough coins to gift this amount.');
        return;
      }

      // Add the gifted coins to the target user.
      targetUserCoinData.coins += coinAmount;

      try {
        fs.writeFileSync('coins.json', JSON.stringify(coinData, null, 2));
      } catch (err) {
        console.error('Error writing to coins.json:', err);
      }

      message.reply(`You have gifted ${coinAmount} coins to user ${targetUserID}.`);
      return;
    }

    message.reply('Unknown command. Usage: /coin [ balance(bal) | coin(claim) | gift ]');
  }
};
