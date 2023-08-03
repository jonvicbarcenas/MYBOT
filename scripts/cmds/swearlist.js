const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "swearlist",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Add or remove a swear word from the list."
    },
    longDescription: {
      en: "This command allows you to add or remove a swear word from the list of forbidden words."
    },
    category: "owner",
    guide: {
      en: "To add a swear word: !swear add <word>\nTo remove a swear word: !swear remove <word>"
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const action = args[0]?.toLowerCase();
    const swearWordsFile = path.join(__dirname, 'swearWords.json');

    // Load existing swear words from the JSON file
    let swearWordsData = { words: [] };
    if (fs.existsSync(swearWordsFile)) {
      const data = fs.readFileSync(swearWordsFile, 'utf8');
      if (data) {
        swearWordsData = JSON.parse(data);
      }
    }

    const extractWords = (text) => {
      return text.split(/\s|,|\|/).filter((word) => word.trim() !== '').map((word) => word.trim().toLowerCase());
    };

    if (!action || !isNaN(action)) {
      // Show pagination of swear words list
      const page = parseInt(action) || 1;
      const pageSize = 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedList = swearWordsData.words.slice(startIndex, endIndex).join('\n');

      const totalWords = swearWordsData.words.length;
      const totalPages = Math.ceil(totalWords / pageSize);

      api.sendMessage(`Swear Words (Page ${page} of ${totalPages}):\n${paginatedList}`, event.threadID);
      return;
    }

    if (action === 'add') {
      const wordsToAdd = extractWords(args.slice(1).join(' '));
      const addedWords = [];

      for (const word of wordsToAdd) {
        if (!swearWordsData.words.includes(word)) {
          swearWordsData.words.push(word);
          addedWords.push(word);
        }
      }

      if (addedWords.length > 0) {
        swearWordsData.words.sort();
        fs.writeFileSync(swearWordsFile, JSON.stringify(swearWordsData, null, 2), 'utf8');
        api.sendMessage(`Swear words "${addedWords.join(', ')}" have been added to the list.`, event.threadID);
      } else {
        api.sendMessage(`None of the provided swear words were added because they already exist in the list.`, event.threadID);
      }
    } else if (action === 'remove') {
      const wordsToRemove = extractWords(args.slice(1).join(' '));

      const removedWords = [];
      for (const word of wordsToRemove) {
        const index = swearWordsData.words.indexOf(word);
        if (index !== -1) {
          swearWordsData.words.splice(index, 1);
          removedWords.push(word);
        }
      }

      swearWordsData.words.sort();
      fs.writeFileSync(swearWordsFile, JSON.stringify(swearWordsData, null, 2), 'utf8');
      if (removedWords.length > 0) {
        api.sendMessage(`Swear words "${removedWords.join(', ')}" have been removed from the list.`, event.threadID);
      } else {
        api.sendMessage(`None of the provided swear words were found in the list.`, event.threadID);
      }
    }
  }
};
