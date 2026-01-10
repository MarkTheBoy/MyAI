# Gemini Chatbot

A JavaScript chatbot powered by Google Gemini API.

## Features

- 🤖 Real-time chat interface with Gemini
- 💬 Conversation history management
- 🎨 Modern, responsive UI (Gemini-inspired theme)
- 📱 Mobile-friendly design
- 🔄 Clear conversation history
- 🎯 Status indicator for Gemini connection

## Prerequisites

- Node.js 16+ (recommend latest LTS)
- A Google AI Studio API key with access to Gemini (e.g., `gemini-2.5-flash`, `gemini-2.5-pro`)

## Setup

1) Install dependencies

```bash
npm install
```

2) Configure environment

Create `.env` (use `.env.example` as a template):

```env
PORT=3000
GEMINI_API_KEYS=key1,key2,key3,key4,key5
GEMINI_MODEL=gemini-2.5-flash
```

> Keep your real API key in `.env`; never commit it. `.gitignore` already excludes `.env`.

3) Run the app

```bash
npm start
```

Open http://localhost:3000 and chat.

## Environment Variables

- `PORT` – server port (default: 3000)
- `GEMINI_API_KEY` – **required** Gemini API key (keep private)
- `GEMINI_MODEL` – model name, e.g. `gemini-2.5-flash`, `gemini-2.5-pro`

## Usage

1. Start the server: `npm start`
2. Visit `http://localhost:3000`
3. Chat in the UI; clear history with the Clear button

## API Endpoints

- POST `/api/chat`
  - Request: `{ "message": "hello" }`
  - Response: `{ "success": true, "message": "...", "history": [...] }`

- POST `/api/clear`
  - Clears conversation history

- GET `/api/status`
  - Returns Gemini connectivity, configured model, and available models

## Troubleshooting

- **Cannot connect to Gemini / 403**: verify `GEMINI_API_KEY` and that your key has access to the chosen model.
- **Model not available / 404**: set `GEMINI_MODEL` to one listed in `available_models` from `/api/status` (e.g., `gemini-2.5-flash`).
- **Quoted keys**: ensure `.env` does not wrap the API key in quotes.

## Project Structure

```
.
├── server.js              # Express server and API routes (Gemini)
├── package.json           # Node dependencies
├── .env                   # Local secrets (not committed)
├── .env.example           # Template with placeholders
└── public/
    └── index.html         # Frontend UI
```

## Notes on secrets

- Do not commit `.env` or real keys. Use placeholders in docs and `.env.example`.
- `.gitignore` already excludes `.env` and `node_modules/`.

## License

MIT
