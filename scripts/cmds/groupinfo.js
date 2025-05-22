const fs = require("fs-extra");
const path = require("path");
const { getTime } = global.utils;

// Path to monitor data file
const monitorDataPath = path.join(__dirname, "cache", "monitorData.json");

module.exports = {
  config: {
    name: "groupinfo",
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 1, // Group admins and bot admins
    description: {
      vi: "Xem thông tin chi tiết về nhóm",
      en: "View detailed information about a group"
    },
    category: "admin",
    guide: {
      en: "   {pn} [threadID]: View detailed information about a specific group\n" +
          "   {pn}: View detailed information about the current group"
    }
  },

  langs: {
    vi: {
      noPermission: "Bạn không có quyền sử dụng tính năng này",
      groupInfoHeader: "📊 Thông tin nhóm: %1\n",
      groupID: "🆔 ID nhóm: %1\n",
      createdAt: "📅 Ngày tạo: %1\n",
      memberCount: "👥 Số thành viên: %1\n",
      adminCount: "👑 Số quản trị viên: %1\n",
      messageCount: "💬 Tổng tin nhắn: %1\n",
      messageToday: "📝 Tin nhắn hôm nay: %1\n",
      activeUsers: "🔥 Người dùng hoạt động nhiều nhất:\n%1",
      noData: "❌ Không có dữ liệu cho nhóm này",
      invalidThreadID: "❌ ID nhóm không hợp lệ",
      threadNotFound: "❌ Không tìm thấy nhóm với ID: %1"
    },
    en: {
      noPermission: "You don't have permission to use this feature",
      groupInfoHeader: "📊 Group Information: %1\n",
      groupID: "🆔 Group ID: %1\n",
      createdAt: "📅 Created: %1\n",
      memberCount: "👥 Members: %1\n",
      adminCount: "👑 Admins: %1\n",
      messageCount: "💬 Total messages: %1\n",
      messageToday: "📝 Messages today: %1\n",
      activeUsers: "🔥 Most active users:\n%1",
      noData: "❌ No data available for this group",
      invalidThreadID: "❌ Invalid thread ID",
      threadNotFound: "❌ Thread not found with ID: %1"
    }
  },

  onStart: async function ({ args, threadsData, usersData, message, role, event, api, getLang }) {
    // Check if monitor data file exists
    if (!fs.existsSync(monitorDataPath)) {
      return message.reply(getLang("noData"));
    }
    
    // Determine which thread ID to use
    let threadID = event.threadID;
    if (args[0] && !isNaN(args[0])) {
      // If admin wants to check another group
      if (role < 2) {
        return message.reply(getLang("noPermission"));
      }
      threadID = args[0];
    }
    
    // Get thread data
    const threadData = await threadsData.get(threadID);
    if (!threadData) {
      return message.reply(getLang("threadNotFound", threadID));
    }
    
    // Get monitor data
    const monitorData = JSON.parse(fs.readFileSync(monitorDataPath, "utf8"));
    const groupData = monitorData.activeGroups[threadID];
    
    if (!groupData) {
      return message.reply(getLang("noData"));
    }
    
    // Calculate messages today
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const messagesToday = Object.entries(monitorData.activeUsers)
      .filter(([userID, userData]) => {
        return userData.lastActive > todayStart && 
               threadData.members.some(member => member.userID === userID);
      })
      .reduce((count, [_, userData]) => count + userData.messageCount, 0);
    
    // Get active users in this group
    const activeUsers = Object.entries(monitorData.activeUsers)
      .filter(([userID, _]) => threadData.members.some(member => member.userID === userID))
      .sort((a, b) => b[1].messageCount - a[1].messageCount)
      .slice(0, 5);
    
    // Format active users list
    const userList = await Promise.all(activeUsers.map(async ([userID, userData], index) => {
      const user = await usersData.get(userID);
      const name = user?.name || "Unknown";
      return `${index + 1}. ${name}: ${userData.messageCount} messages`;
    }));
    
    // Build message
    let msg = getLang("groupInfoHeader", threadData.threadName);
    msg += getLang("groupID", threadID);
    msg += getLang("createdAt", getTime(threadData.createdAt, "DD/MM/YYYY HH:mm:ss"));
    msg += getLang("memberCount", threadData.members.length);
    msg += getLang("adminCount", threadData.adminIDs.length);
    msg += getLang("messageCount", groupData.messageCount);
    msg += getLang("messageToday", messagesToday);
    
    if (userList.length > 0) {
      msg += getLang("activeUsers", userList.join("\n"));
    }
    
    return message.reply(msg);
  }
}; 