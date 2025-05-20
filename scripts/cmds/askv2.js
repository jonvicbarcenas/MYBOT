const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Prefixes = [
  'gpt',
  '/gpt',
  'ai',
  '!ai',
  '@Meta',
  'dain'
];

// Storage for conversation history
if (!global.temp.geminiHistory) 
  global.temp.geminiHistory = {};

// Storage for OpenRouter conversation history
if (!global.temp.openRouterHistory)
  global.temp.openRouterHistory = {};

// Path for storing thread mode preferences
const threadModesPath = path.join(__dirname, '../../scripts/cmds/threadModes.json');

// Load thread modes from JSON file or initialize if doesn't exist
let threadModes = {};
try {
  if (fs.existsSync(threadModesPath)) {
    threadModes = JSON.parse(fs.readFileSync(threadModesPath, 'utf8'));
  } else {
    fs.writeFileSync(threadModesPath, JSON.stringify({}), 'utf8');
  }
} catch (error) {
  console.error("Error loading thread modes:", error.message);
  threadModes = {};
}

// Function to save thread modes to JSON file
function saveThreadModes() {
  try {
    fs.writeFileSync(threadModesPath, JSON.stringify(threadModes), 'utf8');
  } catch (error) {
    console.error("Error saving thread modes:", error.message);
  }
}

// Helper function to handle the API call and response for Gemini
async function handleAskGemini(api, event, prompt, message, commandName) {
  try {
    // Send initial "waiting" message and get its messageID
    const initialMsg = await message.reply("Answering your question. Please wait a moment...");
    
    const apiKey = "AIzaSyCJZCWeH-8rPxRcfyzPuFKoX2otEgB9nJA"; // Replace with your actual API key
    const model = "gemini-2.0-flash"; // It seems like the model was intended to be gemini-1.5-flash or similar
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Initialize history if it doesn't exist
    if (!global.temp.geminiHistory[event.senderID]) {
      global.temp.geminiHistory[event.senderID] = [];
    }

    // Add user message to history
    global.temp.geminiHistory[event.senderID].push({
      role: 'user',
      content: prompt
    });

    // Create request body including conversation history
    const conversationHistory = global.temp.geminiHistory[event.senderID].map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      contents: conversationHistory
    };

    const response = await axios.post(apiUrl, requestBody);

    if (response.status !== 200 || !response.data || !response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content || !response.data.candidates[0].content.parts || !response.data.candidates[0].content.parts[0]) {
      throw new Error('Invalid or missing response from API');
    }

    const messageText = response.data.candidates[0].content.parts[0].text.trim();
    
    // Add assistant response to history
    global.temp.geminiHistory[event.senderID].push({
      role: 'assistant',
      content: messageText
    });
    
    // Limit history size similar to gpt.js
    const maxStorageMessage = 4;
    if (global.temp.geminiHistory[event.senderID].length > maxStorageMessage * 2) {
      global.temp.geminiHistory[event.senderID] = global.temp.geminiHistory[event.senderID].slice(-maxStorageMessage * 2);
    }

    // Check if editMessage API is available
    if (api && typeof api.editMessage === 'function') {
      // Edit the initial message with the actual response using editMessage API
      api.editMessage(messageText, initialMsg.messageID);
      
      // Set up onReply for this message to continue the conversation
      global.GoatBot.onReply.set(initialMsg.messageID, {
        commandName,
        author: event.senderID,
        messageID: initialMsg.messageID
      });
    } else {
      // Fallback to regular reply if editMessage is not available
      message.reply(messageText, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          messageID: info.messageID
        });
      });
    }
    
    return;
  } catch (error) {
    console.error(`Failed to get answer: ${error.message}`);
    return message.reply(
      `${error.message}.\n\nYou can try typing your question again or resending it, as there might be a bug from the server that's causing the problem. It might resolve the issue.`
    );
  }
}

// Helper function to handle the API call and response for OpenRouter (bad mode)
async function handleAskOpenRouter(api, event, prompt, message, commandName) {
  try {
    // Send initial "waiting" message and get its messageID
    const initialMsg = await message.reply("Answering in bad mode. Please wait...");
    
    const apiKey = "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";
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    // Initialize history if it doesn't exist
    if (!global.temp.openRouterHistory[event.senderID]) {
      global.temp.openRouterHistory[event.senderID] = [];
    }

    // Add user message to history
    global.temp.openRouterHistory[event.senderID].push({
      role: 'user',
      content: prompt
    });

    // Create request body including conversation history
    const requestBody = {
      model: "gryphe/mythomax-l2-13b",
      messages: global.temp.openRouterHistory[event.senderID]
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      throw new Error('Invalid or missing response from OpenRouter API');
    }

    const messageText = response.data.choices[0].message.content.trim();
    
    // Add assistant response to history
    global.temp.openRouterHistory[event.senderID].push({
      role: 'assistant',
      content: messageText
    });
    
    // Limit history size
    const maxStorageMessage = 4;
    if (global.temp.openRouterHistory[event.senderID].length > maxStorageMessage * 2) {
      global.temp.openRouterHistory[event.senderID] = global.temp.openRouterHistory[event.senderID].slice(-maxStorageMessage * 2);
    }

    // Check if editMessage API is available
    if (api && typeof api.editMessage === 'function') {
      // Edit the initial message with the actual response using editMessage API
      api.editMessage(messageText, initialMsg.messageID);
      
      // Set up onReply for this message to continue the conversation
      global.GoatBot.onReply.set(initialMsg.messageID, {
        commandName,
        author: event.senderID,
        messageID: initialMsg.messageID,
        badMode: true
      });
    } else {
      // Fallback to regular reply if editMessage is not available
      message.reply(messageText, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          messageID: info.messageID,
          badMode: true
        });
      });
    }
    
    return;
  } catch (error) {
    console.error(`Failed to get answer from OpenRouter: ${error.message}`);
    return message.reply(
      `${error.message}.\n\nFailed to get response from bad mode. You can try again or switch back to good mode.`
    );
  }
}

