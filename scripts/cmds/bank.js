const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bank",
    version: "2.0",
    author: "LøüFï/alrulex | JV | Enhanced",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "🏦 Luxury Virtual Banking System"
    },
    longDescription: {
      vi: "",
      en: "Premium banking system with deposits, withdrawals, transfers, investments and loans"
    },
    category: "banking",
    guide: {
      vi: "",
      en: "{pn} [deposit | withdraw | show | transfer | interest | loan | invest | rob | lottery | leaderboard]\n➤ bank deposit (amount): Deposit money to your account\n➤ bank withdraw (amount): Withdraw money from your account\n➤ bank show: Display your current banking information\n➤ bank transfer (amount) (uid): Transfer money to another user\n➤ bank interest: Collect your interest earnings\n➤ bank loan (amount): Take a loan from the bank\n➤ bank invest (amount) (plan): Invest your money (safe/risky/crypto)\n➤ bank rob: Attempt to rob the bank (high risk, high reward)\n➤ bank lottery (amount): Try your luck with the lottery\n➤ bank leaderboard: Show richest bank users"
    }
  },
  onStart: async function ({ args, message, event, usersData }) {
    // Ensure bank.json file exists
    const bankPath = path.join(__dirname, "..", "..", "bank.json");
    if (!fs.existsSync(bankPath)) {
      fs.writeFileSync(bankPath, JSON.stringify({}, null, 2), "utf8");
    }
    
    const userMoney = await usersData.get(event.senderID, "money");
    const user = parseInt(event.senderID);
    const bankData = JSON.parse(fs.readFileSync(bankPath, "utf8"));

    // Initialize user data if not exists
    if (!bankData[user]) {
      bankData[user] = {
        bank: 0,
        loans: 0,
        investments: [],
        lastInterestClaimed: Date.now(),
        transactions: [],
        robberyAttempts: 0,
        lastRobbery: 0
      };
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
    }

    // Migrate old data format if needed
    if (!bankData[user].transactions) {
      bankData[user].transactions = [];
      bankData[user].loans = 0;
      bankData[user].investments = [];
      bankData[user].robberyAttempts = 0;
      bankData[user].lastRobbery = 0;
    }

    const command = args[0];
    const amount = parseInt(args[1]);
    const recipientUID = parseInt(args[2]);
    const investPlan = args[2];

    // Record transaction helper
    const recordTransaction = (type, amount, details = {}) => {
      bankData[user].transactions.push({
        type,
        amount,
        timestamp: Date.now(),
        ...details
      });
      
      // Keep only last 10 transactions
      if (bankData[user].transactions.length > 10) {
        bankData[user].transactions.shift();
      }
    };

    // Generate receipt helper
    const generateReceipt = (title, details) => {
      const timestamp = new Date().toLocaleString();
      const receiptId = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      let receipt = `┏━━━━「 🏦 LUXURY BANK RECEIPT 🏦 」━━━━┓\n`;
      receipt += `┃ ${title}\n`;
      receipt += `┃ Transaction ID: #${receiptId}\n`;
      receipt += `┃ Date: ${timestamp}\n`;
      receipt += `┃ Customer: #${user}\n`;
      receipt += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
      
      for (const [key, value] of Object.entries(details)) {
        receipt += `┃ ${key}: ${value}\n`;
      }
      
      const balance = bankData[user].bank;
      receipt += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
      receipt += `┃ Current Balance: $${balance.toLocaleString()}\n`;
      receipt += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      
      return receipt;
    };

    if (command === "deposit") {
      if (isNaN(amount) || amount <= 0) {
        return message.reply("💰 Please enter a valid amount to deposit.");
      }
      
      if (userMoney < amount) {
        return message.reply("❌ Insufficient funds! You don't have enough money in your wallet.");
      }

      bankData[user].bank += amount;
      await usersData.set(event.senderID, {
        money: userMoney - amount
      });

      recordTransaction("deposit", amount);
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("DEPOSIT CONFIRMATION", {
        "Amount Deposited": `$${amount.toLocaleString()}`,
        "Deposit Method": "Wallet Transfer",
        "Processing Fee": "$0.00"
      });
      
      return message.reply(receipt);
    } 
    else if (command === "withdraw") {
      const balance = bankData[user].bank || 0;

      if (isNaN(amount) || amount <= 0) {
        return message.reply("💰 Please enter a valid amount to withdraw.");
      }

      if (amount > balance) {
        return message.reply("❌ Withdrawal failed! Insufficient funds in your bank account.");
      }

      bankData[user].bank = balance - amount;
      const currentMoney = await usersData.get(event.senderID, "money");
      await usersData.set(event.senderID, {
        money: currentMoney + amount
      });

      recordTransaction("withdraw", amount);
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("WITHDRAWAL CONFIRMATION", {
        "Amount Withdrawn": `$${amount.toLocaleString()}`,
        "Withdrawal Method": "Wallet Transfer",
        "Processing Fee": "$0.00"
      });
      
      return message.reply(receipt);
    } 
    else if (command === "show") {
      const balance = bankData[user].bank !== undefined ? bankData[user].bank : 0;
      const loans = bankData[user].loans || 0;
      const investments = bankData[user].investments || [];
      
      let investmentValue = 0;
      let investmentDetails = "";
      
      if (investments.length > 0) {
        investments.forEach(inv => {
          investmentValue += inv.currentValue;
          investmentDetails += `\n┃ • ${inv.plan}: $${inv.currentValue.toLocaleString()} (${inv.risk})`;
        });
      } else {
        investmentDetails = "\n┃ • No active investments";
      }
      
      // Calculate net worth
      const netWorth = balance - loans + investmentValue;
      
      // Format account statement
      let accountSummary = `┏━━━━「 🏦 LUXURY BANK STATEMENT 🏦 」━━━━┓\n`;
      accountSummary += `┃ 👤 ACCOUNT HOLDER: #${user}\n`;
      accountSummary += `┃ 📊 ACCOUNT SUMMARY:\n`;
      accountSummary += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
      accountSummary += `┃ 💰 Available Balance: $${balance.toLocaleString()}\n`;
      accountSummary += `┃ 🏧 Pending Loans: $${loans.toLocaleString()}\n`;
      accountSummary += `┃ 📈 Investments: $${investmentValue.toLocaleString()}${investmentDetails}\n`;
      accountSummary += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
      accountSummary += `┃ 📑 NET WORTH: $${netWorth.toLocaleString()}\n`;
      
      // Add recent transaction history
      if (bankData[user].transactions && bankData[user].transactions.length > 0) {
        accountSummary += `┣━━━━「 RECENT TRANSACTIONS 」━━━━━┫\n`;
        
        const recentTransactions = bankData[user].transactions.slice(-3);
        recentTransactions.forEach(transaction => {
          const date = new Date(transaction.timestamp).toLocaleDateString();
          accountSummary += `┃ ${date} | ${transaction.type}: $${transaction.amount.toLocaleString()}\n`;
        });
      }
      
      accountSummary += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      
      return message.reply(accountSummary);
    } 
    else if (command === "interest") {
      let interestRate = 0.0001; // Base rate
      const balance = bankData[user].bank || 0;
      
      // Tiered interest rates based on balance
      if (balance > 100000) interestRate = 0.00015;
      if (balance > 500000) interestRate = 0.0002;
      if (balance > 1000000) interestRate = 0.00025;
      
      const lastInterestClaimed = bankData[user].lastInterestClaimed || Date.now();
      const currentTime = Date.now();
      const timeDiffInSeconds = (currentTime - lastInterestClaimed) / 1000;
      const timeDiffInHours = timeDiffInSeconds / 3600;
      
      // Calculate interest with compound effect
      const interestEarned = balance * (interestRate * timeDiffInHours);
      
      if (interestEarned < 1) {
        return message.reply(`💱 Interest too small to claim! Wait longer or deposit more money to earn interest faster.`);
      }
      
      bankData[user].lastInterestClaimed = currentTime;
      bankData[user].bank += interestEarned;
      
      recordTransaction("interest", interestEarned);
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("INTEREST PAYMENT", {
        "Interest Earned": `$${interestEarned.toFixed(2).toLocaleString()}`,
        "Interest Rate": `${(interestRate * 100 * 24).toFixed(3)}% daily`,
        "Time Period": `${timeDiffInHours.toFixed(1)} hours`
      });
      
      return message.reply(receipt);
    } 
    else if (command === "transfer") {
      const balance = bankData[user].bank || 0;

      if (isNaN(amount) || amount <= 0) {
        return message.reply("💰 Please enter a valid amount to transfer.");
      }

      if (balance < amount) {
        return message.reply("❌ Transfer failed! You don't have enough funds in your account.");
      }

      if (!isValidUID(recipientUID)) {
        return message.reply("❌ Invalid recipient ID! Please enter a valid 15-digit user ID starting with 1000.");
      }
      
      if (recipientUID === user) {
        return message.reply("❌ You cannot transfer money to yourself!");
      }

      // Initialize recipient account if needed
      if (!bankData[recipientUID]) {
        bankData[recipientUID] = {
          bank: 0,
          loans: 0,
          investments: [],
          lastInterestClaimed: Date.now(),
          transactions: [],
          robberyAttempts: 0,
          lastRobbery: 0
        };
      }

      // Apply transfer fee (0.5%)
      const transferFee = Math.ceil(amount * 0.005);
      const transferAmount = amount - transferFee;
      
      bankData[user].bank -= amount;
      bankData[recipientUID].bank += transferAmount;
      
      recordTransaction("transfer", amount, { recipient: recipientUID, fee: transferFee });
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("TRANSFER CONFIRMATION", {
        "Recipient": `#${recipientUID}`,
        "Amount Sent": `$${transferAmount.toLocaleString()}`,
        "Transfer Fee": `$${transferFee.toLocaleString()} (0.5%)`,
        "Total Deducted": `$${amount.toLocaleString()}`
      });
      
      return message.reply(receipt);
    }
    else if (command === "loan") {
      // New loan feature
      if (isNaN(amount) || amount <= 0) {
        return message.reply("💰 Please enter a valid loan amount.");
      }
      
      const currentLoans = bankData[user].loans || 0;
      const bankBalance = bankData[user].bank || 0;
      
      // Loan limit based on current balance (max 2x your balance)
      const maxLoan = Math.max(10000, bankBalance * 2);
      
      if (currentLoans > 0) {
        return message.reply(`❌ You already have an outstanding loan of $${currentLoans.toLocaleString()}. Please repay it first.`);
      }
      
      if (amount > maxLoan) {
        return message.reply(`❌ Loan denied! The maximum loan amount you qualify for is $${maxLoan.toLocaleString()} (based on your bank history).`);
      }
      
      // Approve loan
      const interestRate = 0.05; // 5% interest
      const loanWithInterest = Math.ceil(amount * (1 + interestRate));
      
      bankData[user].loans = loanWithInterest;
      bankData[user].bank += amount;
      
      recordTransaction("loan", amount, { interestRate: "5%", repayAmount: loanWithInterest });
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("LOAN APPROVAL", {
        "Loan Amount": `$${amount.toLocaleString()}`,
        "Interest Rate": "5%",
        "Repayment Amount": `$${loanWithInterest.toLocaleString()}`,
        "Status": "APPROVED ✅"
      });
      
      return message.reply(receipt);
    }
    else if (command === "invest") {
      // New investment feature
      if (isNaN(amount) || amount <= 0) {
        return message.reply("💰 Please enter a valid amount to invest.");
      }
      
      const balance = bankData[user].bank || 0;
      
      if (balance < amount) {
        return message.reply("❌ Investment failed! Insufficient funds in your bank account.");
      }
      
      if (!investPlan || !["safe", "risky", "crypto"].includes(investPlan.toLowerCase())) {
        return message.reply("❌ Invalid investment plan! Choose from: safe, risky, or crypto.");
      }
      
      // Define risk and potential returns for each plan
      const plans = {
        safe: { minReturn: 0.95, maxReturn: 1.2, risk: "Low Risk" },
        risky: { minReturn: 0.7, maxReturn: 1.8, risk: "Medium Risk" },
        crypto: { minReturn: 0.3, maxReturn: 3.0, risk: "High Risk" }
      };
      
      const selectedPlan = plans[investPlan.toLowerCase()];
      
      // Create investment
      const investment = {
        amount,
        plan: investPlan.toLowerCase(),
        initialAmount: amount,
        currentValue: amount,
        timestamp: Date.now(),
        risk: selectedPlan.risk
      };
      
      // Random return within plan's range
      const returnMultiplier = Math.random() * 
        (selectedPlan.maxReturn - selectedPlan.minReturn) + selectedPlan.minReturn;
      
      investment.currentValue = Math.floor(amount * returnMultiplier);
      
      // Deduct from bank and add to investments
      bankData[user].bank -= amount;
      
      if (!bankData[user].investments) bankData[user].investments = [];
      bankData[user].investments.push(investment);
      
      recordTransaction("investment", amount, { plan: investPlan.toLowerCase(), returnRate: `${(returnMultiplier * 100 - 100).toFixed(1)}%` });
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("INVESTMENT CONFIRMATION", {
        "Investment Amount": `$${amount.toLocaleString()}`,
        "Investment Plan": `${investPlan.toUpperCase()}`,
        "Risk Level": selectedPlan.risk,
        "Potential Return": `${(selectedPlan.minReturn * 100).toFixed(0)}% to ${(selectedPlan.maxReturn * 100).toFixed(0)}%`,
        "Current Value": `$${investment.currentValue.toLocaleString()}`
      });
      
      return message.reply(receipt);
    }
    else if (command === "rob") {
      // Fun bank robbery feature (high risk, high reward)
      const cooldownHours = 6;
      const currentTime = Date.now();
      const lastRobbery = bankData[user].lastRobbery || 0;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      
      if (currentTime - lastRobbery < cooldownMs) {
        const timeLeft = Math.ceil((cooldownMs - (currentTime - lastRobbery)) / (60 * 60 * 1000));
        return message.reply(`🚓 The police are still looking for you! Try again in ${timeLeft} hours.`);
      }
      
      bankData[user].lastRobbery = currentTime;
      bankData[user].robberyAttempts = (bankData[user].robberyAttempts || 0) + 1;
      
      // Success rate decreases with more attempts (max 35%)
      const successRate = Math.max(5, 35 - (bankData[user].robberyAttempts * 3));
      const success = Math.random() * 100 < successRate;
      
      if (success) {
        // Successful heist
        const minReward = 10000;
        const maxReward = 100000;
        const reward = Math.floor(Math.random() * (maxReward - minReward) + minReward);
        
        bankData[user].bank += reward;
        recordTransaction("robbery", reward, { status: "successful" });
        fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
        
        return message.reply(`🎭 BANK HEIST SUCCESSFUL!\n\n💰 You managed to steal $${reward.toLocaleString()} from the bank vault!\n\n⚠️ Be careful, the police will be looking for you for the next ${cooldownHours} hours.`);
      } else {
        // Failed heist
        const fine = Math.floor(Math.random() * 25000) + 5000;
        const currentBank = bankData[user].bank || 0;
        
        // Can't go below zero
        const actualFine = Math.min(currentBank, fine);
        bankData[user].bank = Math.max(0, currentBank - actualFine);
        
        recordTransaction("robbery", -actualFine, { status: "failed" });
        fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
        
        return message.reply(`🚨 BANK HEIST FAILED!\n\n👮‍♂️ You were caught by security and fined $${actualFine.toLocaleString()}!\n\n⚖️ You'll need to wait ${cooldownHours} hours before attempting another robbery.`);
      }
    }
    else if (command === "lottery") {
      // Lottery system
      const ticketPrice = 1000;
      
      if (isNaN(amount) || amount <= 0) {
        return message.reply(`🎟️ Please specify how many lottery tickets to buy (each costs $${ticketPrice}).`);
      }
      
      const totalCost = ticketPrice * amount;
      const bankBalance = bankData[user].bank || 0;
      
      if (bankBalance < totalCost) {
        return message.reply(`❌ You need $${totalCost.toLocaleString()} to buy ${amount} lottery tickets, but you only have $${bankBalance.toLocaleString()} in your account.`);
      }
      
      // Deduct ticket cost
      bankData[user].bank -= totalCost;
      
      // Calculate winnings
      let winnings = 0;
      let ticketResults = [];
      
      for (let i = 0; i < amount; i++) {
        const roll = Math.random() * 100;
        let ticketWin = 0;
        
        // Lottery odds
        if (roll > 99.9) { // 0.1% chance - jackpot
          ticketWin = ticketPrice * 1000;
          ticketResults.push(`🎰 JACKPOT: $${ticketWin.toLocaleString()}`);
        } else if (roll > 99) { // 0.9% chance - big win
          ticketWin = ticketPrice * 100;
          ticketResults.push(`🎯 BIG WIN: $${ticketWin.toLocaleString()}`);
        } else if (roll > 95) { // 4% chance - medium win
          ticketWin = ticketPrice * 2;
          ticketResults.push(`✨ WIN: $${ticketWin.toLocaleString()}`);
        } else if (roll > 80) { // 15% chance - small win
          ticketWin = ticketPrice * 2;
          ticketResults.push(`🎟️ Small win: $${ticketWin.toLocaleString()}`);
        } else { // 80% chance - lose
          ticketWin = 0;
          ticketResults.push(`📃 No win`);
        }
        
        winnings += ticketWin;
      }
      
      bankData[user].bank += winnings;
      
      // Calculate profit/loss
      const profit = winnings - totalCost;
      const profitStr = profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`;
      
      recordTransaction("lottery", profit, { tickets: amount, spent: totalCost, won: winnings });
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      // Show ticket results for up to 5 tickets
      const displayResults = amount <= 5 ? 
        `\n${ticketResults.join("\n")}` : 
        `\n${ticketResults.slice(0, 3).join("\n")}\n... and ${amount - 3} more tickets`;
      
      const receipt = generateReceipt("LOTTERY RESULTS", {
        "Tickets Purchased": amount,
        "Total Cost": `$${totalCost.toLocaleString()}`,
        "Total Winnings": `$${winnings.toLocaleString()}`,
        "Profit/Loss": profitStr,
        "Results": displayResults
      });
      
      return message.reply(receipt);
    }
    else if (command === "leaderboard") {
      // Bank leaderboard
      const entries = Object.entries(bankData);
      if (entries.length === 0) {
        return message.reply("🏦 No bank accounts found!");
      }
      
      // Sort by bank balance
      const sortedUsers = entries
        .map(([id, data]) => ({
          id,
          balance: data.bank || 0,
          investments: data.investments ? data.investments.reduce((sum, inv) => sum + inv.currentValue, 0) : 0
        }))
        .sort((a, b) => (b.balance + b.investments) - (a.balance + a.investments))
        .slice(0, 10);
      
      let leaderboard = `┏━━━━「 🏆 BANK LEADERBOARD 🏆 」━━━━┓\n`;
      
      sortedUsers.forEach((user, index) => {
        const totalValue = user.balance + user.investments;
        const crown = index === 0 ? "👑 " : "";
        leaderboard += `┃ ${index + 1}. ${crown}User #${user.id}: $${totalValue.toLocaleString()}\n`;
      });
      
      leaderboard += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      
      return message.reply(leaderboard);
    }
    else if (command === "payloan") {
      // Loan repayment
      const loanAmount = bankData[user].loans || 0;
      
      if (loanAmount <= 0) {
        return message.reply("✅ You don't have any outstanding loans to repay.");
      }
      
      const balance = bankData[user].bank || 0;
      
      if (balance < loanAmount) {
        return message.reply(`❌ You need $${loanAmount.toLocaleString()} to repay your loan, but you only have $${balance.toLocaleString()} in your account.`);
      }
      
      // Repay loan
      bankData[user].bank -= loanAmount;
      bankData[user].loans = 0;
      
      recordTransaction("loan_repayment", -loanAmount);
      fs.writeFileSync(bankPath, JSON.stringify(bankData, null, 2));
      
      const receipt = generateReceipt("LOAN REPAYMENT", {
        "Amount Repaid": `$${loanAmount.toLocaleString()}`,
        "Remaining Debt": "$0",
        "Status": "FULLY PAID ✅"
      });
      
      return message.reply(receipt);
    }
    else {
      // Help menu with fancy formatting
      let helpMenu = `┏━━━━「 🏦 LUXURY BANK SERVICES 🏦 」━━━━┓\n`;
      helpMenu += `┃ \n`;
      helpMenu += `┃ 💵 /bank deposit [amount]\n`;
      helpMenu += `┃ 💸 /bank withdraw [amount]\n`;
      helpMenu += `┃ 📊 /bank show\n`;
      helpMenu += `┃ 💱 /bank transfer [amount] [uid]\n`;
      helpMenu += `┃ 💹 /bank interest\n`;
      helpMenu += `┃ 💰 /bank loan [amount]\n`;
      helpMenu += `┃ 💲 /bank payloan\n`;
      helpMenu += `┃ 📈 /bank invest [amount] [safe/risky/crypto]\n`;
      helpMenu += `┃ 🎯 /bank lottery [tickets]\n`;
      helpMenu += `┃ 🏆 /bank leaderboard\n`;
      helpMenu += `┃ 🎭 /bank rob\n`;
      helpMenu += `┃ \n`;
      helpMenu += `┃ 📘 Use /help bank for detailed instructions\n`;
      helpMenu += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      
      return message.reply(helpMenu);
    }
  }
};

function isValidUID(uid) {
  const uidString = uid.toString();
  return uidString.length === 15 && uidString.startsWith("1000");
}

/*DO NOT CHANGE CREDIT 🐸*/

