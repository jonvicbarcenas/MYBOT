// Create an object to store spam data for each thread
const threadSpamData = {};

module.exports = {
  config: {
    name: "spamleave",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "automatically leave the chat if spammed multiple times in a short interval"
    },
    longDescription: {
      en: "automatically leave the chat if spammed multiple times in a short interval"
    },
    category: "NOT COMMANDS",
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `Automatically leave the chat if spammed multiple times in a short interval`,
      event.threadID,
      event.messageID
    );
  },

  onChat: async function ({ api, event, usersData, threadsData }) {
    let { senderID, messageID, threadID, body } = event;

    const prefix = global.GoatBot.config.prefix;
    const otherPrefix = [
      'bard',
      'prefix',
      'ask',
      '.chi',
      '¶sammy',
      '_nano',
      'nano',
      'dain',
      'dainsleif',
      'bot',
      'Bot',
      '@dainsleif',
      'ai',
      '.ask',
      '!ask',
      '@ask',
      '#ask',
      '$ask',
      '%ask',
      '^ask',
      '*ask',
      '.ai',
      '!ai',
      '@ai',
      '#ai',
      '$ai',
      '%ai',
      '^ai',
      '*ai',
      '?ai',
    ];

    // Convert the original prefix and otherPrefix arrays to lowercase
    const allPrefixes = otherPrefix.map(p => p.toLowerCase());

    // Check if the event object has a `body` property
    if (!body) {
      return;
    }
  
    // Convert the incoming message to lowercase
    body = body.toLowerCase();

    // Get the customized prefixes for the current thread
    const threadPrefixes = global.utils.getPrefix(threadID);
    const threadPrefixArray = Array.from(threadPrefixes).map(p => p.toLowerCase());
    const allCombinedPrefixes = [...allPrefixes, ...threadPrefixArray];
  
    // Check if the message starts with any of the combined prefixes (case-insensitive)
    if (!body || allCombinedPrefixes.every(p => body.indexOf(p) !== 0)) return;

    // Check if a thread-specific prefix exists
    let usedPrefix = null;
    for (const prefix of threadPrefixArray) {
      if (body.startsWith(prefix)) {
        usedPrefix = prefix;
        break;
      }
    }

    // If a thread-specific prefix exists, use it; otherwise, use the default global prefix
    const effectivePrefix = usedPrefix || prefix;

    if (!threadSpamData[threadID]) {
      threadSpamData[threadID] = {
        timeStart: 0,
        count: 0
      };
    }

    const timee = 35; // During `timee` seconds, if spam occurs `num` times, the bot will leave the chat
    const num = 10; // Number of times spam gets detected -1, for example, 5 times 6 times will trigger the auto leave

    const currentTime = Date.now();

    if (currentTime - threadSpamData[threadID].timeStart >= timee * 1000) {
      threadSpamData[threadID].timeStart = currentTime;
      threadSpamData[threadID].count = 1;
    } else {
      threadSpamData[threadID].count++;
      if (threadSpamData[threadID].count >= num) {

        const threadData = await threadsData.get(threadID);
        const userData = await usersData.get(senderID);

        for (const adminID of global.GoatBot.config.adminBot) {
          const leavingMessage = `✧===== Bot Leave =====✧
🚷🚷
Event: Spam Bot Leave
- ThreadID: ${threadID}
- Name: ${threadData.threadName}
- Time: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
- Spammer Name: ${userData.name}
- Spammer ID: ${senderID}`;
          api.sendMessage(leavingMessage, adminID);
        }

        api.sendMessage("Spam detected, leaving the group...", threadID);

        api.removeUserFromGroup(api.getCurrentUserID(), threadID);

        threadSpamData[threadID].count = 0;
      } else if (threadSpamData[threadID].count === num - 2) {
        api.sendMessage("⚠️ Refrain from any more requests, I'm avoiding spam! ⚠️", threadID);
      }
    }
  }
};