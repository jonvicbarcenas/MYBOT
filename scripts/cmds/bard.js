const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

// Function to get the sender's name from the database using their ID
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

const Prefixes = [
  'bard',
  '/bard',
  '.bard',
  '*bard',
  'venti'
];

const API_BASE_URL = 'https://ventithebard.marok85067.repl.co';

module.exports = {
  config: {
    name: 'bard',
    aliases: ['venti'],
    version: '2.5',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Asks an AI for an answer.'
    },
    longDescription: {
      en: 'Asks an AI for an answer based on the user prompt.'
    },
    guide: {
      en: '{pn} [prompt]'
    }
  },
  onStart: async function() {},
  onChat: async function ({ api, event, args, message }) {
    try {
      const prefix = Prefixes.find(p => event.body && event.body.toLowerCase().startsWith(p));

      // Check if the prefix is valid
      if (!prefix) {
        return; // Invalid prefix, ignore the command
      }

      // Remove the prefix from the message body
      const prompt = event.body.substring(prefix.length).trim();

      // Check if prompt is empty
      if (prompt === '') {
        await message.reply("Please state your query, and I will provide you with a response.");
        return;
      }

      // Send a message indicating that the question is being answered
      const responseMessages = [
        `One moment, ${await getSenderName(event.senderID)}. I am answering your question.`,
        `Just a moment, ${await getSenderName(event.senderID)}. I am gathering my thoughts.`,
        `Please bear with me, ${await getSenderName(event.senderID)}. I am searching my vast knowledge for the answer.`,
        `I apologize for the wait, ${await getSenderName(event.senderID)}, but I am almost finished.`,
        `I promise I will answer your question, ${await getSenderName(event.senderID)}. Just give me a moment.`,
        `I am almost there, ${await getSenderName(event.senderID)}. Just hold on.`,
        `I am working on it, ${await getSenderName(event.senderID)}. Please be patient.`,
        `I will answer your question as soon as I can, ${await getSenderName(event.senderID)}.`,
        `I am doing my best, ${await getSenderName(event.senderID)}. Please wait a little longer.`,
        `I will not forget your question, ${await getSenderName(event.senderID)}. I will answer it as soon as possible.`
      ];
      
      const responseMessage = responseMessages[Math.floor(Math.random() * responseMessages.length)];
      await message.reply(responseMessage);
      // Get the sender's name using their ID
      const senderName = await getSenderName(event.senderID);

      // Generate a random prompt ID
      const promptId = generatePromptId();

      // Make the request to the API with prompt, sender name, sender ID, and prompt ID
      const requestData = {
        bard: encodeURIComponent(prompt),
        name: encodeURIComponent(senderName),
        uid: event.senderID,
        promptId
      };

      await axios.get(`${API_BASE_URL}/bard`, { params: requestData });

      // Fetch the answer using the prompt ID
      const response = await axios.get(`${API_BASE_URL}/data`, { params: { promptId } });

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      const answerData = response.data;

      // Send the answer to the user
      await message.reply(`${answerData.answer}`);

      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(
        `${error.message}.\n\nYou can try typing your question again or resending it, as there might be a bug from the server that's causing the problem. It might resolve the issue.`,
        event.threadID
      );
    }
  },
};

// Helper function to generate a random prompt ID
function generatePromptId() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let promptId = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    promptId += characters[randomIndex];
  }

  return promptId;
}

// Helper function to pause execution for a given duration
function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}
