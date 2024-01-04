const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "downbot",
    version: "1.0",
    author: "JV",
    shortDescription: "Downbot",
    longDescription: "Downbot that saves data every second.",
    category: "owner",
  },

  onStart: async function() {},
  onLoad: async function ({ event }) {
    const apiUrl = "https://logbot.dreamingcorps.repl.co/info";
    const saveFileName = path.join(__dirname, "minebot.json");
    let lastTimestamp = null;

    setInterval(async () => {
      try {
        // Check if the timestamp is the same as the last one
        if (lastTimestamp) {
          //console.log("Checking timestamp before API request...");
          const response = await axios.get(apiUrl);
          const dataToSave = response.data;

          if (dataToSave.latestEvent && dataToSave.latestEvent.timestamp === lastTimestamp) {
            // Set messageSent to true if the timestamp is the same
            dataToSave.latestEvent.messageSent = true;
            fs.writeFileSync(saveFileName, JSON.stringify(dataToSave, null, 2), "utf-8");
            //console.log("Timestamp unchanged. Data updated with messageSent=true.");
            return;
          }
        }

        // Fetch new data from the API
        const response = await axios.get(apiUrl);
        const dataToSave = response.data;

        // Add the "messageSent" property to the latestEvent object
        dataToSave.latestEvent.messageSent = false;

        fs.writeFileSync(saveFileName, JSON.stringify(dataToSave, null, 2), "utf-8");
        lastTimestamp = dataToSave.latestEvent.timestamp;
        //console.log("Data saved successfully.");
      } catch (error) {
        //console.error("Error while fetching or saving data:", error.message);
      }
    }, 1000);
  }
};
