const axios = require("axios");
const fs = require("fs");
const cron = require("node-cron");

// Define the prefixes that trigger the module
const Prefixes = [
  'bard',
  '/bard',
  'ask',
  '.chi',
  '¶sammy',
  '_nano',
  'nano',
  'ai',
  '.ask',
  '/ask',
  '!ask',
  '@ask',
  '#ask',
  '$ask',
  '%ask',
  '^ask',
  '*ask',
  '.ai',
  '/ai',
  '!ai',
  '@ai',
  '#ai',
  '$ai',
  '%ai',
  '^ai',
  '*ai',
];

const limitDuration = 60 * 60 * 1000; // 1 hour in milliseconds
const requestLimit = 100;
const dataFilePath = "requestLimit.json";

let requestCounter = 0;
let lastResetTime = null;

module.exports = {
  config: {
    name: "bard",
    aliases: ['ai', 'ask', 'bard'],
    version: "1.0",
    author: "jvbarcenas",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "lol",
    },
    longDescription: {
      vi: "",
      en: "",
    },
    category: "Bard",
  },

  onStart: async function() {},
  onLoad: function() {
    loadRequestData();

    // Schedule the cron job to reset the request counter every hour
    cron.schedule("0 * * * *", () => {
      resetRequestCounter();
    });
  },

  onChat: async function({ api, event }) {
    let { threadID, messageID } = event;

    // Check if the message starts with one of the defined prefixes
    const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));
    if (!prefix) {
      return; // Return early if the prefix is not found
    }

    // Check if the request limit has been reached
    if (requestCounter >= requestLimit) {
      api.sendMessage("Request limit exceeded. Please try again later.\n\n(100 requests per hour to avoid being muted by excessive requests)", threadID, messageID);
      return;
    }

    const response = event.body.slice(prefix.length).trim();

    if (!response) {
      api.sendMessage("Please provide a question or query", threadID, messageID);
      return;
    }

    api.sendMessage("Searching for an answer, please wait...", threadID, messageID);

    try {
      let responseData;
      try {
        const res = await axios.get(`https://barbatos.corpselaugh.repl.co/ask?question=${response}`);
        responseData = res.data;
      } catch (bardError) {
        if (bardError.response && bardError.response.status === 500) {
          throw new Error("Fallback to the second API");
        } else {
          throw bardError;
        }
      }

      if (
        responseData.error &&
        responseData.error === "No response from Bard AI" ||
        responseData.content.includes("I am still working to learn more languages, so I can't do that just yet.") ||
      
responseData.content.includes("I am an LLM trained to") ||
        responseData.content.includes("I am trained to understand and respond only to a subset of languages at this time and can't provide assistance with that") ||
        responseData.content.includes("Bard Help Center.") ||
        responseData.content.includes("I'm a text-based AI") ||
        responseData.content.includes("I'm just a language model, so I can't help you with that.") ||
        responseData.content.includes("I'm not able to help with that") ||
        responseData.content.includes("As a language model,") ||
        responseData.content.includes("I'm unable to help") ||
        responseData.content.includes("the capacity to help with that.") ||
        responseData.content.includes("Please refer to the Bard Help Center for a current list of supported languages.")
      ) {
        throw new Error("Fallback to the second API");
      }

      // Rest of the code for handling the response from the first API
      const { content, links: images } = responseData;

      if (content && content.length > 0) {
        const attachment = [];

        if (!fs.existsSync("cache")) {
          fs.mkdirSync("cache");
        }

        for (let i = 0; i < images.length; i++) {
          const url = images[i];
          const photoPath = `cache/test${i + 1}.png`;

          try {
            const imageResponse = await axios.get(url, { responseType: "arraybuffer" });
            fs.writeFileSync(photoPath, imageResponse.data);

            attachment.push(fs.createReadStream(photoPath));
          } catch (error) {
            console.error("Error occurred while downloading and saving the photo:", error);
          }
        }

        api.sendMessage(
          {
            attachment: attachment,
            body: content,
          },
          threadID,
          messageID
        );
      } else {
        api.sendMessage(content, threadID, messageID);
      }

      // Increment the request counter
      requestCounter++;

      // Store the request data in the JSON file
      storeRequestData();
    } catch (error) {
      if (error.message === "Fallback to the second API") {
        try {
          const res = await axios.get(`https://gptextra.corpselaugh.repl.co/?gpt=${response}`);
          const responseData = res.data;

          // Handle the response from the second API
          const { content } = responseData;

          if (content) {
            api.sendMessage(content, threadID, messageID);
          } else {
            api.sendMessage("An error occurred while fetching data from the backup API.", threadID, messageID);
          }

          // Increment the request counter
          requestCounter++;

          // Store the request data in the JSON file
          storeRequestData();
        } catch (backupError) {
          console.error("Error occurred while fetching data from the backup API:", backupError);
          api.sendMessage("An error occurred while searching for an answer.", threadID, messageID);
        }
      } else {
        console.error("Error occurred while fetching data from the Bard API:", error);
        api.sendMessage("An error occurred while searching for an answer.", threadID, messageID);
      }
    }
  },
};

function loadRequestData() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, "utf8");
    const jsonData = JSON.parse(data);

    requestCounter = jsonData.request || 0;
    lastResetTime = jsonData.lastResetTime || null;
  } else {
    requestCounter = 0;
    lastResetTime = null;
  }
}

function storeRequestData() {
  const jsonData = {
    request: requestCounter,
    lastResetTime: lastResetTime,
  };

  fs.writeFileSync(dataFilePath, JSON.stringify(jsonData), "utf8");
}

function resetRequestCounter() {
  requestCounter = 0;
  lastResetTime = new Date().getTime();
  storeRequestData();
}
