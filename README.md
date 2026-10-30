# ⚡️ NewsPulse MCP & Telegram AI Agent

> Built with Google AI Studio & Gemini 3.8 Flash · Model Context Protocol (MCP) Server · Autonomous Telegram News Delivery

NewsPulse is a real-time news intelligence platform and **Model Context Protocol (MCP)** server that aggregates news across verified sources, synthesizes curated daily digests using Google Gemini AI, and dispatches them automatically to Telegram.

---

## 🌟 Key Features

- 🔌 **Full Model Context Protocol (MCP) Server**: Exposes JSON-RPC endpoints (`/mcp`, `/api/mcp`) with tools (`get_top_news`, `search_news`, `fetch_feed_sources`, `get_article_details`), prompts, and live resources.
- 🤖 **Autonomous AI Synthesis**: Generates briefings across tones (*Morning Executive*, *Punchy Digest*, *Hinglish Tech Bro*, *Deep Analytical*) in English, Hinglish, or Hindi.
- 📱 **Telegram Bot Integration**: Supports automated daily scheduled broadcasts, real-time interactive Telegram bot commands (`/news`, `/summary`, `/status`), and test dispatches.
- 💻 **Interactive Web Dashboard**: React + Tailwind CSS dashboard with live source management, visual newsletter previewer, and history logs.
- ☁️ **Ready for Local VS Code & Vercel**: Run seamlessly on your local machine with hot reload or deploy the MCP server and web UI to Vercel in minutes.

---

## 🚀 Running Locally in VS Code

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; tested on v22)
- [VS Code](https://code.visualstudio.com/)

### 1. Setup Environment
In the root directory, create your `.env` file (or copy `.env.example`):
```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
```env
# Gemini API Key (Get free key from https://aistudio.google.com/)
GEMINI_API_KEY="your_gemini_api_key"

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN="your_bot_token"

# Telegram Chat ID (from @userinfobot)
TELEGRAM_CHAT_ID="your_chat_id"

PORT=3000
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Dev Server
From your terminal in VS Code:
```bash
npm run dev
```
*(Or press `F5` / click **Run and Debug** in VS Code to use the pre-configured debugger!)*

Open your browser to:
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **MCP Endpoint**: [http://localhost:3000/mcp](http://localhost:3000/mcp)
- **MCP Manifest**: [http://localhost:3000/mcp/manifest](http://localhost:3000/mcp/manifest)

---

## 🔌 Connecting to MCP Clients (Claude Desktop, Cursor, etc.)

NewsPulse provides a standard MCP server interface over HTTP / JSON-RPC.

To connect **Claude Desktop**, add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "newspulse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "http://localhost:3000/mcp"]
    }
  }
}
```

Or when deployed to Vercel:
```json
{
  "mcpServers": {
    "newspulse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://<your-project>.vercel.app/mcp"]
    }
  }
}
```

### Available MCP Tools
- `get_top_news`: Fetch verified top news across categories (tech, AI, crypto, business, science, world).
- `search_news`: Search live articles by custom keywords.
- `fetch_feed_sources`: List all active RSS news feeds and their health metrics.
- `get_article_details`: Retrieve full article content and metadata by ID.

---

## ☁️ Deploying on Vercel

The repository includes `vercel.json` and `api/index.ts` pre-configured to host both the React frontend and the serverless MCP / API routes.

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. Click **Deploy**.

### Option 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

Once deployed, your live MCP endpoint will be:
`https://<your-project>.vercel.app/mcp`

---

## 🛠 Project Structure

```
├── api/
│   └── index.ts          # Vercel Serverless Function entry point
├── server/
│   ├── geminiService.ts  # Gemini 3.8 Flash AI newsletter synthesis
│   ├── mcpServer.ts      # Model Context Protocol JSON-RPC implementation
│   ├── newsService.ts    # Multi-source RSS news aggregator
│   ├── scheduler.ts      # Automated daily scheduler & pipeline
│   ├── telegramService.ts# Telegram Bot messaging & HTML formatting
│   └── types.ts          # Shared TypeScript interfaces
├── src/                  # React + Tailwind CSS Web Dashboard
├── server.ts             # Express & Vite unified dev/prod server
├── vercel.json           # Vercel deployment & routing config
└── .vscode/              # VS Code debug launcher configuration
```

---

## 📜 License
MIT
