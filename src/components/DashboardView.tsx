import React from 'react';
import { Play, Send, Clock, Cpu, Newspaper, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Copy, Check, MessageSquare } from 'lucide-react';
import { AgentConfig, DeliveryLog, NewsArticle, NewsSource } from '../types.js';

interface DashboardViewProps {
  config: AgentConfig;
  sources: NewsSource[];
  history: DeliveryLog[];
  topArticles: NewsArticle[];
  isLoadingNews: boolean;
  onRefreshNews: () => void;
  onTriggerPipeline: () => void;
  isExecuting: boolean;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  sources,
  history,
  topArticles,
  isLoadingNews,
  onRefreshNews,
  onTriggerPipeline,
  isExecuting,
  onNavigateTab,
}) => {
  const [copiedPreview, setCopiedPreview] = React.useState(false);
  const activeSourcesCount = sources.filter(s => s.enabled).length;

  const latestNewsletter = history.find(h => h.status === 'success' && h.content) || {
    newsletterTitle: '🌅 NewsPulse Executive Brief',
    content: `🌅 **NewsPulse Daily Intelligence Brief**\n\nWelcome to your morning intelligence briefing, synthesized from verified multi-source MCP feeds.\n\n## ⚡️ Top Story of the Day\n**Frontier AI Agent Architectures Surpass Execution Benchmarks**\nAutonomous agent protocols integrating Model Context Protocol (MCP) and dynamic tool streaming demonstrate major breakthroughs in complex workflow automation.\n🔗 *Source:* [TechCrunch](https://techcrunch.com)\n\n## 🌐 Core Developments\n• **Global Semiconductor & Cloud Infrastructure Demand Surges**: Hyperscalers accelerate next-gen datacenter investments. [The Verge](https://theverge.com)\n• **New Open Agent Frameworks Released**: Developers adopt unified context protocol specifications. [Hacker News](https://news.ycombinator.com)\n\n## 💡 Key Takeaway\nAutonomous workflows and MCP-grounded news agents are transforming developer intelligence into real-time briefings.`,
    timestamp: new Date().toISOString(),
    articleCount: 12,
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(latestNewsletter.content);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">MCP News Feeds</span>
            <Newspaper className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {activeSourcesCount}/{sources.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Active & Online</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Multi-source RSS Aggregation</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Daily Schedule</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {config.scheduledTime}
            </span>
            <span className="text-xs text-slate-400">{config.timezone}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {config.enabled ? 'Automated Dispatch Active' : 'Scheduler Paused'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Agent Model</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-white truncate">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Style: <span className="capitalize text-slate-300">{config.tone.replace(/_/g, ' ')}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Telegram Target</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight text-white font-mono truncate">
              {config.telegramChatId ? `Chat: ${config.telegramChatId}` : 'Not Configured'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('telegram')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-1 inline-flex items-center gap-1 cursor-pointer"
          >
            {config.telegramBotToken ? 'Settings & Webhook →' : 'Setup Bot Token →'}
          </button>
        </div>
      </div>

      {/* Hero Pipeline Action Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wide uppercase">
            <span>Model Context Protocol + Telegram Automation</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Autonomous Daily News Newsletter Dispatcher
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The MCP server fetches real-time breaking news across multiple global feeds.
            The AI Agent clusters, analyzes, and formats the headlines into a curated newsletter, then dispatches it directly to your Telegram chat every day.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('agent')}
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-center cursor-pointer"
          >
            Configure Prompts & Tone
          </button>
          <button
            onClick={onTriggerPipeline}
            disabled={isExecuting}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Running Pipeline...' : 'Run Agent & Dispatch Now'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Telegram Preview & Live News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Telegram Visual Bubble Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">
                Telegram Newsletter Output
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPreview}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {copiedPreview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPreview ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => onNavigateTab('agent')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Customize Tone →
              </button>
            </div>
          </div>

          {/* Telegram Phone / Chat Bubble Mockup */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            {/* Telegram Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-850 border-b border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                NP
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">NewsPulse Daily Bot</div>
                <div className="text-[11px] text-sky-400">bot · automated publisher</div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {config.scheduledTime}
              </div>
            </div>

            {/* Telegram Message Area */}
            <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900/90 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-3 max-h-[500px] overflow-y-auto">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm space-y-2.5">
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-200">
                  {latestNewsletter.content}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span>Generated via Gemini 3.8 Flash & MCP</span>
                  <span className="font-mono">{new Date(latestNewsletter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Ingested News from MCP */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">
                Live Ingested MCP News
              </h3>
            </div>
            <button
              onClick={onRefreshNews}
              disabled={isLoadingNews}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingNews ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {isLoadingNews ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Querying multi-source news feeds via MCP...
              </div>
            ) : topArticles.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 rounded-xl border border-slate-800">
                No articles indexed yet. Click Refresh to query feeds.
              </div>
            ) : (
              topArticles.slice(0, 7).map((article) => (
                <div
                  key={article.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-400">{article.source}</span>
                    <span className="font-mono">{new Date(article.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="capitalize text-slate-400">{article.category}</span>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Read</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Automation Deliveries</h3>
          <button
            onClick={() => onNavigateTab('feeds')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            View Full Log Archive →
          </button>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No delivery runs recorded yet. Click &ldquo;Run Agent &amp; Dispatch Now&rdquo; to execute the first run!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Trigger</th>
                    <th className="py-3 px-4 font-medium">Articles</th>
                    <th className="py-3 px-4 font-medium">Newsletter Title</th>
                    <th className="py-3 px-4 font-medium text-right">Telegram ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {history.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                          </span>
                        ) : log.status === 'running' ? (
                          <span className="inline-flex items-center gap-1 text-indigo-400 font-medium">
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-400">{log.triggerType}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{log.articleCount}</td>
                      <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                        {log.newsletterTitle || 'News Brief'}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-slate-400">
                        {log.telegramMessageId ? `#${log.telegramMessageId}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
