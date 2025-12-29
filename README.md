# Ollama Chatbot

A JavaScript chatbot powered by Ollama and the Gemma3:12B language model.

## Features

- 🤖 Real-time chat interface with Ollama
- 💬 Conversation history management
- 🎨 Modern, responsive UI
- 📱 Mobile-friendly design
- ⚡ Fast inference with Gemma3:12B model
- 🔄 Clear conversation history
- 🎯 Status indicator for Ollama connection

## Prerequisites

Before running this chatbot, you need to have:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **Ollama** - [Download here](https://ollama.ai/)
3. **Gemma3:12B model** pulled in Ollama

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Download the Gemma3:12B Model

Open a terminal and run:

```bash
ollama pull gemma3:12b
```

This will download and setup the Gemma3:12B model (approximately 12GB).

### 3. Start Ollama

In a separate terminal, start the Ollama server:

```bash
ollama serve
```

By default, Ollama runs on `http://localhost:11434`

### 4. Start the Chatbot Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Configuration

You can configure the chatbot via environment variables. Create a `.env` file in the root directory:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
MODEL=gemma3:12b
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `OLLAMA_URL` - Ollama API URL (default: http://localhost:11434)
- `MODEL` - Model name to use (default: gemma3:12b)

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Type your message in the input field
3. Press Enter or click Send
4. Wait for the AI response
5. Continue the conversation

## API Endpoints

### POST `/api/chat`

Send a message and get a response.

**Request:**
```json
{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response",
  "history": [...]
}
```

### POST `/api/clear`

Clear the conversation history.

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

### GET `/api/status`

Check Ollama status and available models.

**Response:**
```json
{
  "ollama_running": true,
  "model_available": true,
  "available_models": ["gemma3:12b"],
  "current_model": "gemma3:12b"
}
```

## Troubleshooting

### Error: "Cannot connect to Ollama"

- Make sure Ollama is running: `ollama serve`
- Check that Ollama is accessible at `http://localhost:11434`
- If using a different port, update the `OLLAMA_URL` in `.env`

### Error: "Model not found"

- Pull the Gemma3:12B model: `ollama pull gemma3:12b`
- List available models: `ollama list`

### Application is slow

- Gemma3:12B requires significant processing power
- Ensure your system has adequate RAM (16GB+ recommended)
- GPU acceleration with Ollama is recommended for faster inference

## Project Structure

```
.
├── server.js              # Express server and API routes
├── package.json           # Node dependencies
├── .env                   # Environment configuration (optional)
└── public/
    └── index.html         # Frontend UI
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **AI/ML**: Ollama, Gemma3:12B
- **HTTP Client**: Axios

## License

MIT

## Support

For issues with:
- **Ollama**: Visit [ollama.ai](https://ollama.ai/)
- **Gemma3**: See [Ollama model library](https://ollama.ai/library/gemma3)
- **This project**: Check the GitHub repository
