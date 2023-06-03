const express = require('express');
const moment = require('moment-timezone');
const path = require('path');

const app = express();

// Serve static files from the main directory
app.use(express.static(__dirname));

// Define the route for the homepage
app.get('/', (req, res) => {
  const currentTime = moment();
  const targetTime = moment.tz('Asia/Manila').set({ hour: 6, minute: 0, second: 0 });

  // Calculate the remaining time until 6 am
  let duration = moment.duration(targetTime.diff(currentTime));
  let hours = duration.hours();
  let minutes = duration.minutes();
  let seconds = duration.seconds();

  // Format the remaining time
  let countdown = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  res.send(`
    <html>
      <head>
        <title>Countdown</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
      </head>
      <body>
        <h1>Countdown to 6 AM in Asia/Manila Timezone</h1>
        <p id="countdown">${countdown}</p>
        <script>
          function updateCountdown() {
            const currentTime = moment();
            const targetTime = moment.tz('Asia/Manila').set({ hour: 6, minute: 0, second: 0 });

            // Calculate the remaining time until 6 am
            let duration = moment.duration(targetTime.diff(currentTime));
            let hours = duration.hours();
            let minutes = duration.minutes();
            let seconds = duration.seconds();

            // Format the remaining time
            let countdown = \`\${hours} hours, \${minutes} minutes, \${seconds} seconds\`;

            // Update the countdown element
            document.getElementById('countdown').textContent = countdown;
          }

          // Update the countdown immediately
          updateCountdown();

          // Update the countdown every second
          setInterval(updateCountdown, 1000);
        </script>
      </body>
    </html>
  `);
});

// Start the server
const port = 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
