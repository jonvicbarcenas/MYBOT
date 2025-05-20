const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ASCII art for hangman stages
const hangmanStages = [
  `
  +---+
  |   |
      |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
];

// Word categories
const wordCategories = {
  animals: ["elephant", "giraffe", "penguin", "dolphin", "kangaroo", "tiger", "lion", "zebra", "monkey", "koala"],
  fruits: ["apple", "banana", "orange", "strawberry", "watermelon", "pineapple", "mango", "grape", "kiwi", "cherry"],
  countries: ["canada", "japan", "brazil", "australia", "france", "germany", "spain", "egypt", "india", "thailand"],
  colors: ["red", "blue", "green", "yellow", "purple", "orange", "black", "white", "pink", "brown"],
  movies: ["avatar", "inception", "titanic", "frozen", "avengers", "joker", "matrix", "parasite", "gladiator", "jaws"]
};

module.exports = {
  config: {
    name: "hangman",
    aliases: ["hmgame"],
    version: "1.0",
    author: "JVSanecrab",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Play Hangman game"
    },
    longDescription: {
      en: "Play the classic Hangman word guessing game with different categories"
    },
    category: "games",
    guide: {
      en: "Use the following commands:\n/hangman start [category]: Start a new game (optional categories: animals, fruits, countries, colors, movies)\n/hangman guess [letter]: Guess a letter\n/hangman word [word]: Make a full word guess"
    },
    envConfig: {
      reward: 50 // Base reward amount
    }
  },

  langs: {
    en: {
      started: "🎮 Hangman game has started!\nCategory: %1\nGuess the word by replying with '/hangman guess [letter]' or '/hangman word [full_word]'",
      alreadyStarted: "⚠️ There's already a hangman game in progress in this thread!",
      invalidCategory: "⚠️ Invalid category! Available categories: animals, fruits, countries, colors, movies",
      gameStatus: "%1\n\nWord: %2\nGuessed letters: %3\nLives remaining: %4\nCategory: %5",
      invalidGuess: "⚠️ Please guess a single letter only!",
      alreadyGuessed: "⚠️ You've already guessed the letter '%1'",
      correctGuess: "✅ Good guess! The letter '%1' is in the word!",
      wrongGuess: "❌ Sorry, the letter '%1' is not in the word!",
      win: "🎉 Congratulations! You guessed the word '%1'!\nYou've earned %2$",
      lose: "😢 Game over! The word was '%1'\nBetter luck next time!",
      wordGuessCorrect: "🎉 Amazing! You guessed the whole word '%1' correctly!\nYou've earned %2$",
      wordGuessWrong: "❌ Sorry, '%1' is not the correct word!",
      noGame: "⚠️ There's no active hangman game in this thread. Start one with '/hangman start'",
      invalidCommand: "⚠️ Invalid command. Use '/hangman start', '/hangman guess [letter]', or '/hangman word [word]'"
    }
  },

  onStart: async function ({ message, event, args, commandName, getLang, usersData, envCommands }) {
    const threadID = event.threadID;
    
    // Create global games object if it doesn't exist
    if (!global.hangmanGames) {
      global.hangmanGames = {};
    }
    
    const command = args[0]?.toLowerCase();
    
    switch (command) {
      case "start": {
        // Check if there's already a game in this thread
        if (global.hangmanGames[threadID]) {
          return message.reply(getLang("alreadyStarted"));
        }
        
        // Select category
        let category = args[1]?.toLowerCase() || getRandomCategory();
        if (!wordCategories[category]) {
          if (args[1]) {
            return message.reply(getLang("invalidCategory"));
          }
          category = getRandomCategory();
        }
        
        // Select random word from category
        const word = getRandomWord(category);
        
        // Initialize game state
        const gameState = {
          word: word,
          category: category,
          hiddenWord: "_ ".repeat(word.length).trim(),
          guessedLetters: [],
          wrongGuesses: 0,
          startTime: Date.now()
        };
        
        global.hangmanGames[threadID] = gameState;
        
        // Send initial game message
        return message.reply(
          getLang("started", category) + "\n\n" + 
          getLang("gameStatus", 
            hangmanStages[0],
            gameState.hiddenWord,
            "None",
            6 - gameState.wrongGuesses,
            gameState.category
          )
        );
      }
      
      case "guess": {
        // Check if there's a game in progress
        const gameState = global.hangmanGames[threadID];
        if (!gameState) {
          return message.reply(getLang("noGame"));
        }
        
        // Get the guessed letter
        const letter = args[1]?.toLowerCase();
        if (!letter || letter.length !== 1 || !letter.match(/[a-z]/i)) {
          return message.reply(getLang("invalidGuess"));
        }
        
        // Check if letter was already guessed
        if (gameState.guessedLetters.includes(letter)) {
          return message.reply(getLang("alreadyGuessed", letter));
        }
        
        // Add to guessed letters
        gameState.guessedLetters.push(letter);
        
        // Check if guess is correct
        let correctGuess = false;
        let newHiddenWord = "";
        
        for (let i = 0; i < gameState.word.length; i++) {
          if (gameState.word[i] === letter) {
            correctGuess = true;
            newHiddenWord += letter + " ";
          } else {
            newHiddenWord += gameState.hiddenWord.split(" ")[i] + " ";
          }
        }
        
        // Update game state
        if (correctGuess) {
          gameState.hiddenWord = newHiddenWord.trim();
          message.reply(getLang("correctGuess", letter));
        } else {
          gameState.wrongGuesses++;
          message.reply(getLang("wrongGuess", letter));
        }
        
        // Check win condition
        if (!gameState.hiddenWord.includes("_")) {
          // Calculate reward based on wrong guesses and time
          const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - gameState.startTime) / 1000));
          const wrongGuessesMultiplier = (6 - gameState.wrongGuesses) / 6;
          const reward = Math.round(envCommands.hangman.reward * (1 + timeBonus/100) * wrongGuessesMultiplier);
          
          // Add reward to user's balance
          await usersData.addMoney(event.senderID, reward);
          
          // Delete game state and send win message
          delete global.hangmanGames[threadID];
          return message.reply(getLang("win", gameState.word, reward));
        }
        
        // Check lose condition
        if (gameState.wrongGuesses >= 6) {
          // Delete game state and send lose message
          delete global.hangmanGames[threadID];
          return message.reply(
            getLang("gameStatus",
              hangmanStages[6],
              gameState.hiddenWord,
              gameState.guessedLetters.join(", "),
              0,
              gameState.category
            ) + "\n\n" + getLang("lose", gameState.word)
          );
        }
        
        // Send updated game status
        return message.reply(
          getLang("gameStatus",
            hangmanStages[gameState.wrongGuesses],
            gameState.hiddenWord,
            gameState.guessedLetters.join(", "),
            6 - gameState.wrongGuesses,
            gameState.category
          )
        );
      }
      
      case "word": {
        // Check if there's a game in progress
        const gameState = global.hangmanGames[threadID];
        if (!gameState) {
          return message.reply(getLang("noGame"));
        }
        
        // Get the guessed word
        const guessedWord = args[1]?.toLowerCase();
        if (!guessedWord) {
          return message.reply(getLang("invalidGuess"));
        }
        
        // Check if word guess is correct
        if (guessedWord === gameState.word) {
          // Calculate reward based on wrong guesses and time
          const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - gameState.startTime) / 1000));
          const wrongGuessesMultiplier = (6 - gameState.wrongGuesses) / 6;
          // Extra bonus for guessing the whole word
          const wordGuessBonus = 1.5;
          const reward = Math.round(envCommands.hangman.reward * (1 + timeBonus/100) * wrongGuessesMultiplier * wordGuessBonus);
          
          // Add reward to user's balance
          await usersData.addMoney(event.senderID, reward);
          
          // Delete game state and send win message
          delete global.hangmanGames[threadID];
          return message.reply(getLang("wordGuessCorrect", gameState.word, reward));
        } else {
          // Penalize wrong word guess with an extra wrong guess
          gameState.wrongGuesses++;
          message.reply(getLang("wordGuessWrong", guessedWord));
          
          // Check lose condition
          if (gameState.wrongGuesses >= 6) {
            // Delete game state and send lose message
            delete global.hangmanGames[threadID];
            return message.reply(
              getLang("gameStatus",
                hangmanStages[6],
                gameState.hiddenWord,
                gameState.guessedLetters.join(", "),
                0,
                gameState.category
              ) + "\n\n" + getLang("lose", gameState.word)
            );
          }
          
          // Send updated game status
          return message.reply(
            getLang("gameStatus",
              hangmanStages[gameState.wrongGuesses],
              gameState.hiddenWord,
              gameState.guessedLetters.join(", "),
              6 - gameState.wrongGuesses,
              gameState.category
            )
          );
        }
      }
      
      default:
        return message.reply(getLang("invalidCommand"));
    }
  }
};

function getRandomCategory() {
  const categories = Object.keys(wordCategories);
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomWord(category) {
  const words = wordCategories[category];
  return words[Math.floor(Math.random() * words.length)];
}