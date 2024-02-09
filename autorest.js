const cron = require('node-cron');
const { exec } = require('child_process');

// Set the timezone to Asia/Manila (Philippine timezone)
process.env.TZ = 'Asia/Manila';

// Schedule the task to run every hour
cron.schedule('0 * * * *', () => {
  executeCommand();
});

// Schedule the task to run at 9:21 PM
cron.schedule('27 21 * * *', () => {
  executeCommand();
});

function executeCommand() {
  // Execute the command "pm2 restart 0"
  exec('pm2 restart 0', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    console.log(`Command executed successfully: ${stdout}`);
  });
}

