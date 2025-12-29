const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_LIST_URL = 'https://generativelanguage.googleapis.com/v1/models';

async function listModels(apiKey) {
  const res = await axios.get(`${GEMINI_LIST_URL}?key=${apiKey}`);
  return res.data.models || [];
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

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file' 
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

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
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

    res.json({
      success: true,
      message: assistantMessage,
      history: conversationHistory
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      try {
        const models = await listModels(GEMINI_API_KEY);
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

    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid API request: ' + (error.response.data.error?.message || 'Check your API key and request format')
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Invalid or unauthorized API key. Please check your GEMINI_API_KEY in .env file'
      });
    }

    res.status(500).json({
      error: 'Error processing your message: ' + (error.response?.data?.error?.message || error.message)
    });
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
    if (!GEMINI_API_KEY) {
      return res.json({
        api_configured: false,
        model_available: false,
        error: 'Gemini API key is not configured'
      });
    }

    // List models to confirm availability
    const models = await listModels(GEMINI_API_KEY);
    const availableNames = models.map(m => m.name);
    const hasModel = availableNames.includes(`models/${GEMINI_MODEL}`) || availableNames.includes(GEMINI_MODEL);

    if (!hasModel) {
      return res.json({
        api_configured: true,
        model_available: false,
        available_models: availableNames,
        error: `Model ${GEMINI_MODEL} not available. Try one of: ${availableNames.slice(0, 5).join(', ')}`,
        status: 'disconnected'
      });
    }

    // Test API connection with a simple request
    await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
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
      available_models: availableNames,
      current_model: GEMINI_MODEL,
      status: 'connected'
    });
  } catch (error) {
    res.json({
      api_configured: !!GEMINI_API_KEY,
      model_available: false,
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
  console.log(`🔑 API Key configured: ${GEMINI_API_KEY ? '✅ Yes' : '❌ No - Please add GEMINI_API_KEY to .env'}`);
});