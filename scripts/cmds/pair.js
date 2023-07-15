const fs = require("fs-extra");
const { Canvas, Image } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "1.1",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: "Pair image",
    longDescription: "Pair image",
    category: "image",
    guide: {
      en: "   {pn} @tag1 @tag2",
    },
  },

  langs: {
    vi: {
      noTags: "Bạn phải tag cả hai người bạn muốn ghép đôi",
    },
    en: {
      noTags: "You must tag both users you want to pair",
    },
  },

  onStart: async function ({ event, message, usersData, args, getLang, threadsData, api }) {
    const { threadID, senderID } = event;

    // Retrieve thread members
    const threadData = await threadsData.get(threadID);
    const { members } = threadData;
    const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;

    const uids = Object.keys(event.mentions);

    // Randomly select users from the thread if no tags provided
    if (uids.length === 0) {
      const femaleUsers = [];
      const maleUsers = [];

      for (const userId of usersInGroup) {
        const userData = await usersData.get(userId);
        if (userData && userData.gender === 1) {
          femaleUsers.push(userId);
        } else if (userData && userData.gender === 2) {
          maleUsers.push(userId);
        }
      }

      if (femaleUsers.length === 0 || maleUsers.length === 0)
        return message.reply(getLang("noTags"));

      const randomIndex1 = Math.floor(Math.random() * femaleUsers.length);
      const randomIndex2 = Math.floor(Math.random() * maleUsers.length);

      uids.push(femaleUsers[randomIndex1], maleUsers[randomIndex2]);
    } else if (uids.length === 1) {
      const userGender = (await usersData.get(uids[0])).gender;
      const pairedUsers = [];

      for (const userId of usersInGroup) {
        const userData = await usersData.get(userId);
        if (userData && userData.gender !== userGender) {
          pairedUsers.push(userId);
        }
      }

      if (pairedUsers.length === 0)
        return message.reply(getLang("noTags"));

      const randomIndex = Math.floor(Math.random() * pairedUsers.length);
      uids.push(pairedUsers[randomIndex]);
    }

    if (uids.length !== 2)
      return message.reply(getLang("noTags"));

    const avatarURL1 = await usersData.getAvatarUrl(uids[0]);
    const avatarURL2 = await usersData.getAvatarUrl(uids[1]);

    const avatar1 = await loadImage(avatarURL1);
    const avatar2 = await loadImage(avatarURL2);

    const avatarSize = 200; // Fixed size for avatars

    const canvasWidth = avatarSize * 2;
    const canvasHeight = avatarSize;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");

    const avatar1X = 0;
    const avatar1Y = 0;
    const avatar2X = avatarSize;
    const avatar2Y = 0;

    context.drawImage(avatar1, avatar1X, avatar1Y, avatarSize, avatarSize);
    context.drawImage(avatar2, avatar2X, avatar2Y, avatarSize, avatarSize);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const heartSize = avatarSize * 0.4;

    const heartEmoji = "❤️";
    const fontSize = heartSize * 0.8;
    context.font = `${fontSize}px sans-serif`;
    context.fillStyle = "red";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(heartEmoji, centerX, centerY);

    const pathSave = `${__dirname}/tmp/${uids[0]}_${uids[1]}Pair.png`;
    const out = fs.createWriteStream(pathSave);
    const stream = canvas.createPNGStream();

    stream.pipe(out);
    out.on("finish", () => {
      const content = args.join(" ");
      const user1Name = members.find((member) => member.userID === uids[0])?.name || "User 1";
      const user2Name = members.find((member) => member.userID === uids[1])?.name || "User 2";
      const senderName = members.find((member) => member.userID === senderID)?.name || "Sender";

      const replyMessage = `@${user1Name} ❤️ @${user2Name}\n${content || "Look, they make a great pair!"}`;
      message.reply({
        body: replyMessage,
        attachment: fs.createReadStream(pathSave),
        mentions: [
          {
            id: senderID,
            tag: senderName,
          },
        ],
      }, () => fs.unlinkSync(pathSave));
    });
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = src;
  });
}

function createCanvas(width, height) {
  const canvas = new Canvas(width, height);
  return canvas;
}
