const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "switch",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Switch email and password for different accounts."
    },
    longDescription: {
      en: "This command allows you to switch the email and password for different accounts."
    },
    category: "owner",
    guide: {
      en: "To switch account: /switch <accountName>"
    }
  },

	langs: {
		vi: {
			restartting: "🔄 | Đang khởi động lại bot..."
		},
		en: {
			restartting: "🔄 | Restarting bot..."
		}
	},

  onLoad: function ({ api }) {
    const pathFile = `${__dirname}/tmp/switch.txt`;
    if (fs.existsSync(pathFile)) {
      const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
      api.sendMessage(`✅ | Bot Account Switch\n⏰ | Time: ${(Date.now() - time) / 1000}s`, tid);
      fs.unlinkSync(pathFile);
    }
  },

  onStart: async function ({ api, message, event, args, threadsData, getLang }) {
    const accountName = args[0]?.toLowerCase();

    if (!accountName) {
      api.sendMessage(`Please provide an account name to switch to.`, event.threadID);
      return;
    }

    const configFilePath = path.join('config.json');

    if (!fs.existsSync(configFilePath)) {
      api.sendMessage(`Config file not found.`, event.threadID);
      return;
    }

    // Clear the contents of the account.txt file
    const accountFilePath = path.join('account.txt');
    fs.writeFileSync(accountFilePath, '', 'utf8');

    const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    
    const accountConfigs = {
      dain: {
        email: "humbamanok1@gma.com",
        password: "1Dainsleif!"
      },
      xiao: {
        email: "bikyongbik@gmail.com",
        password: "1Barcenasjv"
      }
      // Add more account configurations here if needed
    };

    if (accountName in accountConfigs) {
      const newAccountData = accountConfigs[accountName];
      configData.facebookAccount.email = newAccountData.email;
      configData.facebookAccount.password = newAccountData.password;

      fs.writeFileSync(configFilePath, JSON.stringify(configData, null, 2), 'utf8');
      api.sendMessage(`Switched to ${accountName} account.`, event.threadID);
    } else {
      api.sendMessage(`Account "${accountName}" not found.`, event.threadID);
    }

    // Restart the bot
    const pathFile = `${__dirname}/tmp/switch.txt`;
    fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
    await message.reply(getLang("restartting"));
    process.exit(2);
  }
};