// Main handler function that decides which API to use based on mode
async function handleAsk(api, event, prompt, message, commandName) {
  const threadID = event.threadID;
  
  // Check for mode toggle commands
  if (prompt.toLowerCase() === 'bad') {
    threadModes[threadID] = 'bad';
    saveThreadModes();
    return message.reply("Switched to bad mode using OpenRouter's mythomax-l2-13b model.");
  } else if (prompt.toLowerCase() === 'good') {
    threadModes[threadID] = 'good';
    saveThreadModes();
    return message.reply("Switched to good mode using Gemini model.");
  }
  
  // Use the appropriate handler based on the thread's mode
  const mode = threadModes[threadID] || 'good';
  if (mode === 'bad') {
    return handleAskOpenRouter(api, event, prompt, message, commandName);
  } else {
    return handleAskGemini(api, event, prompt, message, commandName);
  }
}

module.exports = {
  config: {
    name: 'gemini',
    version: '3.0', // incremented version
    author: 'JV Barcenas', // do not change
    role: 0,
    category: 'ai',
    shortDescription: {
      en: 'Asks an AI for an answer with good/bad mode.',
    },
    longDescription: {
      en: 'Asks an AI for an answer based on the user prompt. Can switch between good mode (Gemini) and bad mode (mythomax).',
    },
    guide: {
      en: '{pn} [prompt]\n{pn} clear - clears your conversation history with the AI\n{pn} ai good - switches to Gemini API\n{pn} ai bad - switches to mythomax API',
    },
  },
  onStart: async function ({ message, event, args, commandName }) {
    // Handle the clear command to reset conversation history
    if (args[0]?.toLowerCase() === 'clear') {
      global.temp.geminiHistory[event.senderID] = [];
      global.temp.openRouterHistory[event.senderID] = [];
      return message.reply("Your chat history has been deleted");
    }
    
    const prompt = args.join(' ');
    if (!prompt) {
      return message.reply("Please provide a question or message for the AI assistant.");
    }
    
    // Get the api parameter from global.GoatBot.api
    const api = global.GoatBot.api;
    return handleAsk(api, event, prompt, message, commandName);
  },
  onChat: async function ({ api, event, args, message, commandName }) {
    const senderID = event.senderID;
    try {
      const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));

      if (!prefix) {
        // If no prefix, it might be handled by onReply if it's a reply to this command
        return;
      }

      const prompt = event.body.substring(prefix.length).trim();

      if (prompt === '') {
        const userInfo = await api.getUserInfo(senderID);
        const senderName = userInfo[senderID]?.name || "Friend";
        const replyMessage = await message.reply(
          `Hi ${senderName}! This is your personal AI assistant. Please provide the question you would like me to answer by replying to this message.`
        );
        // Store context for onReply
        global.GoatBot.onReply.set(replyMessage.messageID, {
          commandName: module.exports.config.name, // Explicitly use config name
          author: senderID,
          messageID: replyMessage.messageID
        });
        return;
      }
      
      // Check for special commands
      if (prompt.toLowerCase() === 'clear') {
        global.temp.geminiHistory[senderID] = [];
        global.temp.openRouterHistory[senderID] = [];
        return message.reply("Your chat history has been deleted");
      }

      // If there's a prompt, handle the request with appropriate mode
      await handleAsk(api, event, prompt, message, module.exports.config.name);

    } catch (error) {
      console.error(`Error in onChat: ${error.message}`);
      api.sendMessage(
        `An unexpected error occurred in onChat: ${error.message}`,
        event.threadID
      );
    }
  },
  onReply: async function ({ api, event, Reply, message, commandName }) {
    const senderID = event.senderID;

    // Check if the reply is for this command and by the original author
    if (!Reply || Reply.author !== senderID || Reply.commandName !== commandName) {
      return;
    }

    const prompt = event.body.trim();

    if (prompt === '') {
      await message.reply("It looks like you replied without a question. Please provide the question you want me to answer.");
      return;
    }
    
    // Check if user wants to clear history
    if (prompt.toLowerCase() === 'clear') {
      global.temp.geminiHistory[senderID] = [];
      global.temp.openRouterHistory[senderID] = [];
      return message.reply("Your chat history has been deleted");
    }

    // Process the reply and continue conversation with the appropriate mode
    // If the reply was from a bad mode message, continue using bad mode
    if (Reply.badMode) {
      await handleAskOpenRouter(api, event, prompt, message, commandName);
    } else {
      // Check the thread mode and use the appropriate handler
      const mode = threadModes[event.threadID] || 'good';
      if (mode === 'bad') {
        await handleAskOpenRouter(api, event, prompt, message, commandName);
      } else {
        await handleAskGemini(api, event, prompt, message, commandName);
      }
    }
  }
};