const { getTime } = global.utils;
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

// Create monitor data file if it doesn't exist
const monitorDataPath = path.join(__dirname, "cache", "monitorData.json");
if (!fs.existsSync(path.join(__dirname, "cache"))) {
  fs.mkdirSync(path.join(__dirname, "cache"));
}
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

module.exports = {
  config: {
    name: "monitor",
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 2, // Admin only
    description: {
      vi: "Công cụ giám sát cho quản trị viên",
      en: "Monitoring tool for administrators"
    },
    category: "admin",
    guide: {
      en: "   {pn} stats: Show general bot statistics\n" +
          "   {pn} groups: Show most active groups\n" +
          "   {pn} users: Show most active users\n" +
          "   {pn} commands: Show most used commands\n" +
          "   {pn} track <threadID>: Start tracking specific group activities\n" +
          "   {pn} untrack <threadID>: Stop tracking specific group\n" +
          "   {pn} report <threadID> <message>: Add report about a group\n" +
          "   {pn} reports [threadID]: View reports (all or for specific group)\n" +
          "   {pn} clear: Clear monitoring data"
    }
  },

  langs: {
    vi: {
      noPermission: "Bạn không có quyền sử dụng tính năng này",
      statsHeader: "📊 Thống kê Bot\n",
      uptime: "⏱️ Thời gian hoạt động: %1\n",
      totalGroups: "👥 Tổng số nhóm: %1\n",
      totalUsers: "👤 Tổng số người dùng: %1\n",
      totalCommands: "🤖 Tổng lệnh đã xử lý: %1\n",
      totalMessages: "💬 Tổng tin nhắn đã xử lý: %1\n",
      activeGroups: "📊 Nhóm hoạt động nhiều nhất:\n%1",
      activeUsers: "📊 Người dùng hoạt động nhiều nhất:\n%1",
      popularCommands: "📊 Lệnh được sử dụng nhiều nhất:\n%1",
      noData: "❌ Chưa có dữ liệu",
      trackingEnabled: "✅ Đã bắt đầu theo dõi nhóm [%1 | %2]",
      trackingDisabled: "✅ Đã ngừng theo dõi nhóm [%1 | %2]",
      reportAdded: "✅ Đã thêm báo cáo cho nhóm [%1 | %2]",
      reports: "📝 Báo cáo:\n%1",
      noReports: "❌ Không có báo cáo nào",
      dataCleared: "✅ Đã xóa dữ liệu giám sát",
      invalidThreadID: "❌ ID nhóm không hợp lệ",
      missingReport: "❌ Vui lòng nhập nội dung báo cáo"
    },
    en: {
      noPermission: "You don't have permission to use this feature",
      statsHeader: "📊 Bot Statistics\n",
      uptime: "⏱️ Uptime: %1\n",
      totalGroups: "👥 Total groups: %1\n",
      totalUsers: "👤 Total users: %1\n",
      totalCommands: "🤖 Total commands processed: %1\n",
      totalMessages: "💬 Total messages processed: %1\n",
      activeGroups: "📊 Most active groups:\n%1",
      activeUsers: "📊 Most active users:\n%1",
      popularCommands: "📊 Most used commands:\n%1",
      noData: "❌ No data available",
      trackingEnabled: "✅ Started tracking group [%1 | %2]",
      trackingDisabled: "✅ Stopped tracking group [%1 | %2]",
      reportAdded: "✅ Added report for group [%1 | %2]",
      reports: "📝 Reports:\n%1",
      noReports: "❌ No reports available",
      dataCleared: "✅ Monitoring data cleared",
      invalidThreadID: "❌ Invalid thread ID",
      missingReport: "❌ Please enter report content"
    }
  },

  onLoad: function() {
    // Register event listeners
    global.client.eventRegister("message", ({ event }) => {
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
    });
    
    global.client.eventRegister("command", ({ event, commandName }) => {
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
    });
    
    // Add event handler to the bot's action handler
    const originalHandlerAction = global.client.handleEvent;
    if (originalHandlerAction) {
      global.client.handleEvent = function(event) {
        // Call original handler
        const result = originalHandlerAction(event);
        
        // Trigger our custom events
        if (event.type === "message" || event.type === "message_reply") {
          global.client.eventHandler("message", { event });
        }
        
        // For command monitoring, we'll handle it in the onStart function
        
        return result;
      };
    }
  },

  onStart: async function ({ args, threadsData, usersData, message, role, event, api, commandName, getLang }) {
    if (role < 2)
      return message.reply(getLang("noPermission"));
      
    // Trigger command event
    global.client.eventHandler("command", { event, commandName });
      
    const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
    const type = args[0];

    switch (type) {
      // Show general statistics
      case "stats": {
        const uptime = moment.duration(Date.now() - monitorData.botStats.startTime).humanize();
        const allThreads = await threadsData.getAll();
        const totalGroups = allThreads.filter(thread => thread.threadID.length > 15).length;
        const totalUsers = Object.keys(monitorData.activeUsers).length;
        
        let msg = getLang("statsHeader");
        msg += getLang("uptime", uptime);
        msg += getLang("totalGroups", totalGroups);
        msg += getLang("totalUsers", totalUsers);
        msg += getLang("totalCommands", monitorData.botStats.totalCommands);
        msg += getLang("totalMessages", monitorData.botStats.totalMessages);
        
        return message.reply(msg);
      }
      
      // Show most active groups
      case "groups": {
        const activeGroups = Object.entries(monitorData.activeGroups)
          .sort((a, b) => b[1].messageCount - a[1].messageCount)
          .slice(0, 10);
          
        if (activeGroups.length === 0)
          return message.reply(getLang("noData"));
          
        const groupList = await Promise.all(activeGroups.map(async ([threadID, data], index) => {
          const threadData = await threadsData.get(threadID);
          const name = threadData?.threadName || "Unknown";
          monitorData.activeGroups[threadID].name = name;
          return `${index + 1}. ${name} (${threadID}): ${data.messageCount} messages`;
        }));
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
        return message.reply(getLang("activeGroups", groupList.join("\n")));
      }
      
      // Show most active users
      case "users": {
        const activeUsers = Object.entries(monitorData.activeUsers)
          .sort((a, b) => b[1].messageCount - a[1].messageCount)
          .slice(0, 10);
          
        if (activeUsers.length === 0)
          return message.reply(getLang("noData"));
          
        const userList = await Promise.all(activeUsers.map(async ([userID, data], index) => {
          const userData = await usersData.get(userID);
          const name = userData?.name || "Unknown";
          monitorData.activeUsers[userID].name = name;
          return `${index + 1}. ${name} (${userID}): ${data.messageCount} messages`;
        }));
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
        return message.reply(getLang("activeUsers", userList.join("\n")));
      }
      
      // Show most used commands
      case "commands": {
        const commands = Object.entries(monitorData.commandUsage)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10);
          
        if (commands.length === 0)
          return message.reply(getLang("noData"));
          
        const commandList = commands.map(([cmd, data], index) => {
          return `${index + 1}. ${cmd}: ${data.count} uses`;
        });
        
        return message.reply(getLang("popularCommands", commandList.join("\n")));
      }
      
      // Track specific group
      case "track": {
        const threadID = args[1];
        if (!threadID || isNaN(threadID))
          return message.reply(getLang("invalidThreadID"));
          
        const threadData = await threadsData.get(threadID);
        if (!threadData)
          return message.reply(getLang("invalidThreadID"));
          
        if (!monitorData.activeGroups[threadID]) {
          monitorData.activeGroups[threadID] = {
            name: threadData.threadName,
            messageCount: 0,
            lastActive: Date.now(),
            tracking: true
          };
        } else {
          monitorData.activeGroups[threadID].tracking = true;
        }
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
        return message.reply(getLang("trackingEnabled", threadID, threadData.threadName));
      }
      
      // Untrack specific group
      case "untrack": {
        const threadID = args[1];
        if (!threadID || isNaN(threadID))
          return message.reply(getLang("invalidThreadID"));
          
        const threadData = await threadsData.get(threadID);
        if (!threadData)
          return message.reply(getLang("invalidThreadID"));
          
        if (monitorData.activeGroups[threadID]) {
          monitorData.activeGroups[threadID].tracking = false;
        }
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
        return message.reply(getLang("trackingDisabled", threadID, threadData.threadName));
      }
      
      // Add report about a group
      case "report": {
        const threadID = args[1];
        if (!threadID || isNaN(threadID))
          return message.reply(getLang("invalidThreadID"));
          
        const threadData = await threadsData.get(threadID);
        if (!threadData)
          return message.reply(getLang("invalidThreadID"));
          
        const reportContent = args.slice(2).join(" ");
        if (!reportContent)
          return message.reply(getLang("missingReport"));
          
        monitorData.reports.push({
          threadID,
          threadName: threadData.threadName,
          content: reportContent,
          reportedBy: event.senderID,
          timestamp: Date.now()
        });
        
        fs.writeFileSync(monitorDataPath, JSON.stringify(monitorData, null, 2));
        return message.reply(getLang("reportAdded", threadID, threadData.threadName));
      }
      
      // View reports
      case "reports": {
        let reports;
        
        if (args[1] && !isNaN(args[1])) {
          // Filter reports for specific thread
          reports = monitorData.reports.filter(report => report.threadID === args[1]);
        } else {
          // Show all reports
          reports = monitorData.reports;
        }
        
        if (reports.length === 0)
          return message.reply(getLang("noReports"));
          
        const reportList = await Promise.all(reports.map(async (report, index) => {
          const userData = await usersData.get(report.reportedBy);
          const reporterName = userData?.name || "Unknown";
          const time = getTime(report.timestamp, "DD/MM/YYYY HH:mm:ss");
          
          return `${index + 1}. Group: ${report.threadName} (${report.threadID})\n   Reporter: ${reporterName}\n   Time: ${time}\n   Content: ${report.content}`;
        }));
        
        return message.reply(getLang("reports", reportList.join("\n\n")));
      }
      
      // Clear monitoring data
      case "clear": {
        fs.writeFileSync(monitorDataPath, JSON.stringify({
          activeGroups: {},
          activeUsers: {},
          commandUsage: {},
          botStats: {
            startTime: monitorData.botStats.startTime,
            totalCommands: 0,
            totalMessages: 0
          },
          reports: []
        }, null, 2));
        
        return message.reply(getLang("dataCleared"));
      }
      
      default:
        return message.SyntaxError();
    }
  }
}; 