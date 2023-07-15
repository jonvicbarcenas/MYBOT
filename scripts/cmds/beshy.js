module.exports = {
  config: {
    name: "beshy",
    author: "Junmar",
    version: '1.0',
    author: 'jun',
    role: 0,
    category: 'utility'
  },
  onStart: async function ({ api, event, args, usersData, threadsData }) {
    const message = args.map(word => word + '🤸‍♂️').join(' ');
    api.sendMessage(message, event.threadID);
  }
};