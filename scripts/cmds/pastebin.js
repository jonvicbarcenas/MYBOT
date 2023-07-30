const PastebinAPI = require('pastebin-js');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "pastebin",
    version: "1.0",
    author: "SANDIP",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Upload files to pastebin and sends link"
    },
    longDescription: {
      en: "This command allows you to upload files to pastebin and sends the link to the file."
    },
    category: "owner",
    guide: {
      en: "To use this command, type !pastebin <filename>. The file must be located in the 'cmds' folder."
    }
  },

  onStart: async function({ api, event, args }) {
    const pastebin = new PastebinAPI({
      api_dev_key: 'Mai5oU26abGZe62u2cJF63AAoilm-SlU',
      api_user_key: '',
    });

    const fileName = args[0];
    const filePathWithoutExtension = path.join(__dirname, '..', 'cmds', fileName);
    const filePathWithExtension = path.join(__dirname, '..', 'cmds', fileName + '.js');

    if (!fs.existsSync(filePathWithoutExtension) && !fs.existsSync(filePathWithExtension)) {
      return api.sendMessage('File not found!', event.threadID);
    }

    const filePath = fs.existsSync(filePathWithoutExtension) ? filePathWithoutExtension : filePathWithExtension;

    fs.readFile(filePath, 'utf8', async (err, data) => {
      if (err) throw err;

      try {
        const paste = await pastebin.createPaste({
          text: data,
          title: fileName,
          format: null,
          privacy: 0,
        });

        if (paste) {
          const rawPaste = paste.replace("pastebin.com", "pastebin.com/raw");
          api.sendMessage(`File uploaded to Pastebin: ${rawPaste}`, event.threadID);
        } else {
          api.sendMessage('Error occurred while uploading to Pastebin.', event.threadID);
        }
      } catch (error) {
        console.error('Error uploading to Pastebin:', error);
        api.sendMessage('Error occurred while uploading to Pastebin.', event.threadID);
      }
    });
  },
};