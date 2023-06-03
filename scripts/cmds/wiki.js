const axios = require('axios');

module.exports = {
 config: {
 name: "wiki",
 author: "JVB",
 version: "1.0",
 shortDescription: "Get information from Wikipedia using its API",
 longDescription: "Search for information on a topic using the Wikipedia API and return a summary or full page content.",
 category: "utility",
 guide: {
 vi: "",
 en: ""
 }
 },

 onStart: async function({ args, message, getLang }) {
 try {
 const query = args.join(' ');
 const format = 'json'; // Format of the API response (can be json, xml, or wikitext)
 const url = `https://en.wikipedia.org/w/api.php?action=query&format=${format}&prop=extracts&exintro&explaintext&titles=${query}`;

 const { data } = await axios.get(url);
 const page = Object.values(data.query.pages)[0];

 if (!page.hasOwnProperty('missing')) {
 const summary = page.extract.split('\n')[0]; // Get the first sentence of the extract as summary
 const content = page.extract;

 return message.reply({body: `Here's what I found on Wikipedia about "${query}":\n\n${summary}\n\nRead more: ${page.fullurl}`, attachment: null}); // You can use the attachment parameter to send an image along with the message
 } else {
 return message.reply(`Sorry, I couldn't find any information on "${query}" on Wikipedia.`);
 }
 } catch (error) {
 console.error(error);
 return message.reply("Sorry, I couldn't find any information on that topic.");
 }
 }
}