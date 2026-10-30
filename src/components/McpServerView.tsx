import React, { useState } from 'react';
import { Terminal, Cpu, Play, Copy, Check, ExternalLink, Code2, Layers, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { MCPToolDefinition, NewsSource } from '../types.js';

interface McpServerViewProps {
  sources: NewsSource[];
}

export const McpServerView: React.FC<McpServerViewProps> = ({ sources }) => {
  const [selectedTool, setSelectedTool] = useState<string>('get_top_news');
  const [categoryArg, setCategoryArg] = useState<string>('all');
  const [limitArg, setLimitArg] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('AI agent');
  const [toolResult, setToolResult] = useState<any>(null);
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // JSON-RPC Playground state
  const [rpcMethod, setRpcMethod] = useState<string>('tools/list');
  const [rpcRequestPayload, setRpcRequestPayload] = useState<string>(
    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, null, 2)
  );
  const [rpcResponse, setRpcResponse] = useState<any>(null);
  const [isRpcLoading, setIsRpcLoading] = useState<boolean>(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleExecuteTool = async () => {
    setIsExecutingTool(true);
    setToolResult(null);

    let toolArgs: Record<string, any> = {};
    if (selectedTool === 'get_top_news') {
      toolArgs = { category: categoryArg, limit: limitArg };
    } else if (selectedTool === 'search_news') {
      toolArgs = { query: searchQuery, limit: limitArg };
    } else if (selectedTool === 'fetch_feed_sources') {
      toolArgs = {};
    }

    try {
      const res = await fetch('/api/mcp/execute-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedTool, arguments: toolArgs }),
      });
      const data = await res.json();
      setToolResult(data.result);
    } catch (err: any) {
      setToolResult({ error: err.message });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleRpcMethodChange = (method: string) => {
    setRpcMethod(method);
    let payload: any = { jsonrpc: '2.0', id: Date.now(), method, params: {} };
    if (method === 'tools/call') {
      payload.params = {
        name: 'get_top_news',
        arguments: { category: 'ai', limit: 5 },
      };
    } else if (method === 'resources/read') {
      payload.params = { uri: 'news://active-feeds' };
    }
    setRpcRequestPayload(JSON.stringify(payload, null, 2));
  };

  const handleSendRpc = async () => {
    setIsRpcLoading(true);
    try {
      const parsed = JSON.parse(rpcRequestPayload);
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setRpcResponse(data);
    } catch (err: any) {
      setRpcResponse({ error: 'Failed to execute: ' + err.message });
    } finally {
      setIsRpcLoading(false);
    }
  };

  const claudeConfigSnippet = `{
  "mcpServers": {
    "newspulse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "NEWS_MCP_URL": "${window.location.origin}/mcp"
      }
    }
  }
}`;

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" />
          <span>Part 1 · Model Context Protocol Standard</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Multi-Source News MCP Server
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          This Model Context Protocol (MCP) server provides standard tools and resources for querying,
          filtering, and searching real-time news across {sources.length} publications. External AI agents
          and our internal Gemini news agent invoke these tools to access fresh context without hallucination.
        </p>
      </div>

      {/* Protocol Endpoints & Integration Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">MCP JSON-RPC Endpoint</div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300">
            <span className="truncate">/mcp</span>
            <button
              onClick={() => handleCopy(`${window.location.origin}/mcp`, 'endpoint')}
              className="text-slate-400 hover:text-white transition-colors ml-2 cursor-pointer"
            >
              {copiedSnippet === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">Supports POST JSON-RPC 2.0 & GET manifest</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Protocol Specification</div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300">
            <span>MCP Standard 2024-11-05</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500">Implements tools, prompts, resources & ping</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Integrated News Feeds</div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300">
            <span>{sources.length} Active Feeds</span>
            <span className="text-emerald-400 text-[11px]">Synced</span>
          </div>
          <p className="text-[11px] text-slate-500">TechCrunch, Verge, BBC, HackerNews, ArsTechnica</p>
        </div>
      </div>

      {/* Interactive Tool Execution Playground */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Interactive MCP Tools Explorer</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute registered MCP tools directly to test live parameters and view response payloads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTool('get_top_news')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedTool === 'get_top_news'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              get_top_news
            </button>
            <button
              onClick={() => setSelectedTool('search_news')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedTool === 'search_news'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              search_news
            </button>
            <button
              onClick={() => setSelectedTool('fetch_feed_sources')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedTool === 'fetch_feed_sources'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              fetch_feed_sources
            </button>
          </div>
        </div>

        {/* Tool Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedTool === 'get_top_news' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Category Filter</label>
                <select
                  value={categoryArg}
                  onChange={(e) => setCategoryArg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Topics</option>
                  <option value="ai">AI & Machine Learning</option>
                  <option value="tech">Technology & Systems</option>
                  <option value="business">Business & Markets</option>
                  <option value="science">Science & Innovation</option>
                  <option value="crypto">Crypto & Web3</option>
                  <option value="world">World News</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Limit: <span className="font-mono text-indigo-400">{limitArg}</span> articles
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={limitArg}
                  onChange={(e) => setLimitArg(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </>
          )}

          {selectedTool === 'search_news' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Search Keywords</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords e.g., DeepSeek, LLMs, Quantum..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Limit: <span className="font-mono text-indigo-400">{limitArg}</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={limitArg}
                  onChange={(e) => setLimitArg(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </>
          )}

          {selectedTool === 'fetch_feed_sources' && (
            <div className="md:col-span-2 text-xs text-slate-400 flex items-center">
              Inspects all active RSS sources, health ping, and article count in the MCP server.
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={handleExecuteTool}
              disabled={isExecutingTool}
              className="w-full px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isExecutingTool ? 'animate-spin' : ''}`} />
              <span>{isExecutingTool ? 'Executing Tool...' : 'Execute MCP Tool'}</span>
            </button>
          </div>
        </div>

        {/* Result Area */}
        {toolResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                MCP Tool Output Payload
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(toolResult, null, 2), 'tool-out')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedSnippet === 'tool-out' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet === 'tool-out' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono max-h-72 overflow-y-auto leading-relaxed">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Raw JSON-RPC 2.0 Playground */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">JSON-RPC 2.0 Protocol Console</h3>
            <p className="text-xs text-slate-400">
              Direct protocol handshake mimicking external clients like Claude Desktop or Cursor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Preset Method:</label>
            <select
              value={rpcMethod}
              onChange={(e) => handleRpcMethodChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="tools/list">tools/list</option>
              <option value="tools/call">tools/call</option>
              <option value="resources/list">resources/list</option>
              <option value="resources/read">resources/read</option>
              <option value="prompts/list">prompts/list</option>
              <option value="ping">ping</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>JSON-RPC Request</span>
              <button
                onClick={handleSendRpc}
                disabled={isRpcLoading}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium cursor-pointer"
              >
                {isRpcLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
            <textarea
              rows={8}
              value={rpcRequestPayload}
              onChange={(e) => setRpcRequestPayload(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>JSON-RPC Response</span>
              {rpcResponse && (
                <button
                  onClick={() => handleCopy(JSON.stringify(rpcResponse, null, 2), 'rpc-res')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {copiedSnippet === 'rpc-res' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 max-h-[178px] overflow-y-auto">
              {rpcResponse ? JSON.stringify(rpcResponse, null, 2) : '// Response will appear here after request'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
