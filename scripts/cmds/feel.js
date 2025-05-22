const axios = require('axios');
const emoji = require('node-emoji');


// Counter to keep track of received messages bch
let messageCounter = 0; //do not change this this is a counter variable only!!!



//NOOOOOOTEEEEEE!!!


//this. change here, odds of how many messages should bot reacts to
let numOfMessages = 15; // 1 for every messages he reacts to everything. then if 2 the 2nd message will be reacted to and so on.

//NOTE!!: based on all users from bot userdata, not per userID...

function containsOnlyEmojis(text) {
  return emoji.has(text);
}

// Function to extract the first emoji from text
function extractFirstEmoji(text) {
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}]/u;
  const match = text.match(emojiRegex);
  return match ? match[0] : '';
}

module.exports = {
  config: {
    name: 'feel',
    version: '2.0',
    author: 'JV Barcenas',
    role: 0,
    category: 'backend',
    shortDescription: {
      en: 'Performs sentiment analysis on a given text.',
    },
    longDescription: {
      en: 'Analyzes the sentiment of a given text using Gemini API and returns an emoji reaction.',
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
        const apiKey = "AIzaSyCJZCWeH-8rPxRcfyzPuFKoX2otEgB9nJA"; // Same API key as in askv2.js
        const model = "gemini-1.5-flash"; // Using gemini-1.5-flash model as requested
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Create the request body with the instruction to return only one emoji
        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                { 
                  text: `You are a sentiment analysis system. Analyze the sentiment of the following text and respond with EXACTLY ONE EMOJI ONLY - no words, no explanation, no quotes, no additional characters.

Text to analyze: "${text}"

Remember: Your ENTIRE response must be a SINGLE EMOJI and NOTHING ELSE.`
                }
              ]
            }
          ]
        };

        const response = await axios.post(apiUrl, requestBody);

        if (response.status !== 200 || !response.data || !response.data.candidates || 
            !response.data.candidates[0] || !response.data.candidates[0].content || 
            !response.data.candidates[0].content.parts || !response.data.candidates[0].content.parts[0]) {
          throw new Error('Invalid or missing response from Gemini API');
        }

        let sentimentResult = response.data.candidates[0].content.parts[0].text.trim();
        
        // If the response doesn't contain only emojis, try to extract the first emoji
        if (!containsOnlyEmojis(sentimentResult)) {
          console.log('Response contains non-emoji characters, attempting to extract an emoji');
          sentimentResult = extractFirstEmoji(sentimentResult);
          
          // If we still don't have an emoji, use a default
          if (!sentimentResult) {
            console.log('Could not extract an emoji, using default');
            sentimentResult = '😐';
          }
        }

        // Now we should have an emoji to use as a reaction
        api.setMessageReaction(`${sentimentResult}`, event.messageID, (err) => {}, true);
        console.log('Set sentiment analysis result as a reaction to the user');
      }
    } catch (error) {
      console.error(`Failed to perform sentiment analysis: ${error.message}`);
    }
  },
};