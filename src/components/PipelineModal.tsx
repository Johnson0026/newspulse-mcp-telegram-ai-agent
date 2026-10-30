import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Send, Cpu, Newspaper, ExternalLink, Copy, Check } from 'lucide-react';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'idle' | 'running' | 'success' | 'error';
  logs: string[];
  resultData?: {
    newsletter?: {
      title: string;
      content: string;
    };
    articlesCount?: number;
    telegramStatus?: {
      sent: boolean;
      messageId?: number;
      error?: string;
    };
    executionTimeMs?: number;
  };
}

export const PipelineModal: React.FC<PipelineModalProps> = ({
  isOpen,
  onClose,
  status,
  logs,
  resultData,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (resultData?.newsletter?.content) {
      navigator.clipboard.writeText(resultData.newsletter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Autonomous Agent Pipeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              MCP Multi-Source Query → Gemini Synthesis → Telegram Dispatch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Visual Step Progress */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-lg border transition-all ${
              status === 'running' && logs.some(l => l.includes('[1/4]') || l.includes('[2/4]'))
                ? 'border-indigo-500 bg-indigo-950/20'
                : resultData?.articlesCount
                ? 'border-emerald-600/40 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                  1. MCP Query
                </span>
                {resultData?.articlesCount ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : status === 'running' ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400">
                {resultData?.articlesCount
                  ? `${resultData.articlesCount} articles aggregated`
                  : 'Fetching live RSS feeds'}
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border transition-all ${
              status === 'running' && logs.some(l => l.includes('[3/4]'))
                ? 'border-indigo-500 bg-indigo-950/20'
                : resultData?.newsletter
                ? 'border-emerald-600/40 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  2. Gemini Agent
                </span>
                {resultData?.newsletter ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : status === 'running' && logs.some(l => l.includes('[3/4]')) ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400">
                {resultData?.newsletter
                  ? 'Newsletter synthesized'
                  : 'Synthesizing with Gemini 3.8'}
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border transition-all ${
              resultData?.telegramStatus?.sent
                ? 'border-emerald-600/40 bg-emerald-950/20'
                : resultData?.telegramStatus?.error
                ? 'border-amber-600/40 bg-amber-950/20'
                : status === 'running' && logs.some(l => l.includes('[4/4]'))
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  3. Telegram Dispatch
                </span>
                {resultData?.telegramStatus?.sent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : resultData?.telegramStatus?.error ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : status === 'running' && logs.some(l => l.includes('[4/4]')) ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400">
                {resultData?.telegramStatus?.sent
                  ? `Delivered (ID #${resultData.telegramStatus.messageId})`
                  : resultData?.telegramStatus?.error
                  ? 'Dispatch warning'
                  : 'Delivering via Bot API'}
              </p>
            </div>
          </div>

          {/* Execution Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
            <div className="text-slate-500 pb-1 border-b border-slate-900 text-[11px] uppercase tracking-wider">
              Execution Log Stream
            </div>
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-indigo-400 mr-2">&gt;</span>
                {log}
              </div>
            ))}
            {status === 'running' && (
              <div className="flex items-center gap-2 text-indigo-400 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing multi-stage agent pipeline...</span>
              </div>
            )}
          </div>

          {/* Generated Newsletter Preview */}
          {resultData?.newsletter && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Generated Newsletter Output
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {resultData.newsletter.content}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">
            {resultData?.executionTimeMs ? (
              <span>Completed in <strong className="text-white font-mono">{resultData.executionTimeMs}ms</strong></span>
            ) : (
              <span>Automated cycle</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
