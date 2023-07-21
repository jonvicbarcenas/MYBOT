//the modified welcome event https://pastebin.com/i6sRfJzU

const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "approve",
    version: "1.0",
    author: "SANDIP",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Approve or remove a specific thread and store its details."
    },
    longDescription: {
      en: "This command allows you to approve or remove a specific thread by providing its ID, and it will be stored or removed from the approved list."
    },
    category: "owner",
    guide: {
      en: "To add a thread: !approve add <threadID>\nTo remove a thread: !approve remove <threadID>"
    }
  },

  onStart: async function({ api, event, args, threadsData }) {
    if (args.length !== 2 || !['add', 'remove'].includes(args[0].toLowerCase())) {
      return api.sendMessage("Invalid command format. Usage:\nTo add a thread: !approve add <threadID>\nTo remove a thread: !approve remove <threadID>", event.threadID);
    }

    const action = args[0].toLowerCase();
    const threadID = args[1];
    const approvedThreadsFile = path.join('approved.json');

    // Load existing approved thread data from the JSON file
    let approvedThreads = {};
    if (fs.existsSync(approvedThreadsFile)) {
      const data = fs.readFileSync(approvedThreadsFile, 'utf8');
      if (data) {
        approvedThreads = JSON.parse(data);
      }
    }

    if (action === 'add') {
      // Check if the thread exists
      try {
        const threadData = await api.getThreadInfo(threadID);

        // Store thread ID and name in the approvedThreads object
        approvedThreads[threadID] = {
          name: threadData.threadName,
          timestamp: Date.now(),
        };

        // Save updated approvedThreads object back to the JSON file
        fs.writeFileSync(approvedThreadsFile, JSON.stringify(approvedThreads, null, 2), 'utf8');

        // Send a message indicating that the thread is approved
        api.sendMessage(`Thread "${threadData.threadName}" (ID: ${threadID}) has been approved and stored.`, event.threadID);
      } catch (error) {
        // If the thread does not exist, send an error message
        api.sendMessage(`Error: Thread with ID ${threadID} does not exist.`, event.threadID);
      }
    } else if (action === 'remove') {
      // Check if the thread exists in the approved list
      if (approvedThreads[threadID]) {
        const threadName = approvedThreads[threadID].name;

        // Remove the thread from the approvedThreads object
        delete approvedThreads[threadID];

        // Save updated approvedThreads object back to the JSON file
        fs.writeFileSync(approvedThreadsFile, JSON.stringify(approvedThreads, null, 2), 'utf8');

        // Send a message indicating that the thread is removed from the approved list
        api.sendMessage(`Thread with ID ${threadID}, Thread Name: ${threadName} has been removed from the approved list.`, event.threadID);
      } else {
        api.sendMessage(`Error: Thread with ID ${threadID} is not in the approved list.`, event.threadID);
      }
    }
  },
};
