const fs = require('fs');
const moment = require('moment-timezone');

function validateJSON() {
  fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading bannedtime.json:', err);
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid JSON data structure. Expected an array.');
      }
    } catch (err) {
      console.error('Invalid JSON in bannedtime.json:', err);
      fs.writeFile(`${__dirname}/bannedtime.json`, '[]', (writeErr) => {
        if (writeErr) {
          console.error('Error resetting bannedtime.json:', writeErr);
        }
      });
    }
  });
}

function loadSwearWords() {
  try {
    const data = fs.readFileSync(`${__dirname}/swearWords.json`, 'utf8');
    return JSON.parse(data).words;
  } catch (err) {
    console.error('Error loading swear words:', err);
    return [];
  }
}

function addToBannedUsers(userID, name) {
  const bannedUser = {
    id: userID,
    name,
    countdown: Date.now() + 300 * 1000, // Set the target epoch time 10 minutes from now
    swearCount: 1,
    status: false,
  };

  fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error(readErr);
      return;
    }

    let bannedUsers = [];
    if (data) {
      try {
        bannedUsers = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing bannedtime.json:', parseErr);
        return;
      }
    }

    const existingUser = bannedUsers.find(user => user.id === userID);
    if (existingUser) {
      console.log('User already banned:', existingUser);
      return;
    }

    bannedUsers.push(bannedUser);

    fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(bannedUsers, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to bannedtime.json:', writeErr);
      }
    });
  });
}

module.exports = {
  config: {
    name: "swear",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: "Handle swear",
    longDescription: "Handle swear",
    category: "reply",
  },
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically detects filipino swears`,
      event.threadID,
      event.messageID
    );
  },
  onLoad: async function ({ usersData }) {
    validateJSON();

    fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading bannedtime.json:', err);
        return;
      }

      let bannedUsers = [];
      if (data) {
        bannedUsers = JSON.parse(data);
      }

      const activeBannedUsers = bannedUsers.filter(user => user.status);

      fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(activeBannedUsers, null, 2), (err) => {
        if (err) {
          console.error('Error cleaning bannedtime.json:', err);
        }
      });
    });

    const checkAndUpdateCountdown = () => {
      fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        let bannedUsers = [];
        if (data) {
          bannedUsers = JSON.parse(data);
        }

        const currentTime = Date.now();

        const updatedBannedUsers = bannedUsers.map(user => {
          if (user.status && currentTime > user.countdown) {
            usersData.set(user.id, {
              banned: {
                status: false,
                reason: "",
                date: "",
              },
            });
            user.status = false;
            user.swearCount = 0;
          }
          return user;
        });

        const filteredBannedUsers = updatedBannedUsers.filter(user => user !== null);

        fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(filteredBannedUsers, null, 2), (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    };

    setInterval(checkAndUpdateCountdown, 1000);
  },
  onChat: async function({ event, message, getLang, api, usersData }) {
    if (event.body && !event.body.startsWith('/swearlist')) {
      const senderID = event.senderID;
      const userData = await usersData.get(senderID);
  
      if (userData && userData.banned && userData.banned.status === true) {
        return;
      }
  
      const messageBody = event.body.toLowerCase();
      const userName = (await usersData.getName(event.senderID)) || 'Unknown User';
  
      const swearWords = loadSwearWords();
  
      const wordsInMessage = messageBody.split(/\s+/); // Split message into words
  
      const containsSwearWord = wordsInMessage.some(word => swearWords.includes(word));

      if (containsSwearWord) {
        fs.readFile(`${__dirname}/bannedtime.json`, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          let bannedUsers = [];
          if (data) {
            bannedUsers = JSON.parse(data);
          }

          const existingUserIndex = bannedUsers.findIndex(user => user.id === event.senderID);

          if (existingUserIndex !== -1) {
            if (bannedUsers[existingUserIndex].status) {
              return;
            }

            bannedUsers[existingUserIndex].swearCount++;

            if (bannedUsers[existingUserIndex].swearCount >= 3) {
              bannedUsers[existingUserIndex].status = true;

              const reason = "Using inappropriate language and will be unbanned in 10 minutes";
              const time = moment().format("DD/MM/YYYY HH:mm:ss");
              usersData.set(event.senderID, {
                banned: {
                  status: true,
                  reason,
                  date: time,
                },
              });

              bannedUsers[existingUserIndex].countdown = Date.now() + 300 * 1000;

              fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(bannedUsers, null, 2), (err) => {
                if (err) {
                  console.error(err);
                }
              });

              api.sendMessage('You are now banned for 5 minutes.', event.threadID, event.messageID);

              return;
            }
          } else {
            bannedUsers.push({
              id: event.senderID,
              name: userName,
              countdown: Date.now() + 300 * 1000,
              swearCount: 1,
              status: false,
            });
          }

          fs.writeFile(`${__dirname}/bannedtime.json`, JSON.stringify(bannedUsers, null, 2), (err) => {
            if (err) {
              console.error(err);
            }
          });

          if (usersData.get(event.senderID)?.banned?.status) {
            return;
          }

          api.sendMessage(
            "Detected swear words: Please refrain from using any vulgar words in the chat.",
            event.threadID,
            event.messageID
          );
        });
      }
    }
  },
};
