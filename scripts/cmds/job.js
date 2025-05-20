const moment = require("moment-timezone");
const fs = require("fs");

module.exports = {
  config: {
    name: "job",
    version: "2.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Làm công việc",
      en: "Work various jobs to earn money"
    },
    longDescription: {
      vi: "Làm công việc",
      en: "Choose from a variety of jobs to earn money based on your skills"
    },
    category: "games",
    guide: {
      vi: "   {pn}: Làm công việc",
      en: "   {pn}: View available jobs\n   {pn} <job number>: Choose a specific job\n   {pn} list: Show list of available jobs"
    },
    envConfig: {
      rewardFirstDay: {
        coin: 100,
        exp: 10
      }
    }
  },

  langs: {
    vi: {
      monday: "Thứ 2",
      tuesday: "Thứ 3",
      wednesday: "Thứ 4",
      thursday: "Thứ 5",
      friday: "Thứ 6",
      saturday: "Thứ 7",
      sunday: "Chủ nhật",
      alreadyReceived: "Bạn đã nhận quà rồi",
      received: "Bạn đã nhận được %1 coin và %2 exp",
      jobCompleted: "Chúc mừng! Bạn đã kiếm được $%1 từ công việc của mình.",
      alreadyJobCompleted: "Bạn đã hoàn thành công việc hôm nay. Hãy quay lại vào ngày mai!",
      jobList: "📋 Danh sách công việc:\n%1",
      chooseJob: "Vui lòng chọn một công việc bằng cách trả lời số tương ứng:",
      invalidJob: "Lựa chọn không hợp lệ! Vui lòng chọn một số từ danh sách.",
      jobInstructions: "%1\n\nLàm theo hướng dẫn để hoàn thành công việc và nhận phần thưởng."
    },
    en: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      alreadyReceived: "You've already received a reward today",
      received: "You have received %1 coins and %2 exp",
      jobCompleted: "💰 Great work! You earned $%1 from your job!",
      alreadyJobCompleted: "You've already completed a job today. Come back tomorrow for more work!",
      jobList: "📋 Available Jobs:\n%1",
      chooseJob: "Please choose a job by replying with the corresponding number:",
      invalidJob: "Invalid choice! Please choose a number from the list.",
      jobInstructions: "%1\n\nFollow the instructions to complete the job and receive your reward."
    }
  },

  // Job definitions with varying difficulty and rewards
  jobs: [
    {
      name: "Office Assistant",
      description: "Help organize files by identifying the admin names in correct order.",
      instructions: "Reply with the admin names in alphabetical order, separated by commas. Format: 'Admins: name1, name2, etc'",
      difficulty: "Easy",
      reward: 200,
      validator: function(input, adminNames) {
        const formattedInput = input.toLowerCase();
        if (!formattedInput.startsWith("admins:")) return false;
        
        const sortedAdmins = Object.keys(adminNames).sort().join(", ");
        const userAnswer = formattedInput.replace("admins:", "").trim();
        
        return userAnswer === sortedAdmins;
      }
    },
    {
      name: "Social Media Manager",
      description: "Create a catchy phrase about the admins.",
      instructions: "Reply with a short creative phrase that includes 'gwapo' and at least three admin names.",
      difficulty: "Medium",
      reward: 300,
      validator: function(input, adminNames) {
        const formattedInput = input.toLowerCase();
        
        // Check if 'gwapo' is mentioned
        if (!formattedInput.includes("gwapo")) return false;
        
        // Count how many admin names are mentioned
        let adminCount = 0;
        for (const admin of Object.keys(adminNames)) {
          if (formattedInput.includes(admin)) adminCount++;
        }
        
        return adminCount >= 3;
      }
    },
    {
      name: "Math Tutor",
      description: "Solve a basic math problem involving admin counting.",
      instructions: "If Jv has 3 candies, Ghelo has 5 candies, and Regiel has 2 candies, how many candies do they have in total? Reply with: 'Total: X candies'",
      difficulty: "Medium",
      reward: 350,
      validator: function(input) {
        const formattedInput = input.toLowerCase().trim();
        return formattedInput === "total: 10 candies";
      }
    },
    {
      name: "Poet",
      description: "Write a short poem about the admin team.",
      instructions: "Write a 2-line poem that contains the words 'admin' and 'awesome' and mentions at least one admin name.",
      difficulty: "Hard",
      reward: 450,
      validator: function(input, adminNames) {
        const formattedInput = input.toLowerCase();
        
        // Count line breaks to ensure it's at least 2 lines
        const lineBreaks = (formattedInput.match(/\n/g) || []).length;
        if (lineBreaks < 1) return false;
        
        // Check required words
        if (!formattedInput.includes("admin") || !formattedInput.includes("awesome")) return false;
        
        // Check for at least one admin name
        for (const admin of Object.keys(adminNames)) {
          if (formattedInput.includes(admin)) return true;
        }
        
        return false;
      }
    },
    {
      name: "Special Bot Assistant",
      description: "Help the admins by showing your loyalty.",
      instructions: "Reply with 'Gwapo si [admin name]' where admin name is one from the list: jv, drylle, jhon carl, ghelo, regiel, rafael, rainlee",
      difficulty: "Easy",
      reward: 300,
      validator: function(input, adminNames) {
        const formattedInput = input.toLowerCase();
        
        for (const admin of Object.keys(adminNames)) {
          if (formattedInput.includes(`gwapo si ${admin}`)) {
            return true;
          }
        }
        
        return false;
      }
    }
  ],

  onStart: async function ({ message, event, args, usersData, commandName, getLang }) {
    const { senderID } = event;
    const specialUserID = "100007150668975"; // Special user ID
    const userData = await usersData.get(senderID);
    const lastJobDate = userData.data.lastJobDate;
    
    try {
      const bankData = JSON.parse(fs.readFileSync("bank.json"));

      // Special user handling
      if (senderID === specialUserID) {
        const specialReward = 500;
        if (bankData[specialUserID]) {
          bankData[specialUserID].bank += specialReward;
        } else {
          bankData[specialUserID] = {
            bank: specialReward,
            lastInterestClaimed: Date.now()
          };
        }
        fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
        return message.reply("✨ As the special user, you automatically receive $500 without having to work!");
      }

      // Check if user has already completed a job today
      if (lastJobDate && moment().isSame(lastJobDate, 'day')) {
        return message.reply(getLang("alreadyJobCompleted"));
      }

      // Show job list if requested
      if (args[0] === "list") {
        const jobList = this.jobs.map((job, index) => 
          `${index + 1}. ${job.name} (${job.difficulty}) - $${job.reward}`
        ).join("\n");
        
        return message.reply(getLang("jobList", jobList));
      }

      // If job number provided, start that job
      if (args[0] && !isNaN(args[0])) {
        const jobIndex = parseInt(args[0]) - 1;
        
        if (jobIndex >= 0 && jobIndex < this.jobs.length) {
          const selectedJob = this.jobs[jobIndex];
          const jobMessage = getLang("jobInstructions", 
            `👔 JOB: ${selectedJob.name} (${selectedJob.difficulty})\n💵 REWARD: $${selectedJob.reward}\n\n📝 TASK: ${selectedJob.description}\n\n${selectedJob.instructions}`
          );
          
          message.reply(jobMessage, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              jobIndex: jobIndex
            });
          });
          return;
        } else {
          return message.reply(getLang("invalidJob"));
        }
      }

      // If no arguments provided, show job selection menu
      const jobMenu = this.jobs.map((job, index) => 
        `${index + 1}. ${job.name} (${job.difficulty}) - $${job.reward}`
      ).join("\n");
      
      message.reply(getLang("chooseJob") + "\n\n" + jobMenu, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          selectingJob: true
        });
      });
      
    } catch (error) {
      console.error("Error in job command:", error);
      return message.reply("An error occurred while processing the job command. Please try again later.");
    }
  },

  onReply: async function ({ message, Reply, event, usersData, commandName, getLang }) {
    const { author, messageID, selectingJob, jobIndex } = Reply;
    if (event.senderID != author) return;
    
    try {
      const userData = await usersData.get(event.senderID);
      const lastJobDate = userData.data.lastJobDate;
      const bankData = JSON.parse(fs.readFileSync("bank.json"));

      // Double-check if user has already done a job today
      if (lastJobDate && moment().isSame(lastJobDate, 'day')) {
        global.GoatBot.onReply.delete(messageID);
        return message.reply(getLang("alreadyJobCompleted"));
      }

      // Admin names reference for validators
      const adminNames = {
        "rainlee": "Rainlee",                
        "jv": "Jv",
        "ghelo": "Ghelo",
        "jhon carl": "Jhon Carl",
        "rafael": "Rafael",
        "drylle": "Drylle",
        "regiel": "Regiel",
      };

      // If user is selecting a job
      if (selectingJob) {
        const choice = parseInt(event.body.trim());
        
        // Validate job selection
        if (isNaN(choice) || choice < 1 || choice > this.jobs.length) {
          return message.reply(getLang("invalidJob"));
        }
        
        global.GoatBot.onReply.delete(messageID);
        
        // Start the selected job
        const selectedJob = this.jobs[choice - 1];
        const jobMessage = getLang("jobInstructions", 
          `👔 JOB: ${selectedJob.name} (${selectedJob.difficulty})\n💵 REWARD: $${selectedJob.reward}\n\n📝 TASK: ${selectedJob.description}\n\n${selectedJob.instructions}`
        );
        
        message.reply(jobMessage, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            jobIndex: choice - 1
          });
        });
        return;
      }

      // If user is completing a job
      if (jobIndex !== undefined) {
        const selectedJob = this.jobs[jobIndex];
        const userInput = formatText(event.body);
        
        // Validate user's answer
        const isCorrect = selectedJob.validator(userInput, adminNames);
        
        global.GoatBot.onReply.delete(messageID);
        
        // Process job completion
        if (isCorrect) {
          // Update user's last job date
          userData.data.lastJobDate = moment().format("YYYY-MM-DD");
          await usersData.set(event.senderID, userData);
          
          // Add reward to user's bank account
          const userID = event.senderID.toString();
          const amountToAdd = selectedJob.reward;
          
          if (bankData[userID]) {
            bankData[userID].bank += amountToAdd;
          } else {
            bankData[userID] = {
              bank: amountToAdd,
              lastInterestClaimed: Date.now()
            };
          }
          
          // Save updated bank data
          fs.writeFileSync("bank.json", JSON.stringify(bankData, null, 2));
          
          // Random success messages for variety
          const successMessages = [
            `✅ ${selectedJob.name} completed successfully! You earned $${amountToAdd}!`,
            `💰 Great job! Your ${selectedJob.name} work earned you $${amountToAdd}!`,
            `🎉 Success! You completed the ${selectedJob.difficulty} job and earned $${amountToAdd}!`,
            `👏 Excellent work on the ${selectedJob.name}! $${amountToAdd} has been added to your bank account.`,
            `💼 Job well done! Your reward of $${amountToAdd} has been deposited to your account.`
          ];
          
          const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
          return message.reply(randomMessage);
        } else {
          // Random failure messages for incorrect answers
          const failureMessages = [
            "That doesn't seem right. Try reading the instructions again and submit a new job request.",
            "Hmm, that's not quite what we're looking for. Try another job or read the instructions carefully.",
            "Your answer doesn't match what we need. Please try again with a new job request.",
            "Oops! That's incorrect. You can try again by requesting a new job.",
            "Not quite right. Remember to follow the exact format required in the instructions."
          ];
          
          const randomFailure = failureMessages[Math.floor(Math.random() * failureMessages.length)];
          return message.reply(randomFailure);
        }
      }
    } catch (error) {
      console.error("Error in job reply handler:", error);
      global.GoatBot.onReply.delete(messageID);
      return message.reply("An error occurred while processing your job. Please try again.");
    }
  }
};

function formatText(text) {
  return text.normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D");
}
