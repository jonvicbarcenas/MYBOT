const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "draw",
    aliases: [],
    author: "munem",
    version: "1.0",
    countDown: 10,
    role: 0,
    shortDescription: "Generates an image from a text description",
    longDescription: "Generates an image from a text description",
    category: "ai",
    guide: {
      en: "{pn} <text>"
    }
  },

  langs: {
    en: {
      loading: "Generating image, please wait...",
      error: "An error occurred, please try again later",
      approve_success: "The imagine command has been approved!",
      approve_error: "Only administrators can approve the imagine command",
      disapprove_success: "The imagine command has been disapproved!",
      disapprove_error: "Only administrators can disapprove the imagine command",
      already_approved: "imagine command has already been approved",
      already_disapproved: "The imagine command has already been disapproved",
      group_not_approved: "imagine is paid command.Donate to my admin to use it"
    }
  },

  onStart: async function ({ event, message, getLang, threadsData, api, args }) {
    const { threadID } = event;

    if (args[0] === "approve") {
      if (global.GoatBot.config.adminBot.includes(event.senderID)) {
        const approved = await threadsData.get(threadID, "settings.imagine_approved");
        if (approved) {
          return message.reply(getLang("already_approved"));
        }
        await threadsData.set(threadID, true, "settings.imagine_approved");
        return message.reply(getLang("approve_success"));
      }
      return message.reply(getLang("approve_error"));
    } else if (args[0] === "disapprove") {
      if (global.GoatBot.config.adminBot.includes(event.senderID)) {
        const approved = await threadsData.get(threadID, "settings.imagine_approved");
        if (!approved) {
          return message.reply(getLang("already_disapproved"));
        }
        await threadsData.set(threadID, false, "settings.imagine_approved");
        return message.reply(getLang("disapprove_success"));
      }
      return message.reply(getLang("disapprove_error"));
    }

    const approved = await threadsData.get(threadID, "settings.imagine_approved");
    if (!approved) {
      return message.reply(getLang("group_not_approved"));
    }

    message.reply(getLang("loading"));
    const text = args.join(' ');

    try {
      const { data } = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'image-alpha-001',
          prompt: text,
          num_images: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer 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`
          }
        }
      );
      const imageURL = data.data[0].url;
      const image = await getStreamFromURL(imageURL);
      return message.reply({
        attachment: image
      });
    } catch (err) {
      return message.reply(getLang("error"));
    }
  }
};