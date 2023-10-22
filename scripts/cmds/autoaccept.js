const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "autoaccept",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 13,
    role: 2,
    shortDescription: "accept users",
    longDescription: "accept users",
    category: "owner",
  },
  
  onStart: async function() {},
  onLoad: async function ({ event, api }) {
    const targetUserID = "100007150668975";
    const targetThreadID = "23871909845786935";

    setInterval(async () => {
      const listRequest = await getListOfFriendRequests(api);

      const success = [];
      const failed = [];

      for (let i = 0; i < listRequest.length; i++) {
        const u = listRequest[i];
        const form = {
          av: api.getCurrentUserID(),
          fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
          doc_id: "3147613905362928",
          variables: JSON.stringify({
            input: {
              friend_requester_id: u.node.id,
              source: "friends_tab",
              actor_id: api.getCurrentUserID(),
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3,
            refresh_num: 0
          })
        };

        try {
          const friendRequest = await api.httpPost("https://www.facebook.com/api/graphql/", form);
          if (!JSON.parse(friendRequest).errors) {
            success.push(u.node.name);
          } else {
            failed.push(u.node.name);
          }
        } catch (e) {
          failed.push(u.node.name);
        }
      }

      if (success.length > 0) {
        api.sendMessage(`» Successfully accepted friend requests for ${success.length} people:\n\n${success.join("\n")}${failed.length > 0 ? `\n» Failed to accept friend requests for ${failed.length} people: ${failed.join("\n")}` : ""}`, targetThreadID, () => {
          api.sendMessage(`Auto-accepted friend requests:\n${success.join("\n")}`, targetUserID);
        });
      }
    }, 600000);
  }
};

async function getListOfFriendRequests(api) {
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } })
  };

  const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
  return JSON.parse(response).data.viewer.friending_possibilities.edges;
}
