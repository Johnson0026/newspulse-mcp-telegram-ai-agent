export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: 'ai' | 'tech' | 'business' | 'science' | 'world' | 'crypto';
  summary: string;
  author?: string;
  thumbnail?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: 'ai' | 'tech' | 'business' | 'science' | 'world' | 'crypto';
  enabled: boolean;
  lastFetched?: string;
  articleCount?: number;
  status: 'healthy' | 'error' | 'pending';
}

export interface AgentConfig {
  enabled: boolean;
  scheduledTime: string;
  timezone: string;
  topics: ('ai' | 'tech' | 'business' | 'science' | 'world' | 'crypto')[];
  tone: 'morning_executive' | 'punchy_digest' | 'hinglish_tech_bro' | 'deep_analytical';
  language: 'English' | 'Hinglish' | 'Hindi';
  telegramBotToken: string;
  telegramChatId: string;
  customPrompt?: string;
  articleLimit: number;
  lastRunTimestamp: string | null;
  nextRunTimestamp: string | null;
}

export interface DeliveryLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'running';
  articleCount: number;
  sourcesUsed: string[];
  newsletterTitle: string;
  content: string;
  telegramMessageId?: number;
  error?: string;
  triggerType: 'scheduled' | 'manual' | 'test';
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
}
