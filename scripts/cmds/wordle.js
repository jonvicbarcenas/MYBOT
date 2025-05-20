const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require('canvas');
const { randomString, getTime, convertTime } = global.utils;

// Word list for the game
const wordList = [
  "apple", "beach", "cloud", "dance", "earth", "flame", "ghost", "heart", "image", "jolly",
  "knight", "lemon", "music", "night", "ocean", "piano", "queen", "royal", "smile", "tiger",
  "uncle", "voice", "water", "xerox", "youth", "zebra", "brave", "crisp", "dream", "frost",
  "grape", "happy", "index", "jumbo", "knife", "light", "metal", "novel", "olive", "panel",
  "quilt", "river", "solar", "table", "urban", "vapor", "wagon", "xenon", "yacht", "zesty"
];

// Emoji representations
const CORRECT_POSITION = "🟩"; // Green - correct letter in correct position
const CORRECT_LETTER = "🟨";   // Yellow - correct letter in wrong position
const WRONG_LETTER = "⬛";     // Black - letter not in the word

module.exports = {
  config: {
    name: "wordle",
    aliases: ["word-game"],
    version: "1.0",
    author: "JVSanecrab",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Play the Wordle game"
    },
    longDescription: {
      en: "Guess the hidden 5-letter word within 6 attempts. After each guess, you'll get feedback on which letters are in the correct position (🟩), which are in the word but wrong position (🟨), and which are not in the word (⬛)."
    },
    category: "games",
    guide: {
      en: "{pn}: Start a new Wordle game and make guesses by replying to the image"
    },
    envConfig: {
      reward: 100 // Base reward amount
    }
  },

  langs: {
    en: {
      started: "🎮 Wordle game has started! You have 6 attempts to guess the 5-letter word.",
      alreadyStarted: "⚠️ There's already a Wordle game in progress in this thread!",
      invalidGuess: "⚠️ Please enter a valid 5-letter word for your guess.",
      win: "🎉 Congratulations! You guessed the word '%1' in %2 attempts!\nYou've earned %3$",
      lose: "😢 Game over! The word was '%1'.\nBetter luck next time!",
      notPlayer: "You are not the player of this game.",
      replyToPlayGame: "Reply to this message with a 5-letter word to make your guess.",
      charts: "🏆 | Wordle Ranking:\n%1",
      pageInfo: "Page %1/%2",
      noScore: "⭕ | There is no one who has scored.",
      resetRankSuccess: "✅ | Reset the ranking successfully.",
      noPermissionReset: "⚠️ | You do not have permission to reset the ranking.",
      notFoundUser: "⚠️ | Could not find user with id %1 in the ranking.",
      userRankInfo: "🏆 | Ranking information:\nName: %1\nScore: %2\nGames played: %3\nWins: %4\nLosses: %5\nWin rate: %6%\nAverage attempts: %7\nBest attempt: %8\nTotal play time: %9",
    }
  },

  onStart: async function ({ message, event, args, commandName, getLang, globalData, usersData, role }) {
    if (args[0] == "rank") {
      const rankWordle = await globalData.get("rankWordle", "data", []);
      if (!rankWordle.length)
        return message.reply(getLang("noScore"));

      const page = parseInt(args[1]) || 1;
      const maxUserOnePage = 15;

      let rankWordleHandle = await Promise.all(rankWordle.slice((page - 1) * maxUserOnePage, page * maxUserOnePage).map(async item => {
        const userName = await usersData.getName(item.id);
        return {
          ...item,
          userName
        };
      }));

      rankWordleHandle = rankWordleHandle.sort((a, b) => b.wins - a.wins);
      const medals = ["🥇", "🥈", "🥉"];
      const rankWordleText = rankWordleHandle.map((item, index) => {
        const medal = index < 3 ? medals[index] : `${index + 1}.`;
        const winRate = item.totalGames > 0 ? ((item.wins / item.totalGames) * 100).toFixed(1) : 0;
        return `${medal} ${item.userName} - ${item.wins} wins (${winRate}%)`;
      }).join("\n");

      return message.reply(getLang("charts", rankWordleText || getLang("noScore")) + "\n" + getLang("pageInfo", page, Math.ceil(rankWordle.length / maxUserOnePage)));
    }
    else if (args[0] == "info") {
      const rankWordle = await globalData.get("rankWordle", "data", []);
      let targetID;
      if (Object.keys(event.mentions).length)
        targetID = Object.keys(event.mentions)[0];
      else if (event.messageReply)
        targetID = event.messageReply.senderID;
      else if (!isNaN(args[1]))
        targetID = args[1];
      else
        targetID = event.senderID;

      const userDataWordle = rankWordle.find(item => item.id == targetID);
      if (!userDataWordle)
        return message.reply(getLang("notFoundUser", targetID));

      const userName = await usersData.getName(targetID);
      const totalGames = userDataWordle.totalGames || 0;
      const wins = userDataWordle.wins || 0;
      const losses = userDataWordle.losses || 0;
      const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
      const avgAttempts = userDataWordle.totalAttempts > 0 ? (userDataWordle.totalAttempts / wins).toFixed(1) : 0;
      const bestAttempt = userDataWordle.bestAttempt || "N/A";
      const points = userDataWordle.points || 0;
      const playTime = convertTime(userDataWordle.totalPlayTime || 0);

      return message.reply(getLang("userRankInfo", userName, points, totalGames, wins, losses, winRate, avgAttempts, bestAttempt, playTime));
    }
    else if (args[0] == "reset") {
      if (role < 2)
        return message.reply(getLang("noPermissionReset"));
      await globalData.set("rankWordle", [], "data");
      return message.reply(getLang("resetRankSuccess"));
    }

    const threadID = event.threadID;
    
    // Create global games object if it doesn't exist
    if (!global.wordleGames) {
      global.wordleGames = {};
    }
    
    // Check if there's already a game in this thread
    if (global.wordleGames[threadID]) {
      return message.reply(getLang("alreadyStarted"));
    }
    
    // Select a random word from the word list
    const secretWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    // Initialize game state
    const gameData = {
      secretWord: secretWord,
      attempts: 0,
      maxAttempts: 6,
      guesses: [],
      guessResults: [],
      timeStart: parseInt(getTime("x")),
      letters: {}, // Track used letters and their status
      isWin: null
    };
    
    // Create the initial game board
    const wordleBoard = createWordleBoard(gameData);
    
    // Send the game start message
    message.reply(`${getLang("started")}\n\n${getLang("replyToPlayGame")}`, (err, info) => {
      if (err) return console.error(err);
      
      // Store the game data
      global.wordleGames[threadID] = gameData;
      
      // Send the game board
      message.reply({
        attachment: wordleBoard.imageStream
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          gameData
        });
      });
    });
  },

  onReply: async function ({ message, Reply, event, getLang, globalData, usersData, envCommands, commandName }) {
    const { gameData: oldGameData, author } = Reply;
    
    // Check if the person replying is the game creator
    if (event.senderID !== author) {
      return message.reply(getLang("notPlayer"));
    }
    
    global.GoatBot.onReply.delete(Reply.messageID);
    
    // Get the guess from the reply
    const guess = event.body.toLowerCase().trim();
    
    // Validate the guess
    if (!guess || guess.length !== 5 || !/^[a-z]+$/.test(guess)) {
      return message.reply(getLang("invalidGuess"));
    }
    
    // Update game data with the new guess
    oldGameData.attempts++;
    oldGameData.guesses.push(guess);
    
    // Process the guess and get the result
    const result = checkGuess(guess, oldGameData.secretWord);
    oldGameData.guessResults.push(result);
    
    // Update the letters used
    updateLetterStatus(oldGameData, guess, result);
    
    // Check for win condition
    if (guess === oldGameData.secretWord) {
      oldGameData.isWin = true;
    } 
    // Check for lose condition
    else if (oldGameData.attempts >= oldGameData.maxAttempts) {
      oldGameData.isWin = false;
    }
    
    // Create updated game board
    const wordleBoard = createWordleBoard(oldGameData);
    
    if (oldGameData.isWin !== null) {
      // Game is over (win or lose)
      const timePlayed = parseInt(getTime("x")) - oldGameData.timeStart;
      
      // Get or initialize the rankings data
      const rankWordle = await globalData.get("rankWordle", "data", []);
      const userIndex = rankWordle.findIndex(item => item.id == event.senderID);
      
      let reward = 0;
      
      if (oldGameData.isWin) {
        // Calculate reward based on attempts and time
        const attemptsMultiplier = (oldGameData.maxAttempts - oldGameData.attempts + 1) / oldGameData.maxAttempts;
        const timeBonus = Math.max(0, 300 - Math.floor(timePlayed / 1000));
        reward = Math.round(envCommands.wordle.reward * (1 + timeBonus/300) * attemptsMultiplier);
        
        // Add reward to user's balance
        await usersData.addMoney(event.senderID, reward);
      }
      
      // Update the rankings
      if (userIndex === -1) {
        // New user
        rankWordle.push({
          id: event.senderID,
          points: reward,
          totalGames: 1,
          wins: oldGameData.isWin ? 1 : 0,
          losses: oldGameData.isWin ? 0 : 1,
          totalAttempts: oldGameData.isWin ? oldGameData.attempts : 0,
          bestAttempt: oldGameData.isWin ? oldGameData.attempts : null,
          totalPlayTime: timePlayed
        });
      } else {
        // Existing user
        const userData = rankWordle[userIndex];
        userData.points += reward;
        userData.totalGames++;
        
        if (oldGameData.isWin) {
          userData.wins++;
          userData.totalAttempts = (userData.totalAttempts || 0) + oldGameData.attempts;
          userData.bestAttempt = userData.bestAttempt ? Math.min(userData.bestAttempt, oldGameData.attempts) : oldGameData.attempts;
        } else {
          userData.losses++;
        }
        
        userData.totalPlayTime = (userData.totalPlayTime || 0) + timePlayed;
      }
      
      await globalData.set("rankWordle", rankWordle, "data");
      
      // Delete the game
      delete global.wordleGames[event.threadID];
      
      // Send final message with game result and board
      const responseMessage = oldGameData.isWin 
        ? getLang("win", oldGameData.secretWord, oldGameData.attempts, reward)
        : getLang("lose", oldGameData.secretWord);
      
      return message.reply({
        body: responseMessage,
        attachment: wordleBoard.imageStream
      });
    } else {
      // Game continues
      message.reply({
        attachment: wordleBoard.imageStream
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          gameData: oldGameData
        });
      });
    }
  }
};

