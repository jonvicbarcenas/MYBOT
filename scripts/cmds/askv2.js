const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getStreamsFromAttachment } = global.utils;

const Prefixes = [
  'gpt',
  '/gpt',
  'ai',
  '!ai',
  '@Meta',
  'dain',
  'bot',
  '/bot'
];

// Define media types that can be handled
const mediaTypes = ["photo", "png", "animated_image"];

// Storage for conversation history
if (!global.temp.geminiHistory) 
  global.temp.geminiHistory = {};

// Path for cache folder to store temporary images
const cacheFolderPath = path.join(__dirname, '../../cache/gemini');

// Ensure cache folder exists
if (!fs.existsSync(cacheFolderPath)) {
  try {
    fs.mkdirSync(cacheFolderPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating cache folder: ${error.message}`);
  }
}

// Function to check if a thread is banned
async function isThreadBanned(threadID) {
  try {
    // Get thread data from the global database
    const threadData = await global.db.threadsData.get(threadID);
    // Check if the thread exists and is banned
    return threadData && threadData.banned && threadData.banned.status === true;
  } catch (error) {
    console.error(`Error checking thread ban status: ${error.message}`);
    return false;
  }
}

// Function to check if a user is banned (globally or in thread)
async function isUserBanned(userID, threadID) {
  try {
    // Check if user is globally banned (from user.js)
    const userData = await global.db.usersData.get(userID);
    if (userData && userData.banned && userData.banned.status === true) {
      return true;
    }
    
    // Check if user is banned in this thread (from ban.js)
    const threadData = await global.db.threadsData.get(threadID);
    const threadBannedUsers = threadData?.data?.banned_ban || [];
    if (threadBannedUsers.some(user => user.id == userID)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking user ban status: ${error.message}`);
    return false;
  }
}

// Function to download image from URL
async function downloadImage(url, filePath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));
    return true;
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
    return false;
  }
}

// Function to process images for Gemini
async function processImagesForGemini(attachments) {
  try {
    if (!attachments || attachments.length === 0) {
      return [];
    }
    
    // Filter only image attachments
    const imageAttachments = attachments.filter(item => mediaTypes.includes(item.type));
    if (imageAttachments.length === 0) {
      return [];
    }
    
    // Process each image by downloading from URL when available
    const imageParts = [];
    
    for (const attachment of imageAttachments) {
      try {
        // Check if attachment has URL (from Facebook message)
        if (attachment.url) {
          // Generate unique filename for the cached image
          const uniqueFileName = `gemini_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.jpg`;
          const cachePath = path.join(cacheFolderPath, uniqueFileName);
          
          // Download the image
          const success = await downloadImage(attachment.url, cachePath);
          if (!success) continue;
          
          // Read the downloaded image and convert to base64
          const imageBuffer = fs.readFileSync(cachePath);
          const base64Image = imageBuffer.toString('base64');
          
          // Determine MIME type based on attachment data or extension
          let mimeType = "image/jpeg";
          if (attachment.filename && attachment.filename.toLowerCase().endsWith('.png')) {
            mimeType = "image/png";
          } else if (attachment.filename && attachment.filename.toLowerCase().endsWith('.gif')) {
            mimeType = "image/gif";
          }
          
          // Add image part in the format expected by Gemini API
          imageParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          });
        }
      } catch (error) {
        console.error(`Error processing individual image: ${error.message}`);
        // Continue with other images if one fails
      }
    }
    
    // If direct URL method failed, try getStreamsFromAttachment as fallback
    if (imageParts.length === 0) {
      try {
        const streams = await getStreamsFromAttachment(imageAttachments);
        
        if (streams && streams.length > 0) {
          for (const stream of streams) {
            if (stream && stream.path && fs.existsSync(stream.path)) {
              // Generate unique filename for the cached image
              const uniqueFileName = `gemini_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.jpg`;
              const cachePath = path.join(cacheFolderPath, uniqueFileName);
              
              // Read image data and save to cache
              const imageBuffer = fs.readFileSync(stream.path);
              fs.writeFileSync(cachePath, imageBuffer);
              
              // Convert to base64
              const base64Image = imageBuffer.toString('base64');
              
              // Determine MIME type based on file extension
              let mimeType = "image/jpeg"; // Default
              if (stream.path.toLowerCase().endsWith('.png')) {
                mimeType = "image/png";
              } else if (stream.path.toLowerCase().endsWith('.gif')) {
                mimeType = "image/gif";
              }
              
              // Add image part for Gemini API
              imageParts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              });
            }
          }
        }
      } catch (fallbackError) {
        console.error(`Fallback method failed: ${fallbackError.message}`);
      }
    }
    
    return imageParts;
  } catch (error) {
    console.error(`Error processing images for Gemini: ${error.message}`);
    return [];
  }
}

