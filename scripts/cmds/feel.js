const axios = require('axios');
const emoji = require('node-emoji');


// Counter to keep track of received messages bch
let messageCounter = 0; //do not change this this is a counter variable only!!!



//NOOOOOOTEEEEEE!!!


//this. change here, odds of how many messages should bot reacts to
let numOfMessages = 10; // 1 for every messages he reacts to everything. then if 2 the 2nd message will be reacted to and so on.

//NOTE!!: based on all users from bot userdata, not per userID...

function containsOnlyEmojis(text) {
  return emoji.has(text);
}

module.exports = {
  config: {
    name: 'feel',
    version: '1.2',
    author: 'JV Barcenas',
    role: 0,
    category: 'backend',
    shortDescription: {
      en: 'Performs sentiment analysis on a given text.',
    },
    longDescription: {
      en: 'Analyzes the sentiment of a given text using the sentiment analysis API.',
    },
    guide: {
      en: 'NO GUIDE LOL',
    },
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message }) {
    try {
      messageCounter++;

      const text = event.body.trim();

      if (text === '') {
        return;
      }

      if (messageCounter % numOfMessages === 0) {
        const response = await axios.get(`https://nah-i-would-win.archashura.repl.co/?iyot=${encodeURIComponent(text)}`);

        if (response.status !== 200 || !response.data || !response.data.content) {
          throw new Error('Invalid or missing response from API');
        }

        const sentimentResult = response.data.content.trim();

        if (containsOnlyEmojis(sentimentResult)) {
          api.setMessageReaction(`${sentimentResult}`, event.messageID, (err) => {}, true);
          console.log('Set sentiment analysis result as a reaction to the user');
        } else {
          throw new Error('The response does not contain only emojis.');
        }
      }
    } catch (error) {
      console.error(`Failed to perform sentiment analysis: ${error.message}`);
    }
  },
};