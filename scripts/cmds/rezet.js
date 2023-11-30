const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: 'reset',
    version: '1.1',
    author: 'JV Barcenas',
    countDown: 5,
    role: 2,
    shortDescription: {
      en: 'Reset daily bard request count'
    },
    longDescription: {
      en: 'Reset daily bard request count to 0'
    },
    category: 'games',
    guide: {
      en: '   {pn}' + '\n   {pn}: To reset daily bard request count to 0'
    },
    envConfig: {
      requestLimitFile: 'requestLimit.json'
    }
  },

  langs: {
    vi: {
      resetSuccess: 'Reset thành công. Số lần yêu cầu đã đặt lại thành 0.',
      viewRequestCount: 'Số lần yêu cầu của bạn là: %1.'
    },
    en: {
      resetSuccess: 'Reset successful. The request count has been reset to 0.',
      viewRequestCount: 'BARD request count is: %1.'
    }
  },

  onStart: async function ({ args, message, event, Reaction, api }) {
    const { senderID } = event;
    const isAdmin = global.GoatBot.config.adminBot.includes(senderID);

    if (!isAdmin) {
      api.sendMessage('You do not have the necessary permissions to reset or add to the request count.', event.threadID, event.messageID);
      return;
    }

    if (args[0] === 'rest' || args[0] === 'reset') {
      message.reply('Are you sure you want to reset the request count? React to confirm.', (err, info) => {
        global.GoatBot.onReaction.set(info.messageID, {
          author: senderID,
          messageID: info.messageID,
          commandName: this.config.name,
        });
      });
      return;
    } else if (args[0] === 'request' || args[0] === 'count') {
      let requestLimitData = {};
      try {
        const data = fs.readFileSync(this.config.envConfig.requestLimitFile, 'utf8');
        requestLimitData = JSON.parse(data);
      } catch (err) {
        console.error('Error reading or parsing requestLimit.json:', err);
      }

      const requestCount = requestLimitData.request || 0;
      message.reply(this.langs.en.viewRequestCount.replace('%1', requestCount));
      return;
    } else if (args[0] === 'add' && !isNaN(args[1])) {
      let requestLimitData = {};
      try {
        const data = fs.readFileSync(this.config.envConfig.requestLimitFile, 'utf8');
        requestLimitData = JSON.parse(data);
      } catch (err) {
        console.error('Error reading or parsing requestLimit.json:', err);
      }

      const amountToAdd = parseInt(args[1]);
      if (amountToAdd > 0) {
        requestLimitData.request = (requestLimitData.request || 0) + amountToAdd;

        try {
          fs.writeFileSync(this.config.envConfig.requestLimitFile, JSON.stringify(requestLimitData));
          message.reply(`Added ${amountToAdd} to the request count. Updated count is now ${requestLimitData.request}.`);
        } catch (err) {
          console.error('Error writing to requestLimit.json:', err);
          message.reply('An error occurred while updating the request count.');
        }
      } else {
        message.reply('Please provide a valid positive number to add to the request count.');
      }
    } else {
      message.reply('Unknown command. Usage: /reset [ rest | reset | request(count) | add <amount> ]');
    }
  },

  onReaction: async function ({ event, Reaction, message }) {
    const { author, commandName } = Reaction;
    if (event.userID === author && commandName === this.config.name) {
      let requestLimitData = {};
      try {
        const data = fs.readFileSync(this.config.envConfig.requestLimitFile, 'utf8');
        requestLimitData = JSON.parse(data);
      } catch (err) {
        console.error('Error reading or parsing requestLimit.json:', err);
      }

      requestLimitData.request = 0;
      requestLimitData.lastResetTime = moment().startOf('hour').toISOString();

      try {
        fs.writeFileSync(this.config.envConfig.requestLimitFile, JSON.stringify(requestLimitData));
      } catch (err) {
        console.error('Error writing to requestLimit.json:', err);
        message.reply('An error occurred while resetting the request count.');
        return;
      }

      message.reply(this.langs.en.resetSuccess);
    }
  }
};