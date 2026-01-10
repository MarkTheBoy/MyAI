const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const statusIndicator = document.getElementById('statusIndicator');

let isLoading = false;
let messageCount = 0;

// Check Gemini status on load
window.addEventListener('load', checkGeminiStatus);

// Send message on Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) {
        sendMessage();
    }
});

async function checkGeminiStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

    if (data.api_configured && data.model_available) {
        statusIndicator.classList.add('connected');
        console.log('✅ Connected to Google Gemini API');
    } else if (!data.api_configured) {
        showErrorMessage('❌ Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file');
    } else {
        showErrorMessage('❌ Cannot connect to Gemini API. Please check your API key.');
    }
    } catch (error) {
        console.error('Error checking status:', error);
        showErrorMessage('Cannot connect to server. Please make sure the server is running.');
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || isLoading) return;

    // Clear input
    messageInput.value = '';

    // Add user message to chat
    addMessageToChat(message, 'user');
    messageCount++;

    isLoading = true;
    sendBtn.disabled = true;
    messageInput.disabled = true;

    // Show loading indicator
    showLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
        }

        // Remove loading indicator
        removeLoadingIndicator();

        // Add assistant response to chat
        addMessageToChat(data.message, 'assistant');
        messageCount++;

    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator();
        showErrorMessage('Error: ' + error.message);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function addMessageToChat(message, role) {
    // Remove empty state on first message
    if (messageCount === 0) {
        chatContainer.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div>
            <div class="message-label">${role === 'user' ? 'You' : 'Assistant'}</div>
            <div class="message-content">${escapeHtml(message)}</div>
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div>
            <div class="message-label">Assistant</div>
            <div class="message-content">
                <div class="loading">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function showErrorMessage(error) {
    removeLoadingIndicator();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error;
    chatContainer.appendChild(errorDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showInfoMessage(info) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.textContent = info;
    chatContainer.appendChild(infoDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function clearChat() {
    if (confirm('Are you sure you want to clear the conversation?')) {
        try {
            await fetch('/api/clear', { method: 'POST' });
            chatContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <p>Start a conversation with the AI</p>
                </div>
            `;
            messageCount = 0;
            messageInput.focus();
        } catch (error) {
            showErrorMessage('Error clearing chat: ' + error.message);
        }
    }
}