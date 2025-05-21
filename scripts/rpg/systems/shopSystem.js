const { saveRPGData } = require('../utils/dataManager');
const { SHOP_ITEMS, XP_TO_LEVEL_UP } = require('../data/gameData');

function showShop({ message, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  // Show shop items
  const shopItemsList = SHOP_ITEMS.map(item => {
    return `${item.id}. ${item.name} - ${item.cost} gold\n   ${item.description}`;
  }).join("\n");
  
  return message.reply(lang("shopMenu", playerData.gold, shopItemsList));
}

function buyItem({ message, args, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  const itemId = parseInt(args[1]);
  if (isNaN(itemId)) {
    return message.reply(lang("invalidItem"));
  }
  
  const item = SHOP_ITEMS.find(item => item.id === itemId);
  if (!item) {
    return message.reply(lang("invalidItem"));
  }
  
  // Check if player has enough gold
  if (playerData.gold < item.cost) {
    return message.reply(lang("notEnoughGold", item.cost - playerData.gold));
  }
  
  // Process purchase based on item type
  playerData.gold -= item.cost;
  
  // Track gold spent for quests
  if (typeof global.updateQuestProgress === 'function') {
    global.updateQuestProgress(senderID, "gold_spent", { amount: item.cost });
    // Track item type purchased
    global.updateQuestProgress(senderID, "item_purchased", { itemType: item.type });
  }
  
  if (item.type === "service" && item.effect.changeName) {
    // Handle name change service
    message.reply(lang("nameChangePrompt", playerData.name)).then(info => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "rpg",
        author: senderID,
        messageID: info.messageID,
        type: "changeName"
      });
    });
    saveRPGData();
    return;
  } else if (item.type === "consumable") {
    // Apply consumable effects
    if (item.effect.hp) {
      const healAmount = item.effect.hp;
      playerData.hp = Math.min(playerData.maxHp, playerData.hp + healAmount);
      saveRPGData();
      return message.reply(lang("itemPurchased", item.name, item.cost, playerData.gold) + "\n" + 
        lang("itemUsed", item.name, `Restored ${healAmount} HP. Current HP: ${playerData.hp}/${playerData.maxHp}`));
    } else if (item.effect.xp) {
      playerData.xp += item.effect.xp;
      saveRPGData();
      return message.reply(lang("itemPurchased", item.name, item.cost, playerData.gold) + "\n" + 
        lang("itemUsed", item.name, `Gained ${item.effect.xp} XP. Current XP: ${playerData.xp}/${XP_TO_LEVEL_UP(playerData.level)}`));
    }
  } else {
    // Add equipment to inventory
    if (!playerData.inventory) {
      playerData.inventory = [];
    }
    
    // Check if player already has this item
    const existingItem = playerData.inventory.find(i => i.id === item.id);
    if (existingItem) {
      playerData.gold += item.cost; // Refund
      saveRPGData();
      return message.reply(lang("alreadyHaveItem"));
    }
    
    playerData.inventory.push({
      id: item.id,
      name: item.name,
      type: item.type,
      effect: item.effect,
      description: item.description,
      equipped: false
    });
    
    saveRPGData();
    return message.reply(lang("itemPurchased", item.name, item.cost, playerData.gold));
  }
}

function showInventory({ message, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  if (!playerData.inventory || playerData.inventory.length === 0) {
    return message.reply(lang("emptyInventory"));
  }
  
  const inventoryList = playerData.inventory.map(item => {
    const equippedStatus = item.equipped ? " [Equipped]" : "";
    return `• ${item.name}${equippedStatus} - ${item.description}`;
  }).join("\n");
  
  return message.reply(lang("inventory", inventoryList));
}

function equipItem({ message, args, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  if (!playerData.inventory || playerData.inventory.length === 0) {
    return message.reply(lang("emptyInventory"));
  }
  
  const itemName = args.slice(1).join(" ");
  if (!itemName) {
    return message.reply(lang("invalidItem"));
  }
  
  // Find the item in inventory
  const itemIndex = playerData.inventory.findIndex(
    i => i.name.toLowerCase() === itemName.toLowerCase()
  );
  
  if (itemIndex === -1) {
    return message.reply(lang("invalidItem"));
  }
  
  const item = playerData.inventory[itemIndex];
  
  // Unequip any current items of the same type
  playerData.inventory.forEach(i => {
    if (i.type === item.type && i.equipped) {
      i.equipped = false;
      // Remove old stats
      if (i.effect.attack) playerData.attack -= i.effect.attack;
      if (i.effect.defense) playerData.defense -= i.effect.defense;
      if (i.effect.magic) playerData.magic -= i.effect.magic;
      if (i.effect.speed) playerData.speed -= i.effect.speed;
    }
  });
  
  // Equip the new item
  item.equipped = true;
  
  // Apply stats
  if (item.effect.attack) playerData.attack += item.effect.attack;
  if (item.effect.defense) playerData.defense += item.effect.defense;
  if (item.effect.magic) playerData.magic += item.effect.magic;
  if (item.effect.speed) playerData.speed += item.effect.speed;
  
  saveRPGData();
  
  return message.reply(lang("itemEquipped", item.name));
}

function useItem({ message, args, senderID, lang }) {
  const playerData = global.rpgData.players[senderID];
  
  if (!playerData) {
    return message.reply(lang("noCharacter"));
  }
  
  if (!playerData.inventory || playerData.inventory.length === 0) {
    return message.reply(lang("emptyInventory"));
  }
  
  const itemName = args.slice(1).join(" ");
  if (!itemName) {
    return message.reply(lang("invalidItem"));
  }
  
  // Find the item in inventory
  const itemIndex = playerData.inventory.findIndex(
    i => i.name.toLowerCase() === itemName.toLowerCase() && i.type === "consumable"
  );
  
  if (itemIndex === -1) {
    return message.reply(lang("invalidItem"));
  }
  
  const item = playerData.inventory[itemIndex];
  
  // Apply consumable effects
  let effectMessage = "";
  
  if (item.effect.hp) {
    const healAmount = item.effect.hp;
    playerData.hp = Math.min(playerData.maxHp, playerData.hp + healAmount);
    effectMessage = `Restored ${healAmount} HP. Current HP: ${playerData.hp}/${playerData.maxHp}`;
  } else if (item.effect.xp) {
    playerData.xp += item.effect.xp;
    effectMessage = `Gained ${item.effect.xp} XP. Current XP: ${playerData.xp}/${XP_TO_LEVEL_UP(playerData.level)}`;
  }
  
  // Remove the item from inventory
  playerData.inventory.splice(itemIndex, 1);
  
  saveRPGData();
  
  return message.reply(lang("itemUsed", item.name, effectMessage));
}

module.exports = {
  showShop,
  buyItem,
  showInventory,
  equipItem,
  useItem
}; 