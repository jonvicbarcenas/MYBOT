module.exports = {
  config: {
    name: "spy",
    aliases: [],
    version: 1.1,
    author: "JV",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Spy on thread messages" },
    longDescription: { en: "Monitor messages from a specific thread" },
    category: "Testings",
    guide: { en: "{pn} [threadID] - to start monitoring a thread\n{pn} stop - to stop monitoring" }
  },
  
  // Store active spy sessions
  activeSpySessions: new Map(),
  
  onStart: async function({ api, args, message, event, threadsData, usersData, dashBoardData }) {
    const userData = await usersData.get(event.senderID);
    const userName = userData ? userData.name : "Unknown User";
    const userID = event.senderID;
    
    // Handle stop command
    if (args[0] === "stop") {
      if (this.activeSpySessions.has(userID)) {
        this.activeSpySessions.delete(userID);
        return message.reply("🕵️ Spy session stopped. No longer monitoring any thread.");
      } else {
        return message.reply("You don't have any active spy sessions.");
      }
    }
    
    // Check if threadID is provided
    if (!args[0]) {
      return message.reply("Please provide a thread ID to spy on, or 'stop' to end monitoring.");
    }
    
    const targetThreadID = args[0];
    
    try {
      // Store the spy session
      this.activeSpySessions.set(userID, {
        targetThreadID,
        userThreadID: event.threadID
      });
      
      message.reply(`🕵️ Started monitoring thread: ${targetThreadID}\nUse "/spy stop" to end monitoring.`);
    } catch (error) {
      message.reply(`Error starting spy session: ${error.message}`);
    }
  },

  onChat: async function({ api, args, message, event, threadsData, usersData, dashBoardData }) {
    // Check if this is a command starting with '/'
    if (event.body.startsWith('/')) return;
    
    // For each active spy session, check if this message is from a monitored thread
    for (const [userID, session] of this.activeSpySessions.entries()) {
      if (event.threadID === session.targetThreadID) {
        const userData = await usersData.get(event.senderID);
        const senderName = userData ? userData.name : "Unknown User";
        
        // Forward the message to the spy's thread
        api.sendMessage(
          `🕵️ Spy Report:\n\nFrom: ${senderName}\nContent: ${event.body}\nSenderID: ${event.senderID}`, 
          session.userThreadID
        );
      }
    }
  }
};