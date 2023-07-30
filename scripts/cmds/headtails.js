module.exports = {
  config: {
    name: "ht",
    version: "1.0",
    author: "JV Barcenas",
    countDown: 13,
    shortDescription: {
      en: "Heads or Tails game",
    },
    longDescription: {
      en: "Heads or Tails game.",
    },
    category: "Games",
  },
  langs: {
    en: {
      invalid_choice: "Invalid choice! Use `head` or `tail` as your choice.",
      invalid_amount: "Enter a valid and positive amount to bet (maximum 9,999,999).",
      not_enough_money: "Check your balance if you have that amount.",
      flip_message: "Flipping the coin...",
      win_message: "Congratulations! You won $%1, bruh!",
      lose_message: "You lost $%1, stoopid.",
      flip_landed_on: "It landed on %1!",
    },
  },
  onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);

    // Check if the user entered a valid choice ('head' or 'tail')
    const choice = args[0]?.toLowerCase();
    if (!["head", "tail"].includes(choice)) {
      return message.reply(getLang("invalid_choice"));
    }

    // Check if the user entered a valid and positive amount as the bet
    const betAmount = parseInt(args[1]);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > 9999999) {
      return message.reply(getLang("invalid_amount"));
    }

    // Check if the user has enough money to place the bet
    if (betAmount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const isHead = Math.random() < 0.5; // 50% chance of getting head
    const result = isHead ? "head" : "tail";

    const winnings = calculateWinnings(choice, result, betAmount);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    const messageText = getFlipResultMessage(result, winnings, getLang);

    return message.reply(messageText);
  },
};

function calculateWinnings(choice, result, betAmount) {
  if (choice === result) {
    return betAmount * 2; // Double the bet amount if the choice matches the result
  } else {
    return -betAmount; // Lose the bet amount if the choice does not match the result
  }
}

function getFlipResultMessage(result, winnings, getLang) {
  const landedOnMessage = getLang("flip_landed_on", result);

  if (winnings > 0) {
    return getLang("win_message", winnings) + ` ${landedOnMessage}`;
  } else {
    return getLang("lose_message", -winnings) + ` ${landedOnMessage}`;
  }
}
