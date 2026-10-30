import React, { useState } from 'react';
import { Newspaper, Rss, Plus, CheckCircle2, AlertCircle, Trash2, ExternalLink, RefreshCw, Eye, Copy, Check, X } from 'lucide-react';
import { DeliveryLog, NewsSource } from '../types.js';

interface FeedsAndLogsViewProps {
  sources: NewsSource[];
  history: DeliveryLog[];
  onToggleSource: (id: string, enabled: boolean) => Promise<void>;
  onAddSource: (source: { name: string; url: string; category: any }) => Promise<void>;
  onRemoveSource: (id: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
}

export const FeedsAndLogsView: React.FC<FeedsAndLogsViewProps> = ({
  sources,
  history,
  onToggleSource,
  onAddSource,
  onRemoveSource,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'feeds' | 'logs'>('feeds');

  // Add source form state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState<string>('tech');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // View log modal state
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  const handleAddSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    setIsSubmitting(true);
    setAddError(null);
    try {
      await onAddSource({
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
        category: newSourceCategory,
      });
      setNewSourceName('');
      setNewSourceUrl('');
      setIsAddingSource(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add RSS source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLog = () => {
    if (selectedLog?.content) {
      navigator.clipboard.writeText(selectedLog.content);
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Feeds &amp; Delivery Archive
          </h2>
          <p className="text-sm text-slate-400">
            Manage multi-source news inputs and inspect past automated newsletter dispatches.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('feeds')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'feeds'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            News Sources ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivery Logs ({history.length})
          </button>
        </div>
      </div>

      {/* Tab: Feeds Management */}
      {activeTab === 'feeds' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              The MCP server aggregates and deduplicates articles across these verified RSS feeds:
            </span>
            <button
              onClick={() => setIsAddingSource(!isAddingSource)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom RSS Feed</span>
            </button>
          </div>

          {/* Add Source Drawer / Form */}
          {isAddingSource && (
            <form onSubmit={handleAddSourceSubmit} className="p-5 rounded-xl bg-slate-900 border border-indigo-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Add New RSS News Source</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingSource(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Name</label>
                  <input
                    type="text"
                    required
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="e.g. OpenAI Blog RSS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">RSS / Atom URL</label>
                  <input
                    type="url"
                    required
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://.../feed.xml"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newSourceCategory}
                    onChange={(e) => setNewSourceCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ai">AI & Machine Learning</option>
                    <option value="tech">Technology</option>
                    <option value="business">Business & Finance</option>
                    <option value="science">Science</option>
                    <option value="crypto">Crypto & Web3</option>
                    <option value="world">World News</option>
                  </select>
                </div>
              </div>

              {addError && (
                <p className="text-xs text-rose-400">{addError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingSource(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Add Feed'}
                </button>
              </div>
            </form>
          )}

          {/* Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{source.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-800/80">
                      {source.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-sm">{source.url}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Online
                    </span>
                    <span>{source.articleCount || 0} articles</span>
                    {source.lastFetched && (
                      <span>Fetched {new Date(source.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleSource(source.id, !source.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      source.enabled
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => onRemoveSource(source.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="Remove source"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Delivery Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Audit trail of newsletters generated and dispatched to Telegram:
            </span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            {history.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No past deliveries recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {history.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {log.status === 'success' ? 'Delivered' : 'Failed'}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-white font-medium truncate">{log.newsletterTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span>{log.articleCount} articles</span>
                        <span className="capitalize">{log.triggerType} trigger</span>
                        {log.telegramMessageId && (
                          <span className="text-indigo-400">Telegram #{log.telegramMessageId}</span>
                        )}
                      </div>
                      {log.error && (
                        <p className="text-xs text-rose-400 font-mono">{log.error}</p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-white">{selectedLog.newsletterTitle}</h4>
                <p className="text-xs text-slate-400 font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {selectedLog.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                {selectedLog.telegramMessageId ? `Telegram Msg ID: #${selectedLog.telegramMessageId}` : 'Preview only'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLog}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLog ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
