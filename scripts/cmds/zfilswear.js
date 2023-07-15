const fs = require('fs');
const moment = require('moment-timezone');

const UNBAN_TIME_MINUTES = 3;

function addToBannedUsers(userID, name) {
  const bannedUser = {
    userID,
    name,
    reason: 'badwords spam',
    date: moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'),
    status: 'on',
    unbanTime: moment().add(UNBAN_TIME_MINUTES, 'minutes').tz('Asia/Manila').format('X') // Convert to timestamp
  };

  fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    let bannedUsers = [];
    if (data) {
      bannedUsers = JSON.parse(data);
    }

    // Check if the userID already exists in the bannedUsers array
    const existingUser = bannedUsers.find(user => user.userID === userID);
    if (existingUser) {
      console.log('User already banned:', existingUser);
      return;
    }

    bannedUsers.push(bannedUser);

    fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(bannedUsers, null, 2), (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
}


module.exports = {
  config: {
    name: "swear",
    version: "1.0",
    author: "JV Barcebas",
    countDown: 5,
    role: 0,
    shortDescription: "Handle swear",
    longDescription: "Handle swear",
    category: "reply",
  },
  onStart: async function() {}, 
  onLoad: async function({ usersData }) {}, 
  onChat: async function ({ event, message, getLang, api, usersData }) {
    const swearWords = JSON.parse(fs.readFileSync(`${__dirname}/swearWords.json`));

    if (event.body) {
      const messageBody = event.body.toLowerCase();
      const senderName = await usersData.getName(event.senderID);

      for (const word of swearWords.words) {
        if (messageBody.includes(word)) {
          const swearRecord = {
            name: senderName,
            userID: event.senderID,
            count: 1,
          };

          fs.readFile(`${__dirname}/swearRecords.json`, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }

            let records = [];
            if (data) {
              records = JSON.parse(data);
            }

            const existingRecordIndex = records.findIndex(record => record.userID === swearRecord.userID);

            if (existingRecordIndex !== -1) {
              records[existingRecordIndex].count++;

              if (records[existingRecordIndex].count >= 3) {
                addToBannedUsers(swearRecord.userID, swearRecord.name);
                const status = usersData.get(swearRecord.userID)?.banned?.status;
                if (status) {
                  return message.reply(
                    getLang("userHasBanned", swearRecord.userID, swearRecord.name, usersData.get(swearRecord.userID).banned.reason, usersData.get(swearRecord.userID).banned.date)
                  );
                }
                const time = moment().tz('Asia/Manila').format('DD/MM/YYYY HH:mm:ss');
                usersData.set(swearRecord.userID, {
                  banned: {
                    status: true,
                    reason: 'badwords spam',
                    date: time
                  }
                }).then(() => {
                  // The user data has been set successfully
                }).catch(error => {
                  console.error(error);
                });
              }
            } else {
              records.push(swearRecord);
            }

            fs.writeFile(`${__dirname}/swearRecords.json`, JSON.stringify(records, null, 2), (err) => {
              if (err) {
                console.error(err);
              }
            });
          });

          await api.sendMessage("This is a test. Please don't do anything stupid. I can't unban you at this time because this is still under development.", event.threadID, event.messageID);
          break;
        }
      }
    }
  },
};