const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "stockUpdater",
    version: "1.0",
    author: "JV Barcenas",
    category: "owner",
  },
  lastSentTime: null,
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically update stock information`,
      event.threadID,
      event.messageID
    );
  },
  onLoad: async function({
    api,
    event,
    message,
    getLang,
    args,
  }) {
    const checkForUpdates = async () => {
      try {
        // Fetch data from the API
        const response = await axios.get('http://app.hungrycracken.com:3010/api');
        const currentData = response.data;
        
        // Path to the data storage file
        const filePath = path.join(__dirname, 'stockData.json');
        
        // Check if file exists, if not create it with empty data
        let previousData = {};
        if (fs.existsSync(filePath)) {
          previousData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        // Save current data to file
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');
        
        // Check if data has changed
        const hasChanged = JSON.stringify(previousData.stock) !== JSON.stringify(currentData.stock);
        
        if (hasChanged || !Object.keys(previousData).length) {
          // Format message
          const stock = currentData.stock;
          let message = `🌱 STOCK UPDATE 🌱\n`;
          
          // Add timestamp in Philippine time
          const phTime = moment().tz('Asia/Manila').format('MMMM D, YYYY h:mm:ss A');
          message += `As of ${phTime}\n\n`;
          
          // Add gear section
          message += `📦 GEAR:\n`;
          stock.gear.forEach(item => {
            message += `${item.emoji} ${item.name}: ${item.quantity}\n`;
          });
          
          // Add seeds section
          message += `\n🌰 SEEDS:\n`;
          stock.seeds.forEach(item => {
            message += `${item.emoji} ${item.name}: ${item.quantity}\n`;
          });
          
          // Add eggs section
          message += `\n🥚 EGGS:\n`;
          stock.eggs.forEach(item => {
            message += `${item.emoji} ${item.name}: ${item.quantity}\n`;
          });
          
          // Add weather information
          message += `\n☁️ WEATHER:\n`;
          message += `${stock.weather.icon} ${stock.weather.status}\n`;
          message += `${stock.weather.description}\n`;
          message += `${stock.weather.lastUpdated}`;
          
          // Send message to multiple threads
          const threadIDs = ['28123655423916989', '23871909845786935', '6430224813769264'];
          for (const threadID of threadIDs) {
            api.sendMessage(message, threadID);
          }
          console.log('Stock update messages sent successfully!');
          
          // Update last sent time
          this.lastSentTime = new Date().toISOString();
        } else {
        //   console.log('No changes in stock data, message not sent.');
        }
      } catch (error) {
        // console.error('Error checking for stock updates:', error);
      }
    };

    // Run the update check every 30 seconds
    const interval = setInterval(checkForUpdates, 1000);

    // Perform an initial update check immediately
    await checkForUpdates();
  }
}; 