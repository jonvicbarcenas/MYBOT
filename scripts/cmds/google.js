const { google } = require('googleapis');

// Set up the Google Custom Search API client
const customsearch = google.customsearch('v1');
const CX = 'c42c04fdfefce47bc';
const API_KEY = 'AIzaSyDWs4zZposbsyNlkeviSsF8W1w5wFAlzgo';

module.exports = {
  config: {
    name: 'google',
    version: '1.0',
    author: 'Jon Vic Barcenas',
    category: "Utility",
    shortDescription: {
      en: 'Google search',
    },
    longDescription: {
      en: 'Performs a Google search and returns multiple results',
    },
  },

  onStart: async function ({ message, args }) {
    // Join the command arguments into a single search query
    const query = args.join(' ');

    try {
      // Use the Google Custom Search API to search for the query
      const res = await customsearch.cse.list({
        cx: CX,
        auth: API_KEY,
        q: query,
        num: 3, // Return three search results
        fields: 'items(title,snippet)', // Retrieve the title and the snippet fields of the search result
      });

      // Extract the titles and snippets of the top search results from the response
      const results = res.data.items.map(item => `${item.title}\n${item.snippet}`);

      // Concatenate the titles and snippets together to form a more complete answer
      const resultMessage = `Here are the top ${results.length} results for "${query}":\n\n${results.join('\n\n')}`;

      // Send the message back to the user as a reply
      message.reply(resultMessage);
    } catch (err) {
      // Handle any errors that occur during the search
      console.error(`Error searching Google for "${query}": ${err}`);
      message.reply('An error occurred while searching. Please try again later.');
    }
  },
};