// Helper function to handle the API call and response for Gemini
async function handleAskGemini(api, event, prompt, message, commandName) {
  try {
    // Check if user is banned (from user.js or ban.js)
    const isUserBannedStatus = await isUserBanned(event.senderID, event.threadID);
    if (isUserBannedStatus) {
      return;
    }
    
    // Send initial "waiting" message and get its messageID
    const initialMsg = await message.reply("Answering your question. Please wait a moment...");
    
    const apiKey = "AIzaSyCJZCWeH-8rPxRcfyzPuFKoX2otEgB9nJA"; // Replace with your actual API key
    const model = "gemini-2.0-flash"; // Using gemini-2.0-flash model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Initialize history if it doesn't exist
    if (!global.temp.geminiHistory[event.senderID]) {
      global.temp.geminiHistory[event.senderID] = [];
    }
    
    // Process any attached images or reply attachments
    const attachments = [...(event.attachments || []), ...(event.messageReply?.attachments || [])];
    const imageParts = await processImagesForGemini(attachments);
    
    // Check if this is the first interaction with this user
    const isFirstInteraction = global.temp.geminiHistory[event.senderID].length === 0;
    
    // If it's the first interaction, get the user's name and include it in the prompt
    let enhancedPrompt = prompt;
    if (isFirstInteraction) {
      try {
        const userInfo = await api.getUserInfo(event.senderID);
        const userName = userInfo[event.senderID]?.name || "User";
        enhancedPrompt = `I am ${userName}. ${prompt}`;
      } catch (error) {
        console.error(`Error getting user info: ${error.message}`);
      }
    }
    
    // Create parts array for the request, starting with text
    const parts = [
      { text: enhancedPrompt }
    ];
    
    // Add image parts if any
    parts.push(...imageParts);
    
    // Add user message to history (text only for history)
    global.temp.geminiHistory[event.senderID].push({
      role: 'user',
      content: enhancedPrompt + (imageParts.length > 0 ? " [Image attached]" : "")
    });
    
    // Create request body with current message including images if any
    let requestBody;
    
    if (imageParts.length > 0) {
      // For messages with images, we can't use history because multimodal input can only be in the current message
      requestBody = {
        contents: [{
          role: "user",
          parts: parts
        }]
      };
    } else {
      // For text-only messages, use the conversation history
      const conversationHistory = global.temp.geminiHistory[event.senderID].map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      requestBody = {
        contents: conversationHistory
      };
    }

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
    
    // Limit history size
    const maxStorageMessage = 4;
    if (global.temp.geminiHistory[event.senderID].length > maxStorageMessage * 2) {
      global.temp.geminiHistory[event.senderID] = global.temp.geminiHistory[event.senderID].slice(-maxStorageMessage * 2);
    }
    
    // Clean up temporary files
    try {
      // Delete files older than 1 hour
      const oneHourAgo = Date.now() - 3600000;
      const files = fs.readdirSync(cacheFolderPath);
      
      for (const file of files) {
        const filePath = path.join(cacheFolderPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up temporary files: ${error.message}`);
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

module.exports = {
  config: {
    name: 'gemini',
    version: '5.0', // incremented version
    author: 'JV Barcenas', // do not change
    role: 0,
    category: 'ai',
    shortDescription: {
      en: 'Asks an AI for an answer using Gemini, supports images.',
    },
    longDescription: {
      en: 'Asks an AI for an answer based on the user prompt using Gemini API. Supports image attachments for visual questions.',
    },
    guide: {
      en: '{pn} [prompt] - ask a text question\n{pn} [prompt] + [image attachment] - ask about an image\n{pn} clear - clears your conversation history with the AI',
    },
  },
  onStart: async function ({ message, event, args, commandName }) {
    // Check if thread is banned
    const banned = await isThreadBanned(event.threadID);
    if (banned) {
      return message.reply("This thread is banned from using the bot. AI features are not available.");
    }
    
    // Check if user is banned (from user.js or ban.js)
    const isUserBannedStatus = await isUserBanned(event.senderID, event.threadID);
    if (isUserBannedStatus) {
      return;
    }
    
    // Handle the clear command to reset conversation history
    if (args[0]?.toLowerCase() === 'clear') {
      global.temp.geminiHistory[event.senderID] = [];
      return message.reply("Your chat history has been deleted");
    }
    
    const prompt = args.join(' ');
    if (!prompt && (!event.attachments || event.attachments.length === 0)) {
      return message.reply("Please provide a question/message or attach an image for the AI assistant.");
    }
    
    // Use empty prompt with image if no text but image is attached
    const finalPrompt = prompt || "Describe this image in detail.";
    
    // Get the api parameter from global.GoatBot.api
    const api = global.GoatBot.api;
    return handleAskGemini(api, event, finalPrompt, message, commandName);
  },
  onChat: async function ({ api, event, args, message, commandName }) {
    const senderID = event.senderID;
    try {
      const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));

      if (!prefix) {
        // If no prefix, it might be handled by onReply if it's a reply to this command
        return;
      }

      // Check if thread is banned
      const banned = await isThreadBanned(event.threadID);
      if (banned) {
        return; // Silently ignore AI commands in banned threads
      }
      
      // Check if user is banned (from user.js or ban.js)
      const isUserBannedStatus = await isUserBanned(senderID, event.threadID);
      if (isUserBannedStatus) {
        return message.reply("Sorry, you are banned from using the bot. AI features are not available for you.");
      }

      const prompt = event.body.substring(prefix.length).trim();

      if (prompt === '' && (!event.attachments || event.attachments.length === 0)) {
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
        return message.reply("Your chat history has been deleted");
      }

      // Use empty prompt with image if no text but image is attached
      const finalPrompt = prompt || "Describe this image in detail.";
      
      // If there's a prompt, handle the request
      await handleAskGemini(api, event, finalPrompt, message, module.exports.config.name);

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

    // Check if thread is banned
    const banned = await isThreadBanned(event.threadID);
    if (banned) {
      return message.reply("This thread is banned from using the bot. AI features are not available.");
    }
    
    // Check if user is banned (from user.js or ban.js)
    const isUserBannedStatus = await isUserBanned(senderID, event.threadID);
    if (isUserBannedStatus) {
      return message.reply("Sorry, you are banned from using the bot. AI features are not available for you.");
    }

    const prompt = event.body.trim();

    if (prompt === '' && (!event.attachments || event.attachments.length === 0)) {
      await message.reply("It looks like you replied without a question or image. Please provide a question or attach an image.");
      return;
    }
    
    // Check if user wants to clear history
    if (prompt.toLowerCase() === 'clear') {
      global.temp.geminiHistory[senderID] = [];
      return message.reply("Your chat history has been deleted");
    }

    // Use empty prompt with image if no text but image is attached
    const finalPrompt = prompt || "Describe this image in detail.";
    
    // Process the reply and continue conversation
    await handleAskGemini(api, event, finalPrompt, message, commandName);
  }
};