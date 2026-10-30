import React, { useState } from 'react';
import { Cpu, Sparkles, Send, Copy, Check, RefreshCw, Layers, BookOpen, MessageSquare, CheckCircle2 } from 'lucide-react';
import { AgentConfig, NewsArticle } from '../types.js';

interface AiAgentViewProps {
  config: AgentConfig;
  onUpdateConfig: (newConfig: Partial<AgentConfig>) => Promise<void>;
  onTriggerPipeline: () => void;
  isExecuting: boolean;
}

export const AiAgentView: React.FC<AiAgentViewProps> = ({
  config,
  onUpdateConfig,
  onTriggerPipeline,
  isExecuting,
}) => {
  const [topics, setTopics] = useState<string[]>(config.topics);
  const [tone, setTone] = useState<AgentConfig['tone']>(config.tone);
  const [language, setLanguage] = useState<AgentConfig['language']>(config.language);
  const [customPrompt, setCustomPrompt] = useState<string>(config.customPrompt || '');
  const [articleLimit, setArticleLimit] = useState<number>(config.articleLimit || 12);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live generation sandbox
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewNewsletter, setPreviewNewsletter] = useState<any>(null);
  const [previewArticles, setPreviewArticles] = useState<NewsArticle[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<'telegram' | 'markdown' | 'sources'>('telegram');
  const [copied, setCopied] = useState(false);

  const toggleTopic = (t: string) => {
    if (topics.includes(t)) {
      if (topics.length > 1) {
        setTopics(topics.filter(item => item !== t));
      }
    } else {
      setTopics([...topics, t]);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig({
        topics: topics as any,
        tone,
        language,
        customPrompt,
        articleLimit,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const res = await fetch('/api/agent/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          tone,
          language,
          customInstructions: customPrompt,
          articleLimit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewNewsletter(data.newsletter);
        setPreviewArticles(data.articles || []);
      }
    } catch (err: any) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCopy = () => {
    if (previewNewsletter?.content) {
      navigator.clipboard.writeText(previewNewsletter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>Part 2 · Gemini 3.8 Flash Agent Intelligence</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          AI News Newsletter Agent Studio
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          The AI Agent queries the MCP News Server, extracts raw multi-source articles, and
          intelligently synthesizes them into an editorial morning newsletter tailored for Telegram.
          Customize the editorial tone (including conversational Hinglish), select topic focus, and test live outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Agent Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-base font-semibold text-white">Editorial Agent Directives</h3>

            {/* Topic Focus */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Topics &amp; Coverage Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ai', label: 'AI & Machine Learning' },
                  { id: 'tech', label: 'Tech & Engineering' },
                  { id: 'business', label: 'Markets & Business' },
                  { id: 'science', label: 'Science & Biotech' },
                  { id: 'crypto', label: 'Crypto & Web3' },
                  { id: 'world', label: 'Global Affairs' },
                ].map((item) => {
                  const active = topics.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTopic(item.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer border ${
                        active
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newsletter Tone Persona */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Editorial Persona &amp; Tone
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'morning_executive',
                    name: 'Morning Executive Brief',
                    desc: 'Polished, authoritative, balanced perspectives with clear section dividers.',
                  },
                  {
                    id: 'hinglish_tech_bro',
                    name: 'Hinglish Tech Bro 🇮🇳',
                    desc: 'High-energy conversational Hindi + English mix (e.g. "Aaj ka bada update...", "Kyu matter karta hai").',
                  },
                  {
                    id: 'punchy_digest',
                    name: 'Punchy 2-Minute Digest',
                    desc: 'Zero fluff, rapid-fire bulleted takeaways and 1-line impact summaries.',
                  },
                  {
                    id: 'deep_analytical',
                    name: 'Deep Analytical',
                    desc: 'In-depth focus on system implications, funding rounds, and technical significance.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTone(item.id as any)}
                    className={`w-full p-3 rounded-lg text-left transition-colors cursor-pointer border ${
                      tone === item.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Output Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Hinglish">Hinglish (Hindi + English)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  MCP Article Pool Limit
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={articleLimit}
                  onChange={(e) => setArticleLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Custom Instructions Prompt */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Custom Prompt Directives
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Highlight open source LLM benchmarks, developer tooling, and exclude rumors..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Agent Configuration'}
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Form: Live Generation Sandbox */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">Live Newsletter Sandbox</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fetch live articles from MCP server and synthesize with Gemini 3.8 Flash right now.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isPreviewLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isPreviewLoading ? 'animate-spin' : ''}`} />
                <span>{isPreviewLoading ? 'Synthesizing with Gemini...' : 'Generate Live Preview'}</span>
              </button>
            </div>

            {/* Preview Tabs */}
            {previewNewsletter ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg">
                    <button
                      onClick={() => setActivePreviewTab('telegram')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        activePreviewTab === 'telegram'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Telegram Chat Bubble
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('markdown')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        activePreviewTab === 'markdown'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Raw Markdown
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('sources')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        activePreviewTab === 'sources'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      MCP Sources ({previewArticles.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={onTriggerPipeline}
                      disabled={isExecuting}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send to Telegram</span>
                    </button>
                  </div>
                </div>

                {/* Tab Views */}
                {activePreviewTab === 'telegram' && (
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed text-sm text-slate-200 whitespace-pre-wrap">
                    {previewNewsletter.content}
                  </div>
                )}

                {activePreviewTab === 'markdown' && (
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-[500px] overflow-y-auto text-xs font-mono text-indigo-300 leading-relaxed">
                    {previewNewsletter.content}
                  </pre>
                )}

                {activePreviewTab === 'sources' && (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {previewArticles.map((art, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-indigo-400">{art.source}</span>
                          <span className="capitalize">{art.category}</span>
                        </div>
                        <h5 className="font-medium text-white">{art.title}</h5>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{art.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-indigo-400 opacity-60" />
                <p>Click &ldquo;Generate Live Preview&rdquo; to test your current editorial configuration against live MCP news.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
