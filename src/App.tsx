import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar.js';
import { DashboardView } from './components/DashboardView.js';
import { McpServerView } from './components/McpServerView.js';
import { AiAgentView } from './components/AiAgentView.js';
import { TelegramView } from './components/TelegramView.js';
import { FeedsAndLogsView } from './components/FeedsAndLogsView.js';
import { PipelineModal } from './components/PipelineModal.js';
import { AgentConfig, DeliveryLog, NewsArticle, NewsSource } from './types.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [config, setConfig] = useState<AgentConfig>({
    enabled: true,
    scheduledTime: '08:30',
    timezone: 'UTC',
    topics: ['ai', 'tech', 'business', 'world'],
    tone: 'morning_executive',
    language: 'English',
    telegramBotToken: '',
    telegramChatId: '',
    customPrompt: '',
    articleLimit: 12,
    lastRunTimestamp: null,
    nextRunTimestamp: null,
  });

  const [sources, setSources] = useState<NewsSource[]>([]);
  const [history, setHistory] = useState<DeliveryLog[]>([]);
  const [topArticles, setTopArticles] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);

  // Pipeline execution modal
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineResultData, setPipelineResultData] = useState<any>(null);

  // Initial Data Fetch
  useEffect(() => {
    loadConfig();
    loadSources();
    loadHistory();
    loadTopNews();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/agent/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.warn('Failed to fetch config:', err);
    }
  };

  const loadSources = async () => {
    try {
      const res = await fetch('/api/news/sources');
      const data = await res.json();
      if (data.success && data.sources) {
        setSources(data.sources);
      }
    } catch (err) {
      console.warn('Failed to fetch sources:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/agent/history');
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    }
  };

  const loadTopNews = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch('/api/news/top?limit=15');
      const data = await res.json();
      if (data.success && data.articles) {
        setTopArticles(data.articles);
      }
    } catch (err) {
      console.warn('Failed to fetch news:', err);
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleUpdateConfig = async (updates: Partial<AgentConfig>) => {
    const res = await fetch('/api/agent/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success && data.config) {
      setConfig(data.config);
    }
  };

  const handleToggleSource = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/news/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (data.success) {
      setSources(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    }
  };

  const handleAddSource = async (newSource: { name: string; url: string; category: any }) => {
    const res = await fetch('/api/news/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource),
    });
    const data = await res.json();
    if (data.success && data.source) {
      setSources(prev => [...prev, data.source]);
    } else {
      throw new Error(data.error || 'Failed to add source');
    }
  };

  const handleRemoveSource = async (id: string) => {
    await fetch(`/api/news/sources/${id}`, { method: 'DELETE' });
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleClearHistory = async () => {
    await fetch('/api/agent/history', { method: 'DELETE' });
    setHistory([]);
  };

  const handleTriggerPipeline = async () => {
    setIsPipelineModalOpen(true);
    setPipelineStatus('running');
    setPipelineLogs([
      'Starting autonomous execution...',
      'Invoking Model Context Protocol (MCP) server endpoints...',
    ]);
    setPipelineResultData(null);

    try {
      const res = await fetch('/api/agent/run-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual' }),
      });
      const data = await res.json();

      if (data.success) {
        setPipelineStatus('success');
        setPipelineLogs(data.logs || ['Execution complete!']);
        setPipelineResultData({
          newsletter: data.newsletter,
          articlesCount: data.articlesCount,
          telegramStatus: data.telegramStatus,
          executionTimeMs: data.executionTimeMs,
        });
      } else {
        setPipelineStatus('error');
        setPipelineLogs(prev => [...prev, `Execution failed: ${data.error}`]);
      }
    } catch (err: any) {
      setPipelineStatus('error');
      setPipelineLogs(prev => [...prev, `Network error: ${err.message}`]);
    } finally {
      loadHistory();
      loadTopNews();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Universal Top Bar */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onTriggerPipeline={handleTriggerPipeline}
        isExecuting={pipelineStatus === 'running'}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            config={config}
            sources={sources}
            history={history}
            topArticles={topArticles}
            isLoadingNews={isLoadingNews}
            onRefreshNews={loadTopNews}
            onTriggerPipeline={handleTriggerPipeline}
            isExecuting={pipelineStatus === 'running'}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'mcp' && (
          <McpServerView sources={sources} />
        )}

        {currentTab === 'agent' && (
          <AiAgentView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onTriggerPipeline={handleTriggerPipeline}
            isExecuting={pipelineStatus === 'running'}
          />
        )}

        {currentTab === 'telegram' && (
          <TelegramView
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {currentTab === 'feeds' && (
          <FeedsAndLogsView
            sources={sources}
            history={history}
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSource}
            onRemoveSource={handleRemoveSource}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Real-time Multi-Step Pipeline Modal */}
      <PipelineModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        status={pipelineStatus}
        logs={pipelineLogs}
        resultData={pipelineResultData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">NewsPulse MCP</span>
            <span>·</span>
            <span>Model Context Protocol Standard 2024-11-05</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>·</span>
            <span>Telegram Bot API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
