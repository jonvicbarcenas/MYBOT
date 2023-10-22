const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: 'claim',
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
        coin: 2
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

    if (args[0] === 'coin') {
      const userCoinData = coinData.find((data) => data.senderID === senderID);
      if (userCoinData && userCoinData.date === dateTime) {
        message.reply(this.langs.en.alreadyReceived);
        return;
      }

      // Give 2 coins.
      const getCoin = 2;
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

    message.reply('Unknown command. Usage: /claim [ balance(bal) | coin ]');
  }
};
