const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const app = express();
const port = 3003; // Or any other available port

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public/admin_dashboard'))); // Serve static files from a new directory

// Endpoint to get account cookies
app.get('/get-cookies', (req, res) => {
    const accountPath = path.join(__dirname, 'account.txt');
    fs.readFile(accountPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading account.txt:', err);
            return res.status(500).json({ message: 'Failed to read cookie data' });
        }
        res.json({ cookieData: data });
    });
});

// Endpoint to update account cookies
app.post('/update-cookies', (req, res) => {
    const { cookieData } = req.body;
    const accountPath = path.join(__dirname, 'account.txt');
    fs.writeFile(accountPath, cookieData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to account.txt:', err);
            return res.status(500).json({ message: 'Failed to write cookie data' });
        }
        // Restart the pm2 process after updating cookies
        restartPm2Process();
        res.json({ message: 'Cookie data updated successfully and bot restarted' });
    });
});

// Endpoint to get bot status
app.get('/bot-status', (req, res) => {
    exec('pm2 status index', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting pm2 status: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get bot status', error: error.message });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ message: 'Failed to get bot status', error: stderr });
        }
        res.json({ status: stdout });
    });
});

// Endpoint to start the bot
app.post('/start-bot', (req, res) => {
    exec('pm2 start BOT', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting pm2 process: ${error.message}`);
            return res.status(500).json({ message: 'Failed to start bot', error: error.message });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ message: 'Failed to start bot', error: stderr });
        }
        console.log(`stdout: ${stdout}`);
        res.json({ message: 'Bot started successfully' });
    });
});

// Endpoint to stop the bot
app.post('/stop-bot', (req, res) => {
    exec('pm2 stop BOT', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping pm2 process: ${error.message}`);
            return res.status(500).json({ message: 'Failed to stop bot', error: error.message });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ message: 'Failed to stop bot', error: stderr });
        }
        console.log(`stdout: ${stdout}`);
        res.json({ message: 'Bot stopped successfully' });
    });
});

// Endpoint to get bot logs
app.get('/bot-logs', (req, res) => {
    exec('pm2 logs BOT --lines 100 --nostream', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting pm2 logs: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get bot logs', error: error.message });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ message: 'Failed to get bot logs', error: stderr });
        }
        res.json({ logs: stdout });
    });
});

// Endpoint for streaming logs (Server-Sent Events)
app.get('/stream-logs', (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Send initial message
    res.write('data: Connected to log stream\n\n');

    // Function to send logs as SSE
    const sendLogs = (data) => {
        res.write(`data: ${data.toString().replace(/\n/g, '\ndata: ')}\n\n`);
    };

    // Start pm2 logs in streaming mode
    const logProcess = spawn('pm2', ['logs', 'BOT', '--raw', '--lines', '0']);

    logProcess.stdout.on('data', sendLogs);
    logProcess.stderr.on('data', sendLogs);

    // Handle client disconnect
    req.on('close', () => {
        if (logProcess) {
            logProcess.kill();
        }
    });
});

// Function to restart the pm2 process (used after cookie update)
function restartPm2Process() {
    exec('pm2 restart BOT', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting pm2 process: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

app.listen(port, () => {
    console.log(`Admin server is running on http://localhost:${port}`);
}); 