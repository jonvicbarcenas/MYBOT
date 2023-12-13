const configVersion = '1.2';
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const https = require('https');

const botAdmins = global.GoatBot.config.adminBot;
const configName = 'announcement';
//sheesh
module.exports = {
  config: {
    name: configName,
    aliases: ["announce", "news"],
    version: configVersion,
    author: 'JV Barcenas',
    countDown: 5,
    role: 0,
    shortDescription: {
      en: 'Manage server announcements'
    },
    longDescription: {
      en: 'Create or display server announcements'
    },
    category: 'admin',
    guide: {
      en: '   {pn} [post|create]: To create a new announcement\n   {pn}: To display the current announcement\n   {pn} update: To update the bot code'
    },
  },

  langs: {
    vi: {
      announcementSet: 'Thông báo của bạn đã được đặt.',
      noAnnouncement: 'Không có thông báo nào hiện tại.',
      currentAnnouncement: 'Thông báo hiện tại:\n%1'
    },
    en: {
      announcementSet: 'Your announcement has been set.',
      noAnnouncement: 'There is no current announcement.',
      currentAnnouncement: '▽ Current announcement ▽:\n───────────────────\n%1\n───────────────────\n',
      updateSuccess: 'Bot code has been successfully updated to the latest version.',
      updateError: 'An error occurred while updating the bot code.',
      fetchError: 'An error occurred while fetching the latest bot code.'
    }
  },

  onStart: async function ({ args, message, api, event }) {
    const senderID = event.senderID;
    const announcementFilePath = path.join(__dirname, 'announcement.txt');
    const versionCheckUrl = `https://versioning.corpselaugh.repl.co/${configName}`;

    if (args[0] === 'update') {
      https.get(versionCheckUrl, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const { name, version, url } = JSON.parse(data);
            if (name === configName && version > this.config.version) {
              https.get(url, (response) => {
                let newData = '';

                response.on('data', (chunk) => {
                  newData += chunk;
                });

                response.on('end', () => {
                  try {
                    fs.writeFileSync(__filename, newData, 'utf8');
                    message.reply(this.langs.en.updateSuccess);
                  } catch (err) {
                    console.error('Error updating bot code:', err);
                    message.reply(this.langs.en.updateError);
                  }
                });
              }).on('error', (err) => {
                console.error('Error fetching new code:', err);
                message.reply(this.langs.en.fetchError);
              });
            } else {
              message.reply('Bot code is already up to date.');
            }
          } catch (err) {
            console.error('Error parsing version check response:', err);
            message.reply('An error occurred while checking for updates.');
          }
        });
      }).on('error', (err) => {
        console.error('Error fetching version check:', err);
        message.reply(this.langs.en.fetchError);
      });

      return;
    }

    if (args[0] === 'post' || args[0] === 'create') {
      const announcementText = args.slice(1).join(' ');

      if (!announcementText) {
        message.reply('Please provide the announcement text. Usage: /announcement create [text]');
        return;
      }

      // Check if the sender is a bot admin
      if (!botAdmins.includes(senderID)) {
        message.reply('You do not have permission to use this command.');
        return;
      }

      try {
        fs.writeFileSync(announcementFilePath, announcementText);
        message.reply(this.langs.en.announcementSet);
      } catch (err) {
        console.error('Error writing to announcement file:', err);
        message.reply('An error occurred while setting the announcement.');
      }

      return;
    }

    // If no arguments, display the current announcement.
    if (!args[0]) {
      try {
        const currentAnnouncement = fs.readFileSync(announcementFilePath, 'utf8');
        if (currentAnnouncement.trim() !== '') {
          message.reply(this.langs.en.currentAnnouncement.replace('%1', currentAnnouncement));
        } else {
          message.reply(this.langs.en.noAnnouncement);
        }
      } catch (err) {
        console.error('Error reading announcement file:', err);
        message.reply('An error occurred while fetching the announcement.');
      }

      return;
    }

    message.reply('Unknown command. Usage: /announcement [post|create|update] [text]');
  }
};
