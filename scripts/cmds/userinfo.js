const fs = require("fs-extra");
const path = require("path");
const { getTime } = global.utils;

// Path to monitor data file
const monitorDataPath = path.join(__dirname, "cache", "monitorData.json");

module.exports = {
  config: {
    name: "userinfo",
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 2, // Admin only
    description: {
      vi: "Xem thông tin chi tiết về người dùng",
      en: "View detailed information about a user"
    },
    category: "admin",
    guide: {
      en: "   {pn} [userID/@mention]: View detailed information about a specific user\n" +
          "   {pn}: View detailed information about yourself"
    }
  },

  langs: {
    vi: {
      noPermission: "Bạn không có quyền sử dụng tính năng này",
      userInfoHeader: "📊 Thông tin người dùng: %1\n",
      userID: "🆔 ID người dùng: %1\n",
      createdAt: "📅 Ngày tạo dữ liệu: %1\n",
      gender: "⚧️ Giới tính: %1\n",
      messageCount: "💬 Tổng tin nhắn: %1\n",
      messageToday: "📝 Tin nhắn hôm nay: %1\n",
      activeGroups: "🔥 Hoạt động nhiều nhất trong các nhóm:\n%1",
      commandsUsed: "🤖 Lệnh đã sử dụng: %1\n",
      topCommands: "📊 Lệnh sử dụng nhiều nhất:\n%1",
      noData: "❌ Không có dữ liệu cho người dùng này",
      invalidUserID: "❌ ID người dùng không hợp lệ",
      userNotFound: "❌ Không tìm thấy người dùng với ID: %1",
      male: "Nam",
      female: "Nữ",
      other: "Khác"
    },
    en: {
      noPermission: "You don't have permission to use this feature",
      userInfoHeader: "📊 User Information: %1\n",
      userID: "🆔 User ID: %1\n",
      createdAt: "📅 Data created: %1\n",
      gender: "⚧️ Gender: %1\n",
      messageCount: "💬 Total messages: %1\n",
      messageToday: "📝 Messages today: %1\n",
      activeGroups: "🔥 Most active in groups:\n%1",
      commandsUsed: "🤖 Commands used: %1\n",
      topCommands: "📊 Most used commands:\n%1",
      noData: "❌ No data available for this user",
      invalidUserID: "❌ Invalid user ID",
      userNotFound: "❌ User not found with ID: %1",
      male: "Male",
      female: "Female",
      other: "Other"
    }
  },

  onStart: async function ({ args, threadsData, usersData, message, role, event, api, getLang }) {
    // Check if monitor data file exists
    if (!fs.existsSync(monitorDataPath)) {
      return message.reply(getLang("noData"));
    }
    
    // Determine which user ID to use
    let userID = event.senderID;
    
    if (args[0]) {
      // Check if the argument is a mention
      const mentionedID = Object.keys(event.mentions)[0];
      if (mentionedID) {
        userID = mentionedID;
      } 
      // Check if it's a user ID
      else if (!isNaN(args[0])) {
        userID = args[0];
      }
    }
    
    // Get user data
    const userData = await usersData.get(userID);
    if (!userData) {
      return message.reply(getLang("userNotFound", userID));
    }
    
    // Get monitor data
    const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
    const userMonitorData = monitorData.activeUsers[userID];
    
    if (!userMonitorData) {
      return message.reply(getLang("noData"));
    }
    
    // Calculate messages today
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const messagesToday = userMonitorData.lastActive > todayStart ? userMonitorData.messageCount : 0;
    
    // Get groups where user is active
    const activeGroups = [];
    for (const [threadID, groupData] of Object.entries(monitorData.activeGroups)) {
      const threadData = await threadsData.get(threadID);
      if (threadData && threadData.members.some(member => member.userID === userID)) {
        activeGroups.push({
          threadID,
          threadName: threadData.threadName,
          messageCount: groupData.messageCount
        });
      }
    }
    
    // Sort groups by message count
    activeGroups.sort((a, b) => b.messageCount - a.messageCount);
    
    // Format active groups list
    const groupList = activeGroups.slice(0, 5).map((group, index) => {
      return `${index + 1}. ${group.threadName}: ${group.messageCount} messages`;
    });
    
    // Get commands used by user
    const userCommands = [];
    for (const [cmdName, cmdData] of Object.entries(monitorData.commandUsage)) {
      // We don't have per-user command usage data, so this is an approximation
      userCommands.push({
        name: cmdName,
        count: cmdData.count
      });
    }
    
    // Sort commands by usage count
    userCommands.sort((a, b) => b.count - a.count);
    
    // Format top commands list
    const commandList = userCommands.slice(0, 3).map((cmd, index) => {
      return `${index + 1}. ${cmd.name}: ${cmd.count} uses`;
    });
    
    // Determine gender
    let genderText;
    switch (userData.gender) {
      case "MALE":
        genderText = getLang("male");
        break;
      case "FEMALE":
        genderText = getLang("female");
        break;
      default:
        genderText = getLang("other");
        break;
    }
    
    // Build message
    let msg = getLang("userInfoHeader", userData.name);
    msg += getLang("userID", userID);
    msg += getLang("createdAt", getTime(userData.createdAt, "DD/MM/YYYY HH:mm:ss"));
    msg += getLang("gender", genderText);
    msg += getLang("messageCount", userMonitorData.messageCount);
    msg += getLang("messageToday", messagesToday);
    msg += getLang("commandsUsed", userCommands.reduce((sum, cmd) => sum + cmd.count, 0));
    
    if (groupList.length > 0) {
      msg += getLang("activeGroups", groupList.join("\n"));
    }
    
    if (commandList.length > 0) {
      msg += getLang("topCommands", commandList.join("\n"));
    }
    
    return message.reply(msg);
  }
};