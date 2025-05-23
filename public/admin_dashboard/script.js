// script.js

// DOM Elements
const cookieDataTextarea = document.getElementById('cookieData');
const getCookiesButton = document.getElementById('getCookies');
const updateCookiesButton = document.getElementById('updateCookies');
const botStatusSpan = document.getElementById('botStatus');
const startBotButton = document.getElementById('startBot');
const stopBotButton = document.getElementById('stopBot');
const refreshStatusButton = document.getElementById('refreshStatus');
const messageDiv = document.getElementById('message');
const errorDiv = document.getElementById('error');
const refreshLogsButton = document.getElementById('refreshLogs');
const logContent = document.getElementById('logContent');
const logSearch = document.getElementById('logSearch');
const clearSearchButton = document.getElementById('clearSearch');
const navItems = document.querySelectorAll('nav ul li');
const sections = document.querySelectorAll('.content-section');

// Function to display notifications
function showNotification(msg, isError = false) {
    const element = isError ? errorDiv : messageDiv;
    element.textContent = msg;
    element.classList.add('show');
    
    // Clear other notification
    if (isError) {
        messageDiv.textContent = '';
        messageDiv.classList.remove('show');
    } else {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Function to update status indicator
function updateStatusIndicator(status) {
    botStatusSpan.textContent = status;
    
    // Update class for styling
    botStatusSpan.className = '';
    if (status === 'Running') {
        botStatusSpan.classList.add('running');
    } else if (status === 'Stopped') {
        botStatusSpan.classList.add('stopped');
    } else {
        botStatusSpan.classList.add('error');
    }
}

// Navigation between tabs
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active navigation item
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        const targetSectionId = item.getAttribute('data-section');
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetSectionId).classList.add('active');
    });
});

// Function to fetch and display cookie data
async function fetchCookies() {
    try {
        const response = await fetch('/get-cookies');
        const data = await response.json();
        if (response.ok) {
            cookieDataTextarea.value = data.cookieData;
        } else {
            showNotification(`Error fetching cookies: ${data.message}`, true);
        }
    } catch (error) {
        showNotification(`Error fetching cookies: ${error}`, true);
    }
}

// Function to fetch and display bot status
async function fetchBotStatus() {
    try {
        const response = await fetch('/bot-status');
        const data = await response.json();
        if (response.ok) {
            // Parse the status output to get a simple status (running/stopped)
            if (data.status.includes('online')) {
                updateStatusIndicator('Running');
            } else if (data.status.includes('stopped')) {
                updateStatusIndicator('Stopped');
            } else {
                updateStatusIndicator('Unknown');
            }
        } else {
            showNotification(`Error fetching bot status: ${data.message}`, true);
            updateStatusIndicator('Error');
        }
    } catch (error) {
        showNotification(`Error fetching bot status: ${error}`, true);
        updateStatusIndicator('Error');
    }
}

// Function to fetch and display bot logs
async function fetchBotLogs() {
    try {
        logContent.textContent = 'Loading logs...';
        const response = await fetch('/bot-logs');
        const data = await response.json();
        if (response.ok) {
            logContent.textContent = data.logs || 'No logs available';
        } else {
            logContent.textContent = `Error fetching logs: ${data.message}`;
            showNotification(`Error fetching logs: ${data.message}`, true);
        }
    } catch (error) {
        logContent.textContent = `Error fetching logs: ${error}`;
        showNotification(`Error fetching logs: ${error}`, true);
    }
}

// Function to filter logs based on search input
function filterLogs() {
    const searchTerm = logSearch.value.toLowerCase();
    if (!searchTerm) {
        fetchBotLogs(); // Reload all logs if search is cleared
        return;
    }
    
    const allLogs = logContent.textContent;
    const logLines = allLogs.split('\n');
    const filteredLines = logLines.filter(line => 
        line.toLowerCase().includes(searchTerm)
    );
    
    if (filteredLines.length === 0) {
        logContent.textContent = `No matches found for: "${searchTerm}"`;
    } else {
        logContent.textContent = filteredLines.join('\n');
    }
}

// Event listeners
getCookiesButton.addEventListener('click', fetchCookies);
refreshStatusButton.addEventListener('click', fetchBotStatus);
refreshLogsButton.addEventListener('click', fetchBotLogs);

// Search functionality
logSearch.addEventListener('input', filterLogs);
clearSearchButton.addEventListener('click', () => {
    logSearch.value = '';
    fetchBotLogs();
});

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
            showNotification(data.message);
            // Refresh status after updating cookies and restarting bot
            fetchBotStatus();
        } else {
            showNotification(`Error updating cookies: ${data.message}`, true);
        }
    } catch (error) {
        showNotification(`Error updating cookies: ${error}`, true);
    }
});

startBotButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/start-bot', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            // Refresh status after starting bot
            fetchBotStatus();
        } else {
            showNotification(`Error starting bot: ${data.message}`, true);
        }
    } catch (error) {
        showNotification(`Error starting bot: ${error}`, true);
    }
});

stopBotButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/stop-bot', {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            // Refresh status after stopping bot
            fetchBotStatus();
        } else {
            showNotification(`Error stopping bot: ${data.message}`, true);
        }
    } catch (error) {
        showNotification(`Error stopping bot: ${error}`, true);
    }
});

// Initial data load
fetchCookies();
fetchBotStatus();
fetchBotLogs(); 