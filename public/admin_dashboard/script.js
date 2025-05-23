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

// Log streaming variables
let logEventSource = null;
let isLogStreamActive = false;
let logBuffer = [];
const MAX_LOG_LINES = 1000; // Maximum number of log lines to keep in buffer

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
        
        // Start log streaming when navigating to logs section
        if (targetSectionId === 'logs-section' && !isLogStreamActive) {
            startLogStreaming();
        }
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

// Function to fetch initial logs
async function fetchBotLogs() {
    try {
        logContent.textContent = 'Loading logs...';
        const response = await fetch('/bot-logs');
        const data = await response.json();
        if (response.ok) {
            logBuffer = data.logs ? data.logs.split('\n') : ['No logs available'];
            updateLogDisplay();
        } else {
            logContent.textContent = `Error fetching logs: ${data.message}`;
            showNotification(`Error fetching logs: ${data.message}`, true);
        }
    } catch (error) {
        logContent.textContent = `Error fetching logs: ${error}`;
        showNotification(`Error fetching logs: ${error}`, true);
    }
}

// Function to start log streaming
function startLogStreaming() {
    if (isLogStreamActive) return; // Don't start multiple streams
    
    try {
        // Close any existing connection
        if (logEventSource) {
            logEventSource.close();
        }
        
        // Connect to the log stream
        logEventSource = new EventSource('/stream-logs');
        isLogStreamActive = true;
        
        // Update button text
        refreshLogsButton.innerHTML = '<i class="fas fa-stop"></i> Stop Live Logs';
        
        // Handle connection open
        logEventSource.onopen = () => {
            showNotification('Live log streaming started');
        };
        
        // Handle incoming log messages
        logEventSource.onmessage = (event) => {
            // Add new log lines to buffer
            const newLines = event.data.split('\n');
            logBuffer = [...logBuffer, ...newLines];
            
            // Limit buffer size
            if (logBuffer.length > MAX_LOG_LINES) {
                logBuffer = logBuffer.slice(logBuffer.length - MAX_LOG_LINES);
            }
            
            // Apply search filter if active
            updateLogDisplay();
        };
        
        // Handle errors
        logEventSource.onerror = () => {
            stopLogStreaming();
            showNotification('Log stream disconnected. Click "Refresh Logs" to reconnect.', true);
        };
    } catch (error) {
        showNotification(`Error starting log stream: ${error}`, true);
        isLogStreamActive = false;
    }
}

// Function to stop log streaming
function stopLogStreaming() {
    if (!isLogStreamActive) return;
    
    if (logEventSource) {
        logEventSource.close();
        logEventSource = null;
    }
    
    isLogStreamActive = false;
    
    // Update button text
    refreshLogsButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Logs';
}

// Function to update log display (applies filtering if needed)
function updateLogDisplay() {
    const searchTerm = logSearch.value.toLowerCase();
    
    let displayedLogs;
    if (searchTerm) {
        displayedLogs = logBuffer.filter(line => 
            line.toLowerCase().includes(searchTerm)
        );
        
        if (displayedLogs.length === 0) {
            logContent.textContent = `No matches found for: "${searchTerm}"`;
            return;
        }
    } else {
        displayedLogs = logBuffer;
    }
    
    // Update log display with latest content
    logContent.textContent = displayedLogs.join('\n');
    
    // Auto-scroll to bottom if user hasn't scrolled up
    const logsContainer = document.querySelector('.logs-container');
    if (logsContainer.scrollHeight - logsContainer.scrollTop <= logsContainer.clientHeight + 100) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

// Function to toggle log streaming
function toggleLogStreaming() {
    if (isLogStreamActive) {
        stopLogStreaming();
        showNotification('Live log streaming stopped');
    } else {
        startLogStreaming();
    }
}

// Event listeners
getCookiesButton.addEventListener('click', fetchCookies);
refreshStatusButton.addEventListener('click', fetchBotStatus);
refreshLogsButton.addEventListener('click', toggleLogStreaming);

// Search functionality
logSearch.addEventListener('input', updateLogDisplay);
clearSearchButton.addEventListener('click', () => {
    logSearch.value = '';
    updateLogDisplay();
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

// Clean up event source when user leaves the page
window.addEventListener('beforeunload', () => {
    if (logEventSource) {
        logEventSource.close();
    }
});

// Initial data load
fetchCookies();
fetchBotStatus();
fetchBotLogs();

// Auto-start log streaming if logs section is initially active
if (document.getElementById('logs-section').classList.contains('active')) {
    startLogStreaming();
} 