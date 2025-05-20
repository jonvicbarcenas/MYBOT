const axios = require('axios');

module.exports = {
  config: {
    name: 'quote',
    version: '1.1',
    author: 'JV BARCENAS',
    countDown: 5,
    role: 0,
    description: {
      vi: 'Hiển thị một câu trích dẫn ngẫu nhiên',
      en: 'Display a random inspirational quote'
    },
    category: 'fun',
    guide: {
      vi: '{pn} [danh mục]',
      en: '{pn} [category]'
    }
  },

  langs: {
    vi: {
      error: '❌ Đã xảy ra lỗi: %1',
      loading: '⏳ Đang tìm một câu trích dẫn hay...',
      noQuotes: 'Không tìm thấy câu trích dẫn nào cho danh mục đã cho.'
    },
    en: {
      error: '❌ An error occurred: %1',
      loading: '⏳ Looking for an inspirational quote...',
      noQuotes: 'No quotes found for the given category.'
    }
  },

  onStart: async function ({ args, message, getLang }) {
    // Send loading message
    message.reply(getLang('loading'));
    
    const category = args.join(' ').toLowerCase();
    
    try {
      // Use a different API that doesn't have certificate issues
      let apiUrl = 'https://api.themotivate365.com/stoic-quote';
      
      // Get quote from API
      const response = await axios.get(apiUrl, {
        // Add timeout to prevent hanging if API is slow
        timeout: 10000,
        // Setup for handling HTTPS issues
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false // Note: This is not ideal for security, but helps bypass certificate issues
        })
      });
      
      // Check if quote was found
      if (!response.data || (!response.data.quote && !response.data.author)) {
        // Fallback to another API if the first one fails
        const fallbackResponse = await axios.get('https://zenquotes.io/api/random', { 
          timeout: 7000,
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        });
        
        if (!fallbackResponse.data || !fallbackResponse.data[0]) {
          return message.reply(getLang('noQuotes'));
        }
        
        // Format the quote from fallback API
        const quoteText = `"${fallbackResponse.data[0].q}"\n\n- ${fallbackResponse.data[0].a}`;
        return message.reply(quoteText);
      }
      
      // Format the quote from primary API
      const quoteText = `"${response.data.quote}"\n\n- ${response.data.author}`;
      
      // Send the quote
      return message.reply(quoteText);
      
    } catch (err) {
      console.error("Quote API error:", err.message);
      
      // Try a final fallback to a very reliable API
      try {
        const lastFallbackResponse = await axios.get('https://api.quotable.io/random', {
          timeout: 10000,
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        });
        
        if (lastFallbackResponse.data && lastFallbackResponse.data.content) {
          const quoteText = `"${lastFallbackResponse.data.content}"\n\n- ${lastFallbackResponse.data.author}`;
          return message.reply(quoteText);
        }
      } catch (fallbackErr) {
        console.error("All quote APIs failed:", fallbackErr.message);
      }
      
      return message.reply(getLang('error', err.message));
    }
  }
};
