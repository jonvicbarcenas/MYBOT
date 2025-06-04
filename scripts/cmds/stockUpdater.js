const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "stockUpdater",
    aliases: ["su", "stockupdate", "gag", "gagupdater", "gagstock", "gagnotifier"],
    version: "1.2",
    author: "JV Barcenas",
    category: "owner",
    description: "Manage stock update notifications",
    usage: "[enable/disable/add] [threadID]",
    cooldowns: 5
  },
  lastSentTime: null,
  onStart: async function ({ api, event, args, message, Users }) {
    const configPath = path.join(__dirname, '../../configCommands.json');
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Initialize stockUpdater config if it doesn't exist
    if (!config.envCommands.stockUpdater) {
      config.envCommands.stockUpdater = { enabledThreads: [] };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }
    
    // Check if user is admin
    const isAdmin = global.GoatBot.config.adminBot.includes(event.senderID);
    
    if (!isAdmin) {
      return message.reply("⚠️ You don't have permission to use this command. Only bot admins can use this command.");
    }
    
    const command = args[0]?.toLowerCase();
    const threadID = args[1];
    
    if (!command) {
      // Show current enabled threads
      const enabledThreads = config.envCommands.stockUpdater.enabledThreads || [];
      return message.reply(`📊 Stock updates are currently enabled for ${enabledThreads.length} threads.`);
    }
    
    if (["enable", "disable", "add"].includes(command) && !threadID) {
      return message.reply("⚠️ Please provide a thread ID.");
    }
    
    let enabledThreads = config.envCommands.stockUpdater.enabledThreads || [];
    
    switch (command) {
      case "enable":
        if (enabledThreads.includes(threadID)) {
          return message.reply("⚠️ This thread is already enabled for stock updates.");
        }
        enabledThreads.push(threadID);
        config.envCommands.stockUpdater.enabledThreads = enabledThreads;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return message.reply("✅ Thread has been enabled for stock updates.");
        
      case "disable":
        if (!enabledThreads.includes(threadID)) {
          return message.reply("⚠️ This thread is not enabled for stock updates.");
        }
        enabledThreads = enabledThreads.filter(id => id !== threadID);
        config.envCommands.stockUpdater.enabledThreads = enabledThreads;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return message.reply("✅ Thread has been disabled for stock updates.");
        
      case "add":
        if (enabledThreads.includes(threadID)) {
          return message.reply("⚠️ This thread is already enabled for stock updates.");
        }
        enabledThreads.push(threadID);
        config.envCommands.stockUpdater.enabledThreads = enabledThreads;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return message.reply("✅ Thread has been added to stock updates.");
        
      default:
        return message.reply("⚠️ Invalid command. Use 'enable', 'disable', or 'add'.");
    }
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
        const response = await axios.get('http://54.255.178.90:3000/api');
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
        const hasChanged = JSON.stringify(previousData.stocks) !== JSON.stringify(currentData.stocks) ||
                           JSON.stringify(previousData.eggs) !== JSON.stringify(currentData.eggs) ||
                           JSON.stringify(previousData.honeyStocks) !== JSON.stringify(currentData.honeyStocks);
        
        if (hasChanged || !Object.keys(previousData).length) {
          // Format message
          let message = `🌱 STOCK UPDATE 🌱\n`;
          
          // Add timestamp in Philippine time
          const phTime = currentData.last_updated.stocks.ph || moment().tz('Asia/Manila').format('YYYY-MM-DD hh:mm:ss A');
          message += `As of ${phTime}\n\n`;
          
          // Check for Master Sprinkler
          let hasMasterSprinkler = false;
          if (currentData.stocks && currentData.stocks["GEAR STOCK"]) {
            hasMasterSprinkler = currentData.stocks["GEAR STOCK"].some(item => 
              item.name === "Master Sprinkler" && item.quantity > 0
            );
          }
          
          // Add gear section
          message += `📦 GEAR:\n`;
          if (currentData.stocks && currentData.stocks["GEAR STOCK"]) {
            currentData.stocks["GEAR STOCK"].forEach(item => {
              message += `${item.name}: ${item.quantity}\n`;
            });
          }
          
          // Add seeds section
          message += `\n🌰 SEEDS:\n`;
          if (currentData.stocks && currentData.stocks["SEEDS STOCK"]) {
            currentData.stocks["SEEDS STOCK"].forEach(item => {
              message += `${item.name}: ${item.quantity}\n`;
            });
          }
          
          // Add eggs section
          message += `\n🥚 EGGS:\n`;
          if (currentData.eggs && currentData.eggs["EGG STOCK"]) {
            currentData.eggs["EGG STOCK"].forEach(item => {
              message += `${item.name}: ${item.quantity}\n`;
            });
          }
          
          // Add honey section
          message += `\n🍯 HONEY EVENT:\n`;
          if (currentData.honeyStocks && currentData.honeyStocks["HONEY STOCK"]) {
            currentData.honeyStocks["HONEY STOCK"].forEach(item => {
              message += `${item.name}: ${item.quantity}\n`;
            });
          }
          
          // Read enabled threads from config
          const configPath = path.join(__dirname, '../../configCommands.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          const enabledThreads = config.envCommands.stockUpdater?.enabledThreads || [];
          
          // Send message to enabled threads
          for (const threadID of enabledThreads) {
            if (hasMasterSprinkler) {
              // If Master Sprinkler is in stock, tag all members
              try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;
                const mentions = [];
                
                // Add alert message for Master Sprinkler
                let alertMessage = message + "\n⚠️ MASTER SPRINKLER ALERT! ⚠️\n";
                let tagBody = "@all";
                
                // Create mentions array for tagging all members
                for (let i = 0; i < participantIDs.length; i++) {
                  mentions.push({
                    tag: "@all",
                    id: participantIDs[i],
                    fromIndex: i === 0 ? alertMessage.length : alertMessage.length + i - 1
                  });
                  
                  if (i > 0) {
                    alertMessage += " ";
                  }
                }
                
                // Send message with mentions
                api.sendMessage({
                  body: alertMessage + tagBody,
                  mentions
                }, threadID);
              } catch (err) {
                console.error(`Error tagging all in thread ${threadID}:`, err);
                // Fallback to normal message if tagging fails
                api.sendMessage(message, threadID);
              }
            } else {
              // Normal message without tagging
              api.sendMessage(message, threadID);
            }
          }
          console.log('Stock update messages sent successfully!');
          
          // Update last sent time
          this.lastSentTime = new Date().toISOString();
        } else {
          console.log('No changes in stock data, message not sent.');
        }
      } catch (error) {
        console.error('Error checking for stock updates:', error);
      }
    };

    // Run the update check every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    // Perform an initial update check immediately
    await checkForUpdates();
  }
}; 