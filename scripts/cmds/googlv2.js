module.exports = {
 config: {
 name: "googlev2",
 aliases: ["searchv2"],
 version: "1.0",
 author: "JVBarcenas",
 countDown: 5,
 role: 0,
 shortDescription: {
 en: "Retrieves Google search results for a specified query."
 },
 longDescription: {
 en: "This command retrieves Google search results for a specified query using the API provided."
 },
 category: "Information",
 guide: {
 en: "{p}{n} <query>"
 }
 },
 onStart: async function ({ api, event, args }) {
 const axios = require('axios');
 const query = args.join(' ');
 if (!query) {
 return api.sendMessage(`Please provide a search query.`, event.threadID, event.messageID);
 }

 try {
 const response = await axios.get(`https://api.reikomods.repl.co/search/google?search=${query}`);
 const results = response.data;
 const snippets = results.map(result => result.snippet).slice(0, 5);
 const message = `•——[RESULT]——•\nShowing only 5 results to avoid Error\n\n\n(1.) ${snippets[0]}\n\n(2.) ${snippets[1]}\n\n(3.) ${snippets[2]}\n\n(4.) ${snippets[3]}\n\n(5.) ${snippets[4]}\n\n•——[RESULT]——•`;
 api.sendMessage(message, event.threadID, event.messageID);
 } catch (error) {
 api.sendMessage(`Sorry, I couldn't retrieve the search results for ${query}.`, event.threadID, event.messageID);
 }
 }
};