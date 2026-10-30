import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { newsService } from './server/newsService.js';
import { mcpServer } from './server/mcpServer.js';
import { telegramService } from './server/telegramService.js';
import { geminiAgent } from './server/geminiService.js';
import { scheduler } from './server/scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Enable CORS for MCP clients and API callers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// --- News & Feeds API ---
app.get('/api/news/top', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string || 'all';
    const limit = parseInt(req.query.limit as string) || 20;
    const articles = await newsService.getTopNews({ category, limit });
    res.json({ success: true, count: articles.length, articles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/news/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 15;
    const results = await newsService.searchNews(q, limit);
    res.json({ success: true, count: results.length, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/news/sources', (req: Request, res: Response) => {
  res.json({ success: true, sources: newsService.getSources() });
});

app.patch('/api/news/sources/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled } = req.body;
  const updated = newsService.updateSourceStatus(id, Boolean(enabled));
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }
  res.json({ success: true, source: updated });
});

app.post('/api/news/sources', (req: Request, res: Response) => {
  const { name, url, category } = req.body;
  if (!name || !url) {
    return res.status(400).json({ success: false, error: 'Name and RSS URL are required' });
  }
  try {
    const newSource = newsService.addSource({
      name,
      url,
      category: category || 'tech',
      enabled: true,
    });
    res.json({ success: true, source: newSource });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/news/sources/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const removed = newsService.removeSource(id);
  res.json({ success: true, removed });
});

// --- MCP Server JSON-RPC & Manifest Endpoints ---
app.get(['/mcp', '/mcp/manifest', '/api/mcp/manifest'], (req: Request, res: Response) => {
  res.json(mcpServer.getManifest());
});

app.post(['/mcp', '/api/mcp'], async (req: Request, res: Response) => {
  try {
    const result = await mcpServer.handleJsonRpc(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: err.message }
    });
  }
});

// Direct Tool Call API for Frontend Playground
app.post('/api/mcp/execute-tool', async (req: Request, res: Response) => {
  try {
    const { name, arguments: toolArgs } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Tool name is required' });
    }
    const result = await mcpServer.executeTool(name, toolArgs || {});
    res.json({ success: true, tool: name, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Telegram Bot API ---
app.post('/api/telegram/verify-bot', async (req: Request, res: Response) => {
  try {
    const token = req.body.token || scheduler.getConfig().telegramBotToken;
    const botInfo = await telegramService.getBotInfo(token);
    res.json({ success: true, bot: botInfo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/telegram/detect-chat-id', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || scheduler.getConfig().telegramBotToken;
    const detected = await telegramService.detectRecentChatId(token);
    if (!detected) {
      return res.json({
        success: false,
        message: 'No recent messages found. Please open your Telegram bot and send /start or any message first, then try again.'
      });
    }
    res.json({ success: true, ...detected });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/telegram/send-test', async (req: Request, res: Response) => {
  try {
    const { token, chatId, text } = req.body;
    const botToken = token || scheduler.getConfig().telegramBotToken;
    const targetChat = chatId || scheduler.getConfig().telegramChatId;
    const message = text || '🚀 <b>NewsPulse Agent Test</b>\n\nYour Telegram bot is successfully connected and ready to receive daily automated news briefs!';

    const result = await telegramService.sendMessage(botToken, targetChat, message, 'HTML');
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Telegram Webhook Handler (allows users to chat with the bot in Telegram)
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    const message = update?.message;
    if (message && message.text) {
      const chatId = String(message.chat.id);
      const text = message.text.trim();
      const botToken = scheduler.getConfig().telegramBotToken;

      if (botToken) {
        if (text === '/start' || text === '/help') {
          const welcome = `👋 <b>Welcome to NewsPulse AI Agent!</b>\n\nI am connected to a Model Context Protocol (MCP) multi-source news engine.\n\nCommands:\n• <code>/news</code> - Get top 5 breaking headlines\n• <code>/summary</code> - Generate today's executive newsletter\n• <code>/status</code> - Check active sources & next schedule`;
          await telegramService.sendMessage(botToken, chatId, welcome, 'HTML');
        } else if (text === '/news') {
          const articles = await newsService.getTopNews({ limit: 5 });
          let reply = `📰 <b>Latest Breaking News via MCP:</b>\n\n`;
          articles.forEach((a, idx) => {
            reply += `${idx + 1}. <b>${a.title}</b>\n<i>${a.source}</i> · <a href="${a.link}">Read Article</a>\n\n`;
          });
          await telegramService.sendMessage(botToken, chatId, reply, 'HTML');
        } else if (text === '/summary') {
          await telegramService.sendMessage(botToken, chatId, '⏳ <i>Synthesizing today\'s curated newsletter from MCP sources using Gemini 3.8 Flash...</i>', 'HTML');
          const articles = await newsService.getTopNews({ limit: 12 });
          const config = scheduler.getConfig();
          const newsletter = await geminiAgent.generateNewsletter({
            articles,
            topics: config.topics,
            tone: config.tone,
            language: config.language,
          });
          const html = telegramService.markdownToTelegramHtml(newsletter.content);
          await telegramService.sendMessage(botToken, chatId, html, 'HTML');
        } else if (text === '/status') {
          const config = scheduler.getConfig();
          const reply = `⚡️ <b>NewsPulse Automation Status:</b>\n• Daily Schedule: <code>${config.scheduledTime}</code> (${config.timezone})\n• Tone: <code>${config.tone}</code>\n• Language: <code>${config.language}</code>\n• Status: ${config.enabled ? '🟢 Active' : '⏸ Paused'}`;
          await telegramService.sendMessage(botToken, chatId, reply, 'HTML');
        }
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(200).json({ ok: false }); // Always acknowledge to Telegram
  }
});

// --- AI Agent Automation Endpoints ---
app.get('/api/agent/config', (req: Request, res: Response) => {
  res.json({ success: true, config: scheduler.getConfig() });
});

app.post('/api/agent/config', (req: Request, res: Response) => {
  try {
    const updated = scheduler.updateConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/agent/generate-preview', async (req: Request, res: Response) => {
  try {
    const { topics, tone, language, customInstructions, articleLimit } = req.body;
    const articles = await newsService.getTopNews({
      category: 'all',
      limit: articleLimit || 12,
    });

    const generated = await geminiAgent.generateNewsletter({
      articles,
      topics: topics || ['ai', 'tech', 'business'],
      tone: tone || 'morning_executive',
      language: language || 'English',
      customInstructions,
    });

    res.json({
      success: true,
      newsletter: generated,
      articles,
      telegramHtmlPreview: telegramService.markdownToTelegramHtml(generated.content),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/agent/run-and-send', async (req: Request, res: Response) => {
  try {
    const triggerType = (req.body.triggerType as 'manual' | 'test' | 'scheduled') || 'manual';
    const result = await scheduler.runPipeline(triggerType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/agent/history', (req: Request, res: Response) => {
  res.json({ success: true, history: scheduler.getHistory() });
});

app.delete('/api/agent/history', (req: Request, res: Response) => {
  scheduler.clearHistory();
  res.json({ success: true });
});

// --- Vite / Static Server integration ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NewsPulse] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[NewsPulse] MCP Server endpoint ready at http://0.0.0.0:${PORT}/mcp`);
  });
}

// Only launch standalone web server if not executing as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
