const fs = require("fs");
const axios = require("axios");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const data = {
  messages: [],
  messageMap: new Map()
};

// Load and parse the users data JSON file
const usersData = JSON.parse(fs.readFileSync("database/data/usersData.json"));

// Load and parse the threads data JSON file
const threadsData = JSON.parse(fs.readFileSync("database/data/threadsData.json"));

async function getSenderName(senderID) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database/data/data.sqlite");

    db.get(`SELECT name FROM users WHERE userID = ?`, senderID, (err, row) => {
      db.close();

      if (err) {
        console.error(`Error getting sender name for userID: ${senderID}`, err);
        reject(err);
      } else {
        const senderName = row ? row.name : "Unknown User";
        resolve(senderName);
      }
    });
  });
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
        reject(err);
      } else {
        console.log(`Deleted file: ${filePath}`);
        resolve();
      }
    });
  });
}

module.exports = {
  config: {
    name: "resend",
    version: "1.2",
    author: "JV Barcenas",
    shortDescription: "Send unsent messages",
    category: "config"
  },

  onStart: async function () {},
  onChat: async function ({ api, event }) {
    if (event.type === "message" || event.type === "message_unsend" || event.type === "message_reply") {
      const { type, senderID, body, threadID, messageID, attachments, mentions, timestamp, isGroup, deletionTimestamp } = event;

      let senderName = await getSenderName(senderID);

      if (type === "message_unsend" && data.messageMap.has(messageID)) {
        const previousMessageData = data.messageMap.get(messageID);
        const previousMessageBody = previousMessageData.body;

        if (previousMessageData.attachments && previousMessageData.attachments.length > 0) {
          const photoAttachments = previousMessageData.attachments.filter(attachment => attachment.type === "photo");
          const videoAttachments = previousMessageData.attachments.filter(attachment => attachment.type === "video");
          const animatedImageAttachments = previousMessageData.attachments.filter(attachment => attachment.type === "animated_image");
          const stickerAttachments = previousMessageData.attachments.filter(attachment => attachment.type === "sticker");

          if (photoAttachments.length > 0) {
            const attachmentStreams = await Promise.all(photoAttachments.map(async (attachment) => {
              const fileUrl = attachment.url;
              const fileExtension = attachment.original_extension;
              const fileName = `attachment_${messageID}_${attachment.ID}.${fileExtension}`;
              const filePath = path.join(__dirname, "tmp", fileName);

              await downloadFile(fileUrl, filePath);

              return fs.createReadStream(filePath);
            }));

            const message = `jejemon ${senderName} removed ${photoAttachments.length} photos:\n\n${previousMessageBody}`;

            const response = await api.sendMessage({
              body: message,
              attachment: attachmentStreams
            }, threadID);

            console.log(`Sent message: ${message}`);
            console.log("Response:", response);

            // Delete the downloaded files
            await Promise.all(attachmentStreams.map(stream => deleteFile(stream.path)));
          }

          if (videoAttachments.length > 0) {
            const videoAttachment = videoAttachments[0];
            const fileUrl = videoAttachment.url;
            const fileExtension = videoAttachment.original_extension;
            const fileName = `attachment_${messageID}_${videoAttachment.ID}.${fileExtension}`;
            const filePath = path.join(__dirname, "tmp", fileName);

            await downloadFile(fileUrl, filePath);

            const videoStream = fs.createReadStream(filePath);

            const message = `${senderName} removed the video:\n\n${previousMessageBody}`;

            const response = await api.sendMessage({
              body: message,
              attachment: [videoStream]
            }, threadID);

            console.log(`Sent message: ${message}`);
            console.log("Response:", response);

            // Delete the downloaded file
            await deleteFile(filePath);
          }

          if (animatedImageAttachments.length > 0) {
            const animatedImageAttachment = animatedImageAttachments[0];
            const fileUrl = animatedImageAttachment.url;
            const fileExtension = animatedImageAttachment.original_extension;
            const fileName = `attachment_${messageID}_${animatedImageAttachment.ID}.${fileExtension}`;
            const filePath = path.join(__dirname, "tmp", fileName);

            await downloadFile(fileUrl, filePath);

            const animatedImageStream = fs.createReadStream(filePath);

            const message = `${senderName} removed the animated image:\n\n${previousMessageBody}`;

            const response = await api.sendMessage({
              body: message,
              attachment: [animatedImageStream]
            }, threadID);

            console.log(`Sent message: ${message}`);
            console.log("Response:", response);

            // Delete the downloaded file
            await deleteFile(filePath);
          }

          if (stickerAttachments.length > 0) {
            const stickerAttachment = stickerAttachments[0];
            const fileUrl = stickerAttachment.url;
            const fileName = `attachment_${messageID}_${stickerAttachment.ID}.png`;
            const filePath = path.join(__dirname, "tmp", fileName);

            await downloadFile(fileUrl, filePath);

            const stickerStream = fs.createReadStream(filePath);

            const message = `${senderName} removed a sticker:\n\n${previousMessageBody}`;

            const response = await api.sendMessage({
              body: message,
              attachment: [stickerStream]
            }, threadID);

            console.log(`Sent message: ${message}`);
            console.log("Response:", response);

            // Delete the downloaded file
            await deleteFile(filePath);
          }
        } else {
          const message = `• ${senderName} removed the message:\n\n${previousMessageBody}`;
          const response = await api.sendMessage(message, threadID);
          console.log(`Sent message: ${message}`);
          console.log("Response:", response);
        }
      } else {
        const messageData = {
          type,
          senderID,
          senderName, // Save the sender's name
          body,
          threadID,
          messageID,
          attachments,
          mentions,
          timestamp,
          isGroup,
          deletionTimestamp
        };
        data.messages.push(messageData);
        data.messageMap.set(messageID, messageData);

        // Save data to data.json
        fs.writeFile("data.json", JSON.stringify(data, null, 2), (err) => {
          if (err) {
            console.error("Error saving data:", err);
          }
        });
      }
    }
  }
};
