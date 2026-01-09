const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_LIST_URL = 'https://generativelanguage.googleapis.com/v1/models';

// Parse multiple API keys from GEMINI_API_KEYS (comma-separated)
const API_KEYS_STRING = process.env.GEMINI_API_KEYS || '';
const API_KEYS = API_KEYS_STRING.split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

async function listModels(apiKey) {
  const res = await axios.get(`${GEMINI_LIST_URL}?key=${apiKey}`);
  return res.data.models || [];
}

function getNextApiKey() {
  if (API_KEYS.length === 0) return null;
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Store conversation history
let conversationHistory = [];

// Root route - serve the chatbot UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (API_KEYS.length === 0) {
      return res.status(500).json({ 
        error: 'Gemini API keys are not configured. Please add GEMINI_API_KEYS to your .env file' 
      });
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Prepare conversation for Gemini API
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: msg.parts
    }));

    let lastError = null;

    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const apiKey = getNextApiKey();

      try {
        console.log(`[Attempt ${attempt + 1}/${API_KEYS.length}] Using API key index ${currentKeyIndex === 0 ? API_KEYS.length - 1 : currentKeyIndex - 1}`);

        const response = await axios.post(
          `${GEMINI_API_URL}?key=${apiKey}`,
          {
            contents: contents,
            generationConfig: {
              temperature: 0.9,
              topK: 1,
              topP: 1,
              maxOutputTokens: 2048,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const assistantMessage = response.data.candidates[0].content.parts[0].text.trim();

        // Add assistant response to history
        conversationHistory.push({
          role: 'assistant',
          parts: [{ text: assistantMessage }]
        });

        console.log('✅ Success with current key');

        return res.json({
          success: true,
          message: assistantMessage,
          history: conversationHistory
        });
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error.response?.status, error.response?.data?.error?.message || error.message);

        // If 429 (rate limit), try next key
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // For auth errors, break early
        if (error.response?.status === 401 || error.response?.status === 403) {
          break;
        }
      }
    }

    // All keys exhausted
    if (lastError?.response?.status === 404) {
      try {
        const models = await listModels(API_KEYS[0]);
        const availableNames = (models || []).map(m => m.name);
        return res.status(404).json({
          error: `Model ${GEMINI_MODEL} not found. Available examples: ${availableNames.slice(0, 5).join(', ')}`
        });
      } catch (listErr) {
        return res.status(404).json({
          error: `Model ${GEMINI_MODEL} not found. Also failed to list models: ${listErr.message}`
        });
      }
    }

    if (lastError?.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid API request: ' + (lastError.response.data.error?.message || 'Check your API key and request format')
      });
    }

    if (lastError?.response?.status === 403) {
      return res.status(403).json({
        error: 'Invalid or unauthorized API key. Please check your GEMINI_API_KEYS in .env file'
      });
    }

    return res.status(500).json({
      error: 'Failed after trying all keys: ' + (lastError?.response?.data?.error?.message || lastError?.message || 'Unknown error')
    });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

// API route to clear conversation history
app.post('/api/clear', (req, res) => {
  conversationHistory = [];
  res.json({ success: true, message: 'Conversation cleared' });
});

// API route to check Gemini API status
app.get('/api/status', async (req, res) => {
  try {
    if (API_KEYS.length === 0) {
      return res.json({
        api_configured: false,
        model_available: false,
        total_keys: 0,
        error: 'Gemini API keys are not configured'
      });
    }

    const primaryKey = API_KEYS[0];
    const models = await listModels(primaryKey);
    const availableNames = models.map(m => m.name);
    const hasModel = availableNames.includes(`models/${GEMINI_MODEL}`) || availableNames.includes(GEMINI_MODEL);

    if (!hasModel) {
      return res.json({
        api_configured: true,
        model_available: false,
        total_keys: API_KEYS.length,
        available_models: availableNames,
        error: `Model ${GEMINI_MODEL} not available. Try one of: ${availableNames.slice(0, 5).join(', ')}`,
        status: 'disconnected'
      });
    }

    // Test API connection with a simple request using the primary key
    await axios.post(
      `${GEMINI_API_URL}?key=${primaryKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    res.json({
      api_configured: true,
      model_available: true,
      total_keys: API_KEYS.length,
      available_models: availableNames,
      current_model: GEMINI_MODEL,
      status: 'connected'
    });
  } catch (error) {
    res.json({
      api_configured: API_KEYS.length > 0,
      model_available: false,
      total_keys: API_KEYS.length,
      error: error.response?.data?.error?.message || 'Cannot connect to Gemini API',
      status: 'disconnected'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Chatbot server running at http://localhost:${PORT}`);
  console.log(`🌐 Using Google Gemini API`);
  console.log(`🧠 Model: ${GEMINI_MODEL}`);
  console.log(`🔑 API Keys configured: ${API_KEYS.length > 0 ? `✅ ${API_KEYS.length} key(s)` : '❌ None - Please add GEMINI_API_KEYS to .env'}`);
});