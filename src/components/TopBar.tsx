import React from 'react';
import { Play } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onTriggerPipeline: () => void;
  isExecuting: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onTriggerPipeline,
  isExecuting,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('dashboard');
        }}
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-400 transition-colors"
      >
        NewsPulse MCP
      </a>

      {/* Zone 2: 4–5 single-line clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'dashboard' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('mcp')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'mcp' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          MCP Server
        </button>
        <button
          onClick={() => onSelectTab('agent')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'agent' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          AI Agent Studio
        </button>
        <button
          onClick={() => onSelectTab('telegram')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'telegram' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Telegram Automation
        </button>
        <button
          onClick={() => onSelectTab('feeds')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'feeds' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Feeds & Logs
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onTriggerPipeline}
          disabled={isExecuting}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Agent Running...' : 'Run Agent Now'}</span>
        </button>
      </div>
    </header>
  );
};
