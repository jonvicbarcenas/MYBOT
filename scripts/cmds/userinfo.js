module.exports = {
  config: {
    name: "userinfo",
    version: "1.0",
    author: "Arjhil Creds to him [goat mod]",
    countDown: 15,
    role: 0,
    shortDescription: {
      en: "Get user info"
    },
    longDescription: {
      en: "Get user information"
    },
    category: "other",
    guide: {
      en: "   {pn} [name]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, senderID, messageID } = event;

    const getUserInfo = async (targetID) => {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const userInfo = await api.getUserInfo(targetID);

        const {
          name = "Name not available",
          gender = "Gender not available",
          birthday = "Birthday not available",
          profileUrl: profilePicURL = "",
          isOnline,
          isFriend,
          socialMediaLinks = "No additional social media links available"
        } = userInfo[targetID];

        const uid = targetID;

        // Construct Facebook profile link
        const fbLink = `https://www.facebook.com/profile.php?id=${uid}`;

        // Get user status (online, offline, idle)
        const userStatus = isOnline ? "Online 🟢" : "Offline 🔴";

        // Check friendship status (friends or not)
        const areFriends = isFriend ? "Yes ✅" : "No ❌";

        const userInfoMessage = `
🌟 User Information 🌟

📝 Name: ${name}
🆔 UID: ${uid}
👤 Gender: ${gender}
🎂 Birthday: ${birthday}
📊 Status: ${userStatus}
🤝 Friends: ${areFriends}
🌐 Facebook Link: ${fbLink}

🖼️ Profile Picture: ${profilePicURL}

🔗 Additional Social Media Links:
${socialMediaLinks}
        `;

        api.sendMessage(userInfoMessage, threadID, (error, info) => {
          if (!error) {

            // Add a delay to simulate typing
            setTimeout(() => {
              // Add emoji reactions to the message
              api.react("❤️", info.messageID);
              api.react("😊", info.messageID);
              api.react("👍", info.messageID);
            }, 1000);
          }
        });
      } catch (error) {
        console.error(error);
        api.sendMessage("An error occurred while fetching user information.", threadID, messageID);
      }
    };

    if (!args[0]) {
      // If no UID is provided, use the sender's UID
      getUserInfo(senderID);
    } else if (args[0].indexOf("@") !== -1) {
      // If the message mentions a user, extract UID from mentions
      const mentionedUID = Object.keys(event.mentions)[0];
      if (mentionedUID) {
        getUserInfo(mentionedUID);
      }
    } else {
      api.sendMessage("Invalid command usage. Use `userinfo` or `userinfo @mention`.", threadID, messageID);
    }
  }
};