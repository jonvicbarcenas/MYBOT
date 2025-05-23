// script.js

const cookieDataTextarea = document.getElementById('cookieData');
const getCookiesButton = document.getElementById('getCookies');
const updateCookiesButton = document.getElementById('updateCookies');
const botStatusSpan = document.getElementById('botStatus');
const startBotButton = document.getElementById('startBot');
const stopBotButton = document.getElementById('stopBot');
const messageDiv = document.getElementById('message');
const errorDiv = document.getElementById('error');

// Function to display messages
function displayMessage(msg, isError = false) {
    if (isError) {
        errorDiv.textContent = msg;
        messageDiv.textContent = '';
    } else {
        messageDiv.textContent = msg;
        errorDiv.textContent = '';
    }
}

// Function to fetch and display cookie data
async function fetchCookies() {
    try {
        const response = await fetch('/get-cookies');
        const data = await response.json();
        if (response.ok) {
            cookieDataTextarea.value = data.cookieData;
        } else {
            displayMessage(`Error fetching cookies: ${data.message}`, true);
        }
    } catch (error) {
        displayMessage(`Error fetching cookies: ${error}`, true);
    }
}

// Function to fetch and display bot status
async function fetchBotStatus() {
    try {
        const response = await fetch('/bot-status');
        const data = await response.json();
        if (response.ok) {
            // Parse the status output to get a simple status (running/stopped)
            // This is a basic parsing, might need adjustment based on actual pm2 output format
            if (data.status.includes('online')) {
                botStatusSpan.textContent = 'Running';
                botStatusSpan.style.color = 'green';
            } else if (data.status.includes('stopped')) {
                botStatusSpan.textContent = 'Stopped';
                botStatusSpan.style.color = 'red';
            } else {
                botStatusSpan.textContent = 'Unknown';
                botStatusSpan.style.color = 'orange';
            }
        } else {
            displayMessage(`Error fetching bot status: ${data.message}`, true);
            botStatusSpan.textContent = 'Error';
            botStatusSpan.style.color = 'red';
        }
    } catch (error) {
        displayMessage(`Error fetching bot status: ${error}`, true);
        botStatusSpan.textContent = 'Error';
        botStatusSpan.style.color = 'red';
    }
}

// Event listeners
getCookiesButton.addEventListener('click', fetchCookies);

updateCookiesButton.addEventListener('click', async () => {
    const cookieData = cookieDataTextarea.value;
    try {
        const response = await fetch('/update-cookies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cookieData })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message);
            // Refresh status after updating cookies and restarting bot
            fetchBotStatus();
        } else {
            displayMessage(`Error updating cookies: ${data.message}`, true);
        }
    } catch (error) {
        displayMessage(`Error updating cookies: ${error}`, true);
    }
});

startBotButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/start-bot', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message);
            // Refresh status after starting bot
            fetchBotStatus();
        } else {
            displayMessage(`Error starting bot: ${data.message}`, true);
        }
    } catch (error) {
        displayMessage(`Error starting bot: ${error}`, true);
    }
});

stopBotButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/stop-bot', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message);
            // Refresh status after stopping bot
            fetchBotStatus();
        } else {
            displayMessage(`Error stopping bot: ${data.message}`, true);
        }
    } catch (error) {
        displayMessage(`Error stopping bot: ${error}`, true);
    }
});

// Initial data load
fetchCookies();
fetchBotStatus(); 