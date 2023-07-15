module.exports = {
  config: {
    name: "morse",
    author: "JV Barcenas",
    version: '1.0',
    role: 0,
    category: 'utility'
  },
  onStart: async function ({ api, event, args, usersData, threadsData }) {
    const morseCodeMap = {
      A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
      H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
      O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
      V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
      0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
      6: "-....", 7: "--...", 8: "---..", 9: "----."
    };

    const message = args.map(word => {
      const morseWord = [...word.toUpperCase()].map(char => {
        if (morseCodeMap.hasOwnProperty(char)) {
          return morseCodeMap[char];
        }
        return char;
      });
      return morseWord.join(" ");
    }).join(" / ");

    api.sendMessage(message, event.threadID);
  }
};
