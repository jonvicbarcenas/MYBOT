const axios = require('axios');

const autopost = async (postMessage, accessToken, clientId, clientSecret) => {
  const appsecretProof = require('crypto')
    .createHmac('sha256', clientSecret)
    .update(accessToken)
    .digest('hex');

  const postData = {
    message: postMessage,
    access_token: accessToken,
    client_id: clientId,
    client_secret: clientSecret,
    appsecret_proof: appsecretProof,
  };

  try {
    const response = await axios.post(`https://graph.facebook.com/me`, postData);

    if (response.status === 200) {
      console.log(`Posted successfully: ${postMessage}`);
      return "Posted successfully.";
    } else {
      return `Failed to post ${postMessage}. Response status: ${response.status}, Data: ${JSON.stringify(response.data)}`;
    }
  } catch (error) {
    return `Error posting (${postMessage}): ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
  }
};

module.exports = {
  config: {
    name: "post",
    aliases: ["fbpost"],
    version: "1.0",
    author: "Your Name",
    shortDescription: {
      en: "Post a message on Facebook.",
    },
    longDescription: {
      en: "This command posts a message on Facebook using the autopost function.",
    },
    category: "social",
    guide: {
      en: '{pn} [message]',
    },
  },

  onStart: async function ({ api, event, args }) {
    let { threadID } = event;
    let postMessage = args.join(" ");

    if (!postMessage) return api.sendMessage("Please provide a message to post.", threadID);

    try {
      // Replace the following values with your actual Facebook app credentials
      const accessToken = "EAAD6V7os0gcBO55xRrYO4A5G63PflR5OsXXytxVc5aCe90nNxZB7dmZAV8VjT7LuvzP4pkAnZCr91wuuTRmDQuBXTKEhUNdSZCSfrCACypvU0yJUOJDDyZAdvfva1FZAtkKPjH9TyM2eLbqof089ZAaYp7JncwuuuGEpTDNFj93DV8HbhUEm95VPKZA1kQZDZD";
      const clientId = "2723891027764162";
      const clientSecret = "d87b9665c45cc98989fd5c497e854ab0";

      const result = await autopost(postMessage, accessToken, clientId, clientSecret);
      api.sendMessage(result || "Posted successfully.", threadID);
    } catch (error) {
      console.error("Error posting on Facebook:", error);
      api.sendMessage("An error occurred while posting on Facebook.", threadID);
    }
  },
};
