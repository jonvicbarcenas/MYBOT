const axios = require('axios');

module.exports = {
  config: {
    name: "chrome",
    aliases: ["c", "chromesearch"],
    version: "2.0",
    author: "XyryllPanget",
    role: 0,
    shortDescription: {
      en: "Search on chrome for a given query."
    },
    longDescription: {
      en: "This command searches chrome for a given query and returns the top 5 results."
    },
    category: "utility",
    guide: {
      en: "To use this command, type !google <query>."
    }
  },
  onStart: async function ({ api, event, args }) {
    const query = args.join(' ');
    if (!query) {
      api.sendMessage("Please provide a search query.", event.threadID);
      return;
    }

    const cx = "7514b16a62add47ae"; // Replace with your Custom Search Engine ID
    const apiKey = "AIzaSyAqBaaYWktE14aDwDE8prVIbCH88zni12E"; // Replace with your API key
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`;

    try {
      const response = await axios.get(url);
      const searchResults = response.data.items.slice(0, 5);
      let message = `Top 5 results for '${query} Searching on Chrome':\n\n`;
      searchResults.forEach((result, index) => {
        message += `${index + 1}. ${result.title}\n${result.link}\n${result.snippet}\n\n`;
      });
      api.sendMessage(message, event.threadID);
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while searching Chrome.", event.threadID);
    }
  }
};