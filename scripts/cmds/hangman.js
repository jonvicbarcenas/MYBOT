// Hangman Command
module.exports = {
  config: {
    name: "hangman",
    description: "Play a game of Hangman.",
    category: "games",
  },
  onStart: async function ({ api, event }) {
    const wordList = ["apple", "banana", "chocolate", "developer", "elephant"];
    const selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
    const maxAttempts = 6; // You can adjust the number of allowed attempts.

    let guessedWord = "_".repeat(selectedWord.length);
    let incorrectGuesses = 0;

    const hangmanMessage = `Hangman Game\Word: ${guessedWord}\Attempts Left: ${maxAttempts - incorrectGuesses}`;

    await api.sendMessage(hangmanMessage, event.threadID);

    const alphabetRegex = /^[a-zA-Z]$/;

    api.listenMentions(async (message) => {
      const guess = message.body.trim().toLowerCase();

      if (!alphabetRegex.test(guess) || guess.length !== 1) {
        await api.sendMessage("Please guess a single letter.", event.threadID);
        return;
      }

      if (selectedWord.includes(guess)) {
        for (let i = 0; i < selectedWord.length; i++) {
          if (selectedWord[i] === guess) {
            guessedWord = guessedWord.substring(0, i) + guess + guessedWord.substring(i + 1);
          }
        }

        if (guessedWord === selectedWord) {
          await api.sendMessage(`Congratulations! You guessed the word: ${selectedWord}`, event.threadID);
          api.removeAllListeners("message");
        } else {
          await api.sendMessage(`Correct guess!\Word: ${guessedWord}\Attempts Left: ${maxAttempts - incorrectGuesses}`, event.threadID);
        }
      } else {
        incorrectGuesses++;
        await api.sendMessage(`Incorrect guess. Attempts Left: ${maxAttempts - incorrectGuesses}`, event.threadID);
        if (incorrectGuesses >= maxAttempts) {
          await api.sendMessage(`Game over! The word was: ${selectedWord}`, event.threadID);
          api.removeAllListeners("message");
        }
      }
    });
  },
};