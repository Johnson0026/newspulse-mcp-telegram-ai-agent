import React, { useState } from 'react';
import { Send, Clock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Bot, HelpCircle, Sparkles } from 'lucide-react';
import { AgentConfig, TelegramBotInfo } from '../types.js';

interface TelegramViewProps {
  config: AgentConfig;
  onUpdateConfig: (newConfig: Partial<AgentConfig>) => Promise<void>;
}

export const TelegramView: React.FC<TelegramViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [token, setToken] = useState<string>(config.telegramBotToken);
  const [chatId, setChatId] = useState<string>(config.telegramChatId);
  const [scheduledTime, setScheduledTime] = useState<string>(config.scheduledTime);
  const [timezone, setTimezone] = useState<string>(config.timezone);
  const [enabled, setEnabled] = useState<boolean>(config.enabled);

  // Bot Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBot, setVerifiedBot] = useState<TelegramBotInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Auto-Detect Chat ID State
  const [isDetectingChat, setIsDetectingChat] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  // Test Message State
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setToken(config.telegramBotToken);
    setChatId(config.telegramChatId);
    setScheduledTime(config.scheduledTime);
    setTimezone(config.timezone);
    setEnabled(config.enabled);

    if (config.telegramBotToken) {
      fetch('/api/telegram/verify-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: config.telegramBotToken.trim() }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.bot) {
            setVerifiedBot(data.bot);
          }
        })
        .catch(() => {});
    }
  }, [config]);

  const handleVerifyBot = async () => {
    if (!token.trim()) {
      setVerifyError('Please enter a Bot Token first.');
      return;
    }
    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedBot(null);

    try {
      const res = await fetch('/api/telegram/verify-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifiedBot(data.bot);
      } else {
        setVerifyError(data.error || 'Failed to verify bot token.');
      }
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDetectChatId = async () => {
    if (!token.trim()) {
      setDetectMessage('Please verify your Bot Token first.');
      return;
    }
    setIsDetectingChat(true);
    setDetectMessage(null);

    try {
      const res = await fetch(`/api/telegram/detect-chat-id?token=${encodeURIComponent(token.trim())}`);
      const data = await res.json();
      if (data.success && data.chatId) {
        setChatId(data.chatId);
        setDetectMessage(`Found chat with ${data.name || 'User'} (${data.chatId})!`);
      } else {
        setDetectMessage(data.message || 'No messages found. Please send /start to your bot in Telegram first!');
      }
    } catch (err: any) {
      setDetectMessage('Error detecting chat ID: ' + err.message);
    } finally {
      setIsDetectingChat(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!token.trim() || !chatId.trim()) {
      setTestError('Both Bot Token and Chat ID are required to send a test message.');
      return;
    }
    setIsSendingTest(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const res = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          chatId: chatId.trim(),
          text: `🚀 <b>NewsPulse Automation Test</b>\n\nYour Telegram bot is successfully connected and scheduled to deliver daily news briefs at <b>${scheduledTime}</b> (${timezone}).\n\nPowered by <i>MCP Multi-Source News Engine & Gemini 3.8 Flash</i>.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSuccess(true);
      } else {
        setTestError(data.error || 'Telegram delivery failed.');
      }
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveAutomation = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig({
        telegramBotToken: token.trim(),
        telegramChatId: chatId.trim(),
        scheduledTime,
        timezone,
        enabled,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Automation &amp; Daily Scheduler</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Telegram News Delivery Configuration
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Configure your Telegram Bot token and target chat. The scheduler runs automatically every day
          at your selected time, triggers the MCP news fetcher, generates the newsletter via Gemini, and
          sends it straight to your Telegram chat.
        </p>
      </div>

      {/* 4-Step Setup Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1 & 2: Bot Token Configuration */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-base font-semibold text-white">Telegram Bot Token</h3>
              </div>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
              >
                <span>Open @BotFather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Open Telegram, search for <strong>@BotFather</strong>, send <code>/newbot</code>, give it a name,
              and copy the provided HTTP API token here.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Bot Token (from BotFather)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 7123456789:AAHq..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyBot}
                  disabled={isVerifying}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Bot'}
                </button>
              </div>

              {verifiedBot && (
                <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Connected to <strong>{verifiedBot.first_name}</strong> (@{verifiedBot.username})
                    </span>
                  </div>
                  {verifiedBot.username && (
                    <a
                      href={`https://t.me/${verifiedBot.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-200 bg-emerald-900/50 hover:bg-emerald-900/80 rounded border border-emerald-700/50 transition-colors shrink-0"
                    >
                      <span>Open Bot on Telegram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {verifyError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Target Chat ID */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-base font-semibold text-white">Target Telegram Chat ID</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Open your bot in Telegram and send <code>/start</code>. Then click <strong>&ldquo;Auto-Detect My Chat ID&rdquo;</strong> below, or paste your numerical Chat ID or channel username (e.g. <code>@my_channel</code>).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Chat ID / Channel
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 123456789 or @my_newsletter_channel"
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleDetectChatId}
                  disabled={isDetectingChat}
                  className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isDetectingChat ? 'Detecting...' : 'Auto-Detect Chat ID'}</span>
                </button>
              </div>

              {detectMessage && (
                <p className="text-xs text-indigo-300 font-medium">{detectMessage}</p>
              )}
            </div>
          </div>

          {/* Step 4: Schedule Daily Delivery */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-base font-semibold text-white">Daily Automation Schedule</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Automation:</span>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {enabled ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Daily Delivery Time (24h format)
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleSendTestMessage}
              disabled={isSendingTest}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isSendingTest ? 'Sending Test...' : 'Send Test Message Now'}</span>
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings Saved!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAutomation}
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm text-center"
              >
                {isSaving ? 'Saving...' : 'Save Automation Settings'}
              </button>
            </div>
          </div>

          {testSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Test message delivered successfully to your Telegram chat! Check your Telegram app.</span>
            </div>
          )}

          {testError && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{testError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Telegram Interactive Commands & Help */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Bot Interactive Commands</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once connected, you or anyone in the chat can send these commands directly to the bot on Telegram:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                <span className="text-indigo-400 font-bold">/summary</span>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                  Synthesizes today&apos;s executive newsletter immediately from live MCP sources.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                <span className="text-indigo-400 font-bold">/news</span>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                  Returns top 5 breaking headlines with clickable links.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                <span className="text-indigo-400 font-bold">/status</span>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                  Checks schedule status, active sources count, and next delivery time.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                <span className="text-indigo-400 font-bold">/start</span>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                  Initializes conversation and registers your Chat ID.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>How The Automation Runs</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>The server background scheduler ticks every 30 seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>At <strong>{scheduledTime}</strong> ({timezone}), it executes the MCP query tool to gather the freshest articles across your configured feeds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>Gemini 3.8 Flash synthesizes the newsletter in your selected style/tone.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>The final newsletter is sent to your Telegram chat ID with rich HTML formatting!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
