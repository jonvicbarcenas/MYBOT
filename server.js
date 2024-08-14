const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // Import child_process module for executing shell commands

const app = express();
const port = 5500;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.post('/update-config', (req, res) => {
    const { email, password, cookieData } = req.body;
    const configPath = path.join(__dirname, 'config.json');
    const accountPath = path.join(__dirname, 'account.txt');

    // Read the existing config file
    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return res.status(500).json({ message: 'Failed to read config file' });
        }

        let config;
        try {
            config = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing config file:', parseError);
            return res.status(500).json({ message: 'Failed to parse config file' });
        }

        // Update the config object only with provided fields
        if (email !== undefined) config.facebookAccount.email = email;
        if (password !== undefined) config.facebookAccount.password = password;

        // Write the updated config back to the file
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (writeError) => {
            if (writeError) {
                console.error('Error writing to config file:', writeError);
                return res.status(500).json({ message: 'Failed to write config file' });
            }

            // Write the cookie data to account.txt only if provided
            if (cookieData !== undefined) {
                fs.writeFile(accountPath, cookieData, 'utf8', (cookieError) => {
                    if (cookieError) {
                        console.error('Error writing to account.txt:', cookieError);
                        return res.status(500).json({ message: 'Failed to write cookie data' });
                    }

                    // Restart the pm2 process
                    restartPm2Process();
                    
                    res.json({ message: 'Configuration updated successfully' });
                });
            } else {
                // Restart the pm2 process if only email or password was updated
                restartPm2Process();
                
                res.json({ message: 'Configuration updated successfully' });
            }
        });
    });
});

// Function to restart the pm2 process
function restartPm2Process() {
    exec('pm2 restart index', (error, stdout, stderr) => {
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
    console.log(`Server is running on http://localhost:${port}`);
});
