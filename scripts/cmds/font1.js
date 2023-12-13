const configVersion = '1.4'; //added script font
const axios = require('axios');
const path = require('path');
const moment = require('moment-timezone');
const https = require('https');
const fs = require('fs');

async function echow(args, event, api) {
  const messageReply = event.messageReply;
  if (!messageReply) {
    return null;
  }
  const body = messageReply.body;
  return `\t${body}`;
}

const botAdmins = global.GoatBot.config.adminBot;
const configName = 'font';

module.exports = {
  config: {
    name: configName,
    author: "DAINSLEIF",
    version: configVersion,
    role: 0,
    category: 'fonts'
  },

  langs: {
    en: {
      updateSuccess: 'Font command code has been successfully updated to the latest version.',
      updateError: 'An error occurred while updating the font cmd code.',
      fetchError: 'An error occurred while fetching the latest font cmd code.'
    }
  },

  onStart: async function ({ api, event, args, usersData, threadsData, message }) {
    const repliedMessage = await echow(args, event, api);
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
              message.reply('Font command code is already up to date.');
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

    if (!repliedMessage) {
      message.reply("Please reply to a message to transform its text to a specific font.\n\nNOTE:\n\tTo UPDATE the command type \"/font update\"");
      return;
    }

    const fontOptions = "Please select font:\n1. Monospace\n2. Arial\n3. Script";

    message.reply({
      body: fontOptions
    }, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "font",
        messageID: info.messageID,
        author: event.senderID,
        repliedMessage
      });
    });
  },
  onReply: async function ({ args, event, api, message, Reply }) {
    const { type, author, repliedMessage } = Reply;

    if (event.senderID !== author) {
      return;
    }

    const selectedFont = parseInt(args[0]);

    switch (selectedFont) {
      case 1:
        // Monospace
        try {
          const apiUrl = `https://celestial-dainsleif-docs.archashura.repl.co/monospace?text=${encodeURIComponent(repliedMessage)}`;
          const response = await axios.get(apiUrl);
          const transformedText = response.data.transformedText;
          message.reply(transformedText);
        } catch (error) {
          console.error("Error fetching data from API:", error);
          message.reply("An error occurred while processing your request.");
        }
        break;
      case 2:
        // Arial
        try {
          const apiUrl = `https://celestial-dainsleif-docs.archashura.repl.co/arial?text=${encodeURIComponent(repliedMessage)}`;
          const response = await axios.get(apiUrl);
          const transformedText = response.data.transformedText;
          message.reply(transformedText);
        } catch (error) {
          console.error("Error fetching data from API:", error);
          message.reply("An error occurred while processing your request.");
        }
        break;
        case 3:
          // script
          try {
            const apiUrl = `https://celestial-dainsleif-docs.archashura.repl.co/script?text=${encodeURIComponent(repliedMessage)}`;
            const response = await axios.get(apiUrl);
            const transformedText = response.data.transformedText;
            message.reply(transformedText);
          } catch (error) {
            console.error("Error fetching data from API:", error);
            message.reply("An error occurred while processing your request.");
          }
          break;
      default:
        message.reply("Invalid font selection. Please select 1 for Monospace or 2 for Arial.");
        break;
    }
  }
};