// Function to check the guess against the secret word
function checkGuess(guess, secretWord) {
  let result = "";
  let secretLetters = secretWord.split("");
  
  // First pass: check for correct positions
  const checkArray = new Array(5).fill(0); // 0 = not checked, 1 = correct, 2 = present
  
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretWord[i]) {
      result += CORRECT_POSITION;
      checkArray[i] = 1;
      // Remove the letter from consideration for yellow matches
      secretLetters[i] = null;
    }
  }
  
  // Second pass: check for correct letters in wrong positions
  for (let i = 0; i < 5; i++) {
    if (checkArray[i] === 1) continue; // Skip already matched positions
    
    const letterIndex = secretLetters.indexOf(guess[i]);
    if (letterIndex !== -1) {
      result += CORRECT_LETTER;
      // Remove the letter from consideration for future matches
      secretLetters[letterIndex] = null;
    } else {
      result += WRONG_LETTER;
    }
  }
  
  return result;
}

// Update the status of each letter for the keyboard display
function updateLetterStatus(gameData, guess, result) {
  if (!gameData.letters) {
    gameData.letters = {};
  }
  
  const resultArray = result.split('');
  
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];
    const currentStatus = resultArray[i];
    
    // Only update if the letter doesn't have a status yet or if the new status is better
    // Priority: 🟩 (correct) > 🟨 (present) > ⬛ (absent)
    if (!gameData.letters[letter] || 
        (gameData.letters[letter] === WRONG_LETTER && (currentStatus === CORRECT_LETTER || currentStatus === CORRECT_POSITION)) ||
        (gameData.letters[letter] === CORRECT_LETTER && currentStatus === CORRECT_POSITION)) {
      gameData.letters[letter] = currentStatus;
    }
  }
}

