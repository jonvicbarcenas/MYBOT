const fs = require("fs-extra");
const path = require("path");

// Path to monitor data file
const monitorDataPath = path.join(__dirname, "cache", "monitorData.json");

module.exports = {
  config: {
    name: "monitorhook",
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 0,
    description: {
      vi: "Hook để hệ thống giám sát hoạt động",
      en: "Hook for monitoring system to work"
    },
    category: "hidden",
    guide: {
      en: ""
    }
  },

  onLoad: function() {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }
    
    // Create monitor data file if it doesn't exist
    if (!fs.existsSync(monitorDataPath)) {
      fs.writeFileSync(monitorDataPath, JSON.stringify({
        activeGroups: {},
        activeUsers: {},
        commandUsage: {},
        botStats: {
          startTime: Date.now(),
          totalCommands: 0,
          totalMessages: 0
        },
        reports: []
      }, null, 2));
    }
    
    // Add eventRegister to global.client if it doesn't exist
    if (!global.client.eventRegister) {
      global.client.eventRegister = function (eventName, callback) {
        if (!global.client.events) global.client.events = {};
        if (!global.client.events[eventName]) global.client.events[eventName] = [];
        global.client.events[eventName].push(callback);
        return callback;
      };
    }
    
    // Add event handler to global.client if it doesn't exist
    if (!global.client.eventHandler) {
      global.client.eventHandler = function (eventName, data) {
        if (!global.client.events || !global.client.events[eventName]) return;
        for (const callback of global.client.events[eventName]) {
          try {
            callback(data);
          } catch (err) {
            console.error(`Error in event ${eventName}:`, err);
          }
        }
      };
    }
    
    // Hook into the original handleEvent function if it exists
    if (!global.client._originalHandleEvent && global.client.handleEvent) {
      global.client._originalHandleEvent = global.client.handleEvent;
      global.client.handleEvent = function(event) {
        // Call original handler
        const result = global.client._originalHandleEvent(event);
        
        // Trigger our custom events
        if (event.type === "message" || event.type === "message_reply") {
          global.client.eventHandler("message", { event });
          
          // Update monitoring data
          try {
            const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
            
            // Update bot stats
            monitorData.botStats.totalMessages++;
            
            // Update active groups
            if (!monitorData.activeGroups[event.threadID]) {
              monitorData.activeGroups[event.threadID] = {
                name: "",
                messageCount: 0,
                lastActive: Date.now()
              };
            }
            monitorData.activeGroups[event.threadID].messageCount++;
            monitorData.activeGroups[event.threadID].lastActive = Date.now();
            
            // Update active users
            if (!monitorData.activeUsers[event.senderID]) {
              monitorData.activeUsers[event.senderID] = {
                name: "",
                messageCount: 0,
                lastActive: Date.now()
              };
            }
            monitorData.activeUsers[event.senderID].messageCount++;
            monitorData.activeUsers[event.senderID].lastActive = Date.now();
            
            fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
          } catch (error) {
            console.error("Monitor error:", error);
          }
        }
        
        return result;
      };
    }
  },

  onStart: async function ({ event, commandName }) {
    // This is a hidden command, so it doesn't do anything when called directly
    
    // But we'll still update the command usage statistics
    try {
      const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
      
      // Update bot stats
      monitorData.botStats.totalCommands++;
      
      // Update command usage
      if (!monitorData.commandUsage[commandName]) {
        monitorData.commandUsage[commandName] = {
          count: 0,
          lastUsed: Date.now()
        };
      }
      monitorData.commandUsage[commandName].count++;
      monitorData.commandUsage[commandName].lastUsed = Date.now();
      
      fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
    } catch (error) {
      console.error("Monitor command error:", error);
    }
    
    return;
  },
  
  // Hook into every command execution
  onChat: async function ({ event, commandName }) {
    // Update command usage statistics
    if (commandName) {
      try {
        const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
        
        // Update bot stats
        monitorData.botStats.totalCommands++;
        
        // Update command usage
        if (!monitorData.commandUsage[commandName]) {
          monitorData.commandUsage[commandName] = {
            count: 0,
            lastUsed: Date.now()
          };
        }
        monitorData.commandUsage[commandName].count++;
        monitorData.commandUsage[commandName].lastUsed = Date.now();
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
      } catch (error) {
        console.error("Monitor command error:", error);
      }
    }
    
    return;
  }
}; 