const fast = require('fast-speedtest-api');

module.exports = {
  config: {
    name: "speedtest",
    aliases: ["speed"],
    version: "1.0",
    author: "Samir B. Thakuri",
    countDown: 30,
    role: 2,
    shortDescription: "Check system speed",
    longDescription: "Check system speed",
    category: "owner",
    guide: "{pn}"
  },
  onStart: async function ({ api, event }) {
    try {
      const speedTest = new fast({
        token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
        verbose: false,
        timeout: 10000,
        https: true,
        urlCount: 5,
        bufferSize: 8,
        unit: fast.UNITS.Mbps
      });
      console.log('Starting speed test...');
      const result = await speedTest.getSpeed();
      console.log('Speed test completed:', result);
      const message = "Successfully tested Bot's Processing Speed." +
        "\n➠ Result" +
        "\n⟿ Speed: " + result + " MBPS";
      console.log('Sending message:', message);
      return api.sendMessage(message, event.threadID, event.messageID);
    } catch (error) {
      console.error('Error occurred:', error);
      return api.sendMessage("Error occurred during the speed test.", event.threadID, event.messageID);
    }
  }
};