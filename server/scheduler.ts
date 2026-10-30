import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentConfig, DeliveryLog } from './types.js';
import { mcpServer } from './mcpServer.js';
import { geminiAgent } from './geminiService.js';
import { telegramService } from './telegramService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = process.env.VERCEL 
  ? '/tmp/agent-data.json' 
  : path.resolve(__dirname, '../agent-data.json');
const INITIAL_DATA_FILE = path.resolve(__dirname, '../agent-data.json');

class AutomationScheduler {
  private config: AgentConfig = {
    enabled: true,
    scheduledTime: '08:30',
    timezone: 'Asia/Kolkata',
    topics: ['ai', 'tech', 'business', 'world'],
    tone: 'hinglish_tech_bro',
    language: 'Hinglish',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    customPrompt: 'Focus on impactful AI announcements, developer tools, and notable macroeconomic developments.',
    articleLimit: 12,
    lastRunTimestamp: null,
    nextRunTimestamp: null,
  };

  private history: DeliveryLog[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isExecuting: boolean = false;

  constructor() {
    this.loadPersistedData();
    this.updateNextRunTimestamp();
    if (!process.env.VERCEL) {
      this.startTicker();
    }
  }

  private loadPersistedData(): void {
    try {
      const sourceFile = fs.existsSync(DATA_FILE) 
        ? DATA_FILE 
        : (fs.existsSync(INITIAL_DATA_FILE) ? INITIAL_DATA_FILE : null);

      if (sourceFile) {
        const raw = fs.readFileSync(sourceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.config) {
          this.config = {
            ...this.config,
            ...parsed.config,
            telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || parsed.config.telegramBotToken || this.config.telegramBotToken,
            telegramChatId: process.env.TELEGRAM_CHAT_ID || parsed.config.telegramChatId || this.config.telegramChatId,
          };
        }
        if (Array.isArray(parsed.history)) {
          this.history = parsed.history;
        }
      }
    } catch (e) {
      console.warn('Could not read agent-data.json:', e);
    }
  }

  private persistData(): void {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({ config: this.config, history: this.history.slice(0, 50) }, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.warn('Could not write agent-data.json:', e);
    }
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AgentConfig>): AgentConfig {
    this.config = {
      ...this.config,
      ...updates,
    };
    this.updateNextRunTimestamp();
    this.persistData();
    return this.getConfig();
  }

  public getHistory(): DeliveryLog[] {
    return this.history;
  }

  public clearHistory(): void {
    this.history = [];
    this.persistData();
  }

  private updateNextRunTimestamp(): void {
    if (!this.config.enabled) {
      this.config.nextRunTimestamp = null;
      return;
    }

    try {
      const [targetHours, targetMinutes] = this.config.scheduledTime.split(':').map(Number);
      const now = new Date();
      
      // Calculate next run date
      const next = new Date(now);
      next.setHours(targetHours || 8, targetMinutes || 30, 0, 0);

      if (next.getTime() <= now.getTime()) {
        // If already passed today, schedule for tomorrow
        next.setDate(next.getDate() + 1);
      }

      this.config.nextRunTimestamp = next.toISOString();
    } catch (e) {
      console.warn('Failed to calculate next run timestamp:', e);
    }
  }

  private startTicker(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.checkAndTriggerScheduledRun();
    }, 30 * 1000); // Check every 30 seconds
  }

  private async checkAndTriggerScheduledRun(): Promise<void> {
    if (!this.config.enabled || this.isExecuting) return;
    if (!this.config.telegramBotToken || !this.config.telegramChatId) return;

    const now = new Date();
    const [schedHour, schedMin] = this.config.scheduledTime.split(':').map(Number);

    // Format current time in user's specified timezone (fallback to UTC)
    let currentHour = now.getUTCHours();
    let currentMin = now.getUTCMinutes();
    let currentDateKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

    try {
      const tzString = now.toLocaleTimeString('en-US', {
        timeZone: this.config.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      const [tzH, tzM] = tzString.split(':').map(Number);
      currentHour = tzH;
      currentMin = tzM;

      const dateStr = now.toLocaleDateString('en-US', { timeZone: this.config.timezone });
      currentDateKey = dateStr;
    } catch {
      // Use UTC
    }

    // Check if within matching minute
    if (currentHour === schedHour && currentMin === schedMin) {
      // Ensure we haven't already run in this window today
      if (this.config.lastRunTimestamp) {
        const lastRun = new Date(this.config.lastRunTimestamp);
        const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);
        if (diffMinutes < 5) {
          return; // Already executed today in this window
        }
      }

      console.log(`[Scheduler] Triggering daily news automation for scheduled time ${this.config.scheduledTime} (${this.config.timezone})...`);
      await this.runPipeline('scheduled');
    }
  }

  /**
   * Run the full AI Agent News pipeline:
   * 1. Query MCP tools to fetch news across categories
   * 2. Synthesize newsletter with Gemini
   * 3. Send to Telegram
   */
  public async runPipeline(triggerType: 'scheduled' | 'manual' | 'test' = 'manual'): Promise<{
    success: boolean;
    newsletter: any;
    articlesCount: number;
    telegramStatus: { sent: boolean; messageId?: number; error?: string };
    executionTimeMs: number;
    logs: string[];
  }> {
    if (this.isExecuting) {
      throw new Error('Pipeline is already running a task.');
    }

    this.isExecuting = true;
    const startTime = Date.now();
    const logs: string[] = [];

    const deliveryRecord: DeliveryLog = {
      id: 'del-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      status: 'running',
      articleCount: 0,
      sourcesUsed: [],
      newsletterTitle: 'Processing...',
      content: '',
      triggerType,
    };
    this.history.unshift(deliveryRecord);

    try {
      logs.push(`[1/4] Querying MCP Server tools for latest news across: ${this.config.topics.join(', ')}...`);

      // Step 1: Use MCP Tool get_top_news
      const mcpResult = await mcpServer.executeTool('get_top_news', {
        category: 'all',
        limit: this.config.articleLimit || 15,
      });

      const rawArticles = mcpResult.articles || [];
      const sourcesUsed = Array.from(new Set(rawArticles.map((a: any) => a.source))) as string[];
      deliveryRecord.sourcesUsed = sourcesUsed;
      deliveryRecord.articleCount = rawArticles.length;
      logs.push(`[2/4] Retrieved ${rawArticles.length} articles from ${sourcesUsed.length} MCP sources (${sourcesUsed.join(', ')}).`);

      // Step 2: Use Gemini to synthesize newsletter
      logs.push(`[3/4] Synthesizing newsletter with Gemini 3.8 Flash (Tone: ${this.config.tone}, Language: ${this.config.language})...`);
      const generated = await geminiAgent.generateNewsletter({
        articles: rawArticles,
        topics: this.config.topics,
        tone: this.config.tone,
        language: this.config.language,
        customInstructions: this.config.customPrompt,
      });

      deliveryRecord.newsletterTitle = generated.title;
      deliveryRecord.content = generated.content;
      logs.push(`[3/4] Newsletter synthesized: "${generated.title}". Ready for Telegram formatting.`);

      // Step 3: Send to Telegram if configured
      let telegramStatus: { sent: boolean; messageId?: number; error?: string } = { sent: false };

      if (this.config.telegramBotToken && this.config.telegramChatId) {
        logs.push(`[4/4] Dispatching newsletter to Telegram Chat ID: ${this.config.telegramChatId}...`);
        try {
          const htmlContent = telegramService.markdownToTelegramHtml(generated.content);
          const tgResult = await telegramService.sendMessage(
            this.config.telegramBotToken,
            this.config.telegramChatId,
            htmlContent,
            'HTML'
          );

          telegramStatus = {
            sent: true,
            messageId: tgResult.messageId,
          };
          deliveryRecord.telegramMessageId = tgResult.messageId;
          deliveryRecord.status = 'success';
          logs.push(`[4/4] Successfully delivered to Telegram! Message ID: #${tgResult.messageId}`);
        } catch (tgErr: any) {
          telegramStatus = {
            sent: false,
            error: tgErr.message || 'Telegram delivery failed',
          };
          deliveryRecord.status = 'failed';
          deliveryRecord.error = tgErr.message;
          logs.push(`[4/4] Telegram delivery warning: ${tgErr.message}`);
        }
      } else {
        logs.push(`[4/4] Telegram Bot Token or Chat ID not configured. Generated preview saved to dashboard.`);
        deliveryRecord.status = 'success';
      }

      this.config.lastRunTimestamp = new Date().toISOString();
      this.updateNextRunTimestamp();
      this.persistData();

      const executionTimeMs = Date.now() - startTime;
      return {
        success: deliveryRecord.status === 'success',
        newsletter: generated,
        articlesCount: rawArticles.length,
        telegramStatus,
        executionTimeMs,
        logs,
      };
    } catch (err: any) {
      deliveryRecord.status = 'failed';
      deliveryRecord.error = err.message || 'Pipeline failed';
      logs.push(`Error executing news pipeline: ${err.message}`);
      throw err;
    } finally {
      this.isExecuting = false;
    }
  }
}

export const scheduler = new AutomationScheduler();