function createWordleBoard(gameData) {
  const { guesses, guessResults, attempts, maxAttempts, letters, isWin } = gameData;
  
  // Canvas settings
  const cellSize = 60;
  const cellMargin = 5;
  const boardPadding = 20;
  const headerHeight = 60;
  const footerHeight = 90;
  const keyboardHeight = 150;
  const keySize = 40;
  const keyMargin = 5;
  const boardWidth = cellSize * 5 + cellMargin * 4 + boardPadding * 2;
  const boardHeight = headerHeight + (cellSize * 6 + cellMargin * 5) + footerHeight + keyboardHeight;
  const canvas = createCanvas(boardWidth, boardHeight);
  const ctx = canvas.getContext('2d');
  
  // Colors
  const backgroundColor = '#121213';
  const headerTextColor = '#FFFFFF';
  const borderColor = '#3A3A3C';
  const textColor = '#FFFFFF';
  const correctPositionColor = '#538D4E';
  const correctLetterColor = '#B59F3B';
  const wrongLetterColor = '#3A3A3C';
  const unusedColor = '#818384';
  const resultTextColor = '#FFFFFF';
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, boardWidth, boardHeight);
  
  // Draw header
  ctx.fillStyle = headerTextColor;
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WORDLE', boardWidth / 2, headerHeight / 2 + 10);
  
  // Draw attempts left
  ctx.font = '16px Arial';
  ctx.fillText(`Attempts: ${attempts}/${maxAttempts}`, boardWidth / 2, headerHeight - 10);
  
  // Draw the grid
  for (let row = 0; row < maxAttempts; row++) {
    for (let col = 0; col < 5; col++) {
      const x = boardPadding + col * (cellSize + cellMargin);
      const y = headerHeight + row * (cellSize + cellMargin);
      
      // Set cell color based on the guess result
      if (row < guesses.length) {
        const resultChar = guessResults[row][col];
        
        switch (resultChar) {
          case CORRECT_POSITION:
            ctx.fillStyle = correctPositionColor;
            break;
          case CORRECT_LETTER:
            ctx.fillStyle = correctLetterColor;
            break;
          default:
            ctx.fillStyle = wrongLetterColor;
        }
      } else {
        ctx.fillStyle = borderColor;
      }
      
      // Draw cell
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Draw letter if the cell has been guessed
      if (row < guesses.length) {
        const letter = guesses[row][col].toUpperCase();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
  
  // Draw keyboard (QWERTY layout)
  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];
  
  let keyboardY = headerHeight + (cellSize * 6 + cellMargin * 5) + 30;
  
  ctx.font = 'bold 16px Arial';
  ctx.textBaseline = 'middle';
  
  for (let rowIndex = 0; rowIndex < keyboardRows.length; rowIndex++) {
    const row = keyboardRows[rowIndex];
    const rowWidth = row.length * (keySize + keyMargin) - keyMargin;
    let keyboardX = (boardWidth - rowWidth) / 2;
    
    for (let col = 0; col < row.length; col++) {
      const letter = row[col];
      
      // Set key color based on letter status
      if (letters && letters[letter]) {
        const status = letters[letter];
        switch (status) {
          case CORRECT_POSITION:
            ctx.fillStyle = correctPositionColor;
            break;
          case CORRECT_LETTER:
            ctx.fillStyle = correctLetterColor;
            break;
          case WRONG_LETTER:
            ctx.fillStyle = wrongLetterColor;
            break;
          default:
            ctx.fillStyle = unusedColor;
        }
      } else {
        ctx.fillStyle = unusedColor;
      }
      
      // Draw key
      ctx.fillRect(keyboardX, keyboardY, keySize, keySize);
      
      // Draw letter
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(letter.toUpperCase(), keyboardX + keySize / 2, keyboardY + keySize / 2);
      
      keyboardX += keySize + keyMargin;
    }
    
    keyboardY += keySize + keyMargin;
  }
  
  // Draw game result if game is over
  if (isWin !== null) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, headerHeight, boardWidth, headerHeight + (cellSize * 6 + cellMargin * 5));
    
    ctx.fillStyle = resultTextColor;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const resultY = headerHeight + (cellSize * 6 + cellMargin * 5) / 2;
    
    if (isWin) {
      ctx.fillText('YOU WIN!', boardWidth / 2, resultY - 30);
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`The word was: ${gameData.secretWord.toUpperCase()}`, boardWidth / 2, resultY + 20);
    } else {
      ctx.fillText('GAME OVER', boardWidth / 2, resultY - 30);
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`The word was: ${gameData.secretWord.toUpperCase()}`, boardWidth / 2, resultY + 20);
    }
  }
  
  // Create image stream
  const imageStream = canvas.createPNGStream();
  imageStream.path = `wordle_${Date.now()}.png`;
  
  return {
    imageStream
  };
} 