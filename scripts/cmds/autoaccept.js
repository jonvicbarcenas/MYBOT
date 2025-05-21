const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

// File path for saving state
const DATA_DIR = path.join(__dirname, "../../data");
const STATE_FILE = path.join(DATA_DIR, "autoaccept.json");

// Global variable to track autoaccept status
let autoAcceptEnabled = false;
let intervalId = null;

// Load state from JSON file
function loadState() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Create state file if it doesn't exist
    if (!fs.existsSync(STATE_FILE)) {
      saveState(false);
      return false;
    }
    
    const data = JSON.parse(fs.readFileSync(STATE_FILE));
    return data.enabled || false;
  } catch (error) {
    console.error("Error loading autoaccept state:", error);
    return false;
  }
}

// Save state to JSON file
function saveState(enabled) {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(STATE_FILE, JSON.stringify({ 
      enabled: enabled,
      lastUpdated: Date.now() 
    }, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving autoaccept state:", error);
    return false;
  }
}

module.exports = {
  config: {
    name: "autoaccept",
    version: "1.2",
    author: "JV Barcenas",
    countDown: 13,
    role: 2,
    shortDescription: "toggle auto friend request acceptance",
    longDescription: "turn on or off auto friend request acceptance",
    category: "owner",
    guide: {
      en: "{p}autoaccept on/off - turn auto friend request acceptance on or off\n{p}autoaccept status - check current status"
    }
  },
  
  onStart: async function({ args, event, api, message }) {
    const command = args[0]?.toLowerCase();
    
    if (command === "on") {
      if (autoAcceptEnabled) {
        return api.sendMessage("❌ Auto-accept is already enabled.", event.threadID, event.messageID);
      }
      
      autoAcceptEnabled = true;
      saveState(true);
      startAutoAccept(api);
      return api.sendMessage("✅ Auto-accept friend requests has been enabled and saved.", event.threadID, event.messageID);
    } 
    else if (command === "off") {
      if (!autoAcceptEnabled) {
        return api.sendMessage("❌ Auto-accept is already disabled.", event.threadID, event.messageID);
      }
      
      autoAcceptEnabled = false;
      saveState(false);
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return api.sendMessage("✅ Auto-accept friend requests has been disabled and saved.", event.threadID, event.messageID);
    }
    else if (command === "status") {
      return api.sendMessage(`Auto-accept is currently ${autoAcceptEnabled ? "enabled ✅" : "disabled ❌"}`, event.threadID, event.messageID);
    }
    else {
      return api.sendMessage(`⚠️ Invalid command. Use:\n- "autoaccept on" to enable\n- "autoaccept off" to disable\n- "autoaccept status" to check current status`, event.threadID, event.messageID);
    }
  },
  
  onLoad: async function ({ event, api }) {
    // Load saved state on startup
    autoAcceptEnabled = loadState();
    
    // Start interval if enabled
    if (autoAcceptEnabled) {
      startAutoAccept(api);
    }
  }
};

function startAutoAccept(api) {
  if (intervalId) clearInterval(intervalId);
  
  const targetUserID = "100007150668975";
  const targetThreadID = "23871909845786935";
  
  intervalId = setInterval(async () => {
    if (!autoAcceptEnabled) return; // Check if still enabled
    
    try {
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
    } catch (error) {
      console.error("Error in autoaccept:", error);
    }
  }, 600000);
}

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
