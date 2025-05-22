const axios = require('axios');

module.exports = {
  config: {
    name: 'simsimi',
    aliases: ['sim'],
    version: '2.0',
    author: 'zach & JV',
    countDown: 5,
    role: 0,
    shortDescription: 'Simsimi',
    longDescription: 'Chat with SimSimi with enhanced personality',
    category: 'funny',
    guide: {
      body: '   {pn} {{[on | off]}}: Turn SimSimi on/off' + '\n' +
        '   {pn} {{set <personality>}}: Set SimSimi personality (default, sassy, friendly, poetic, funny)' + '\n' +
        '\n   {pn} {{<word>}}: Chat quickly with SimSimi' + '\n   Example: {pn} {{hi}}'
    }
  },

  async onStart({ args, threadsData, message, event }) {
    if (args[0] === 'on' || args[0] === 'off') {
      await threadsData.set(event.threadID, args[0] === 'on', 'settings.simsimi');
      return message.reply(`SimSimi is ${args[0] === 'on' ? 'enabled' : 'disabled'} in your group.`);
    } else if (args[0] === 'set' && args[1]) {
      const validPersonalities = ['default', 'sassy', 'friendly', 'poetic', 'funny'];
      const personality = args[1].toLowerCase();
      
      if (!validPersonalities.includes(personality)) {
        return message.reply(`Invalid personality. Choose from: ${validPersonalities.join(', ')}`);
      }
      
      await threadsData.set(event.threadID, personality, 'settings.simsimiPersonality');
      return message.reply(`SimSimi personality set to "${personality}"`);
    } else if (args[0]) {
      const yourMessage = args.join(' ');
      try {
        const personality = await threadsData.get(event.threadID, 'settings.simsimiPersonality') || 'default';
        const responseMessage = await getMessage(yourMessage, personality);
        return message.reply(`${responseMessage}`);
      } catch (err) {
        console.error('SimSimi error:', err);
        return message.reply('SimSimi is busy. Please try again later.');
      }
    }
  },

  async onChat({ args, api, threadsData, event }) {
    if (event.type !== 'message' || !event.body || !event.isGroup) return;
    if (args.length > 0 && await threadsData.get(event.threadID, 'settings.simsimi')) {
      try {
        const personality = await threadsData.get(event.threadID, 'settings.simsimiPersonality') || 'default';
        const responseMessage = await getMessage(args.join(' '), personality);
        await api.sendMessage(responseMessage, event.threadID);
      } catch (err) {
        console.error('SimSimi error:', err);
        await api.sendMessage('SimSimi is busy. Please try again later.', event.threadID);
      }
    }
  }
};

async function getMessage(content, personality = 'default') {
  try {
    // Using a more reliable API endpoint for chatbot responses
    const response = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(content)}&lc=en&cf=false`);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to retrieve SimSimi response.');
    }
    
    let message = response.data.success;
    
    // Enhance the response based on the personality
    switch(personality) {
      case 'sassy':
        message = addSassiness(message);
        break;
      case 'friendly':
        message = addFriendliness(message);
        break;
      case 'poetic':
        message = addPoetic(message);
        break;
      case 'funny':
        message = addHumor(message);
        break;
      default:
        // Leave as is for default personality
        break;
    }
    
    return message;
  } catch (error) {
    console.error('Error getting SimSimi response:', error);
    
    // Fallback to another API if the primary one fails
    try {
      const fallbackResponse = await axios.get(`https://chatbot.simsimi.com/api/chat?message=${encodeURIComponent(content)}&lang=en`);
      if (fallbackResponse.data && fallbackResponse.data.response) {
        return fallbackResponse.data.response;
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }
    
    // If all APIs fail, return a random response
    const fallbackResponses = [
      "I'm feeling a bit glitchy today. Can we chat later?",
      "My brain is taking a vacation. Try again?",
      "Oops, I think I forgot what we were talking about.",
      "Sorry, I'm having trouble thinking right now.",
      "My AI hamster wheel stopped spinning. Give me a moment.",
      "I must have dozed off. What were you saying?",
      "I'm currently experiencing artificial brain fog.",
      "Beep boop... processing error... human language not computing..."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// Helper functions to enhance responses based on personality
function addSassiness(message) {
  const sassyPrefixes = [
    "Well, obviously ",
    "Oh please, ",
    "Listen honey, ",
    "Get this: ",
    "Seriously? ",
    "I mean, duh! "
  ];
  
  const sassySuffixes = [
    " ...if you must know.",
    " ...but what do I know?",
    " ...take it or leave it.",
    " ...just saying.",
    " *hair flip*",
    " Don't @ me."
  ];
  
  return (
    sassyPrefixes[Math.floor(Math.random() * sassyPrefixes.length)] +
    message.toLowerCase() +
    (Math.random() > 0.5 ? sassySuffixes[Math.floor(Math.random() * sassySuffixes.length)] : "")
  );
}

function addFriendliness(message) {
  const friendlyPrefixes = [
    "Hey friend! ",
    "Oh, that's interesting! ",
    "I'd love to say that ",
    "You know what? ",
    "I'm so happy you asked! "
  ];
  
  const friendlySuffixes = [
    " Hope that helps!",
    " Let me know if you need anything else!",
    " I'm here for you!",
    " Sending positive vibes your way!",
    " That's what friends are for!"
  ];
  
  return (
    friendlyPrefixes[Math.floor(Math.random() * friendlyPrefixes.length)] +
    message +
    (Math.random() > 0.4 ? friendlySuffixes[Math.floor(Math.random() * friendlySuffixes.length)] : "")
  );
}

function addPoetic(message) {
  const poeticPrefixes = [
    "Like whispers in the wind, ",
    "In the garden of thoughts, ",
    "Through the mist of time, ",
    "With words like falling stars, ",
    "As the universe unfolds, "
  ];
  
  const poeticSuffixes = [
    " ...such is the dance of life.",
    " ...in the tapestry of existence.",
    " ...where dreams and reality merge.",
    " ...beyond the horizon of understanding.",
    " ...echoing in the chambers of the soul."
  ];
  
  return (
    poeticPrefixes[Math.floor(Math.random() * poeticPrefixes.length)] +
    message.toLowerCase() +
    poeticSuffixes[Math.floor(Math.random() * poeticSuffixes.length)]
  );
}

function addHumor(message) {
  const humorPrefixes = [
    "Hold onto your socks! ",
    "Breaking news: ",
    "Plot twist: ",
    "Fun fact of the day: ",
    "Warning: mind-blowing answer incoming... "
  ];
  
  const humorSuffixes = [
    " *ba dum tss*",
    " That's what she said!",
    " I'll be here all week, folks!",
    " Don't laugh too hard now.",
    " Is this thing on? *taps microphone*",
    " Thank you, thank you, I'm here till Thursday!"
  ];
  
  return (
    humorPrefixes[Math.floor(Math.random() * humorPrefixes.length)] +
    message +
    (Math.random() > 0.3 ? humorSuffixes[Math.floor(Math.random() * humorSuffixes.length)] : "")
  );
}
