const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  config: {
    name: "scraper",
    aliases: ["scrape"],
    version: "1.0",
    author: "XyryllPanget",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Website scraper",
      en: "Website scraper"
    },
    longDescription: {
      vi: "This command scrapes information from a website.",
      en: "This command scrapes information from a website."
    },
    category: "scraper",
    guide: {
      vi: "",
      en: "{pn} https://facebook.com (must include https://)",
    },
  },
  onStart: async function ({ api, args, message, event, /* ... */ }) {
    const prefixes = ["$", "@", "&", "_", "-", "+", "(", ")", "/", "*", ":", "!", "?"];

    const prefix = prefixes.find((prefix) => event.body.startsWith(prefix));

    if (!prefix) return;

    const query = args.join(" "); 

    if (!query) {
      return api.sendMessage(
        `Please provide a valid website URL.\n\nHow to use: ${prefix} [website URL]`,
        event.threadID,
        event.messageID
      );
    }

    try {
      const encodedQuery = encodeURI(query); 
      const websiteData = await scrapeWebsite(encodedQuery);

     
      api.sendMessage(
        `Here's the scraped data from "${query}":\n\n${websiteData}`,
        event.threadID,
        event.messageID
      );
    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage("Failed to scrape the website.", event.threadID, event.messageID);
    }
  }
};

async function scrapeWebsite(url) {
  if (!/^https?:\/\/\S+/i.test(url)) {
    throw new Error("Please provide a valid website URL starting with 'http://' or 'https://'.");
  }

  // Remove duplicate slashes in URLs
  const cleanedURL = url.replace(/([^:]\/)\/+/g, "$1");

  try {
    const response = await axios.get(cleanedURL);
    const $ = cheerio.load(response.data);

    // Perform your custom scraping logic using cheerio
    // This could involve selecting HTML elements and extracting their text or attributes
    // Return the scraped data as a string

    // Example: Scrape the page title
    const pageTitle = $("title").text();

    // Example: Scrape all the links on the page
    const links = [];
    $("a").each((index, element) => {
      const link = $(element).attr("href");
      links.push(link);
    });

    // Format the scraped data
    let scrapedData = `Page Title: ${pageTitle}\n\n`;
    scrapedData += "Links:\n";
    links.forEach((link) => {
      scrapedData += `- ${link}\n`;
    });

    return scrapedData;
  } catch (error) {
    console.error('[ERROR]', error);
    throw new Error("Failed to scrape the website.");
  }
}
