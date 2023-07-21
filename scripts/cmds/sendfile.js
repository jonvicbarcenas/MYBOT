module.exports = {
  config: {
    name: 'sendfile',
    aliases: ['fs'],
    version: '1.0.0',
    author: 'jun',
    category: 'admin'
  },

  onStart: async function ({ args, api, event, usersData }) {
    const permission = ["100007150668975"];
    if (!permission.includes(event.senderID))
      return api.sendMessage(
        "You don't have permission to use this command.",
        event.threadID,
        event.messageID
      );

    const fs = require("fs-extra");
    const stringSimilarity = require('string-similarity');
    const file = args.join(" ");
    if (!file) return api.sendMessage('File name cannot be empty', event.threadID, event.messageID);
    if (!file.endsWith('.js')) return api.sendMessage('The file extension must be .js', event.threadID, event.messageID);
    if (event.type === "message_reply") {
      var uid = event.messageReply.senderID;
      var name = (await usersData.get(uid)).name;
      if (!fs.existsSync(__dirname + "/" + file)) {
        var mdl = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js"));
        mdl = mdl.map(item => item.replace(/\.js/g, ""));
        var checker = stringSimilarity.findBestMatch(file, mdl);
        if (checker.bestMatch.rating >= 1) {
          var search = checker.bestMatch.target;
        }
        if (search === undefined) return api.sendMessage('🔎 File not found ' + args.join(" "), event.threadID, event.messageID);
        return api.sendMessage('🔎 File not found: ' + file + ' \n🔎 The file is similar to: ' + search + '.js \n// Drop your reaction in this message to give it.', event.threadID, (error, info) => {
          formSet.messageID = info.messageID;
        });
      }

      const fileContent = fs.readFileSync(__dirname + '/' + file, 'utf-8');
      return api.sendMessage('//File ' + args.join(' ') + ' here you are:\n\n' + fileContent, uid, () => {
        api.sendMessage('// Check your messages ' + name, event.threadID, (error, info) => {
          if (error) return api.sendMessage('// There was an error sending the file to ' + name, event.threadID, event.messageID);
        }, event.messageID);
      });
    } else {
      if (!fs.existsSync(__dirname + "/" + file)) {
        var mdl = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js"));
        mdl = mdl.map(item => item.replace(/\.js/g, ""));
        var checker = stringSimilarity.findBestMatch(file, mdl);
        if (checker.bestMatch.rating >= 0.5) {
          var search = checker.bestMatch.target;
        }
        if (search === undefined) return api.sendMessage('🔎 File not found ' + args.join(" "), event.threadID, event.messageID);
        return api.sendMessage('🔎 File not found: ' + file + ' \n🔎 File almost like: ' + search + '.js \n// Drop your reaction in this message to give it.', event.threadID, (error, info) => {
        });
      }

      const fileContent = fs.readFileSync(__dirname + '/' + file, 'utf-8');
      return api.sendMessage('// File ' + args.join(' ') + ' here you are:\n// File ' + file + ' here you are:\n\n' + fileContent, event.threadID, () => {
        fs.unlinkSync(__dirname + '/' + file.replace('.js', '.txt'));
      }, event.messageID);
    }
  }
};