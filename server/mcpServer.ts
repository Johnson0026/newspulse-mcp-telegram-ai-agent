import { Request, Response } from 'express';
import { newsService } from './newsService.js';
import { MCPToolDefinition, NewsArticle } from './types.js';

// Define the MCP Tools
export const mcpTools: MCPToolDefinition[] = [
  {
    name: 'get_top_news',
    description: 'Fetch the latest verified news stories across multiple sources categorized by topic (tech, ai, business, science, world, crypto).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'ai', 'tech', 'business', 'science', 'world', 'crypto'],
          description: 'The news topic/category filter. Defaults to "all".'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of articles to return (1-50). Default is 15.'
        },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of specific source IDs to query (e.g., ["techcrunch", "hackernews"]).'
        }
      }
    }
  },
  {
    name: 'search_news',
    description: 'Search breaking and current news articles by keywords across all active RSS and media publications.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword search query (e.g., "DeepSeek", "NVIDIA", "Quantum Computing", "SpaceX").'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of search results to return. Default is 10.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_feed_sources',
    description: 'List all news providers and RSS feeds registered in the MCP server with their health status and categories.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_article_details',
    description: 'Retrieve full metadata and content summary for a specific article ID or URL.',
    inputSchema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'The unique ID or URL of the article.'
        }
      },
      required: ['articleId']
    }
  }
];

export const mcpPrompts = [
  {
    name: 'daily_newsletter_synthesis',
    description: 'Directs the agent to formulate an executive morning or evening newsletter based on freshly queried MCP articles.',
    arguments: [
      {
        name: 'tone',
        description: 'Style tone: morning_executive, punchy_digest, hinglish_tech_bro, deep_analytical',
        required: false
      },
      {
        name: 'language',
        description: 'Language of output: English, Hinglish, Hindi',
        required: false
      }
    ]
  }
];

export const mcpResources = [
  {
    uri: 'news://active-feeds',
    name: 'Active News Sources',
    description: 'Live catalog of configured news feeds and health metrics',
    mimeType: 'application/json'
  },
  {
    uri: 'news://top-stories',
    name: 'Latest Top Headlines',
    description: 'Current snapshot of aggregated top news headlines',
    mimeType: 'application/json'
  }
];

export class MCPServer {
  public serverInfo = {
    name: 'newspulse-mcp-server',
    version: '1.2.0',
    protocolVersion: '2024-11-05',
    description: 'Model Context Protocol server for multi-source real-time news retrieval and curation.'
  };

  public getManifest() {
    return {
      jsonrpc: '2.0',
      server: this.serverInfo,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
      tools: mcpTools,
      prompts: mcpPrompts,
      resources: mcpResources
    };
  }

  public async executeTool(name: string, args: Record<string, any> = {}): Promise<any> {
    switch (name) {
      case 'get_top_news': {
        const category = args.category || 'all';
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(1, args.limit), 50) : 15;
        const sources = Array.isArray(args.sources) ? args.sources : undefined;
        const articles = await newsService.getTopNews({ category, limit, sources });
        return {
          category,
          count: articles.length,
          timestamp: new Date().toISOString(),
          articles: articles.map(a => ({
            id: a.id,
            title: a.title,
            source: a.source,
            category: a.category,
            pubDate: a.pubDate,
            url: a.link || '#',
            link: a.link || '#',
            summary: a.summary,
            author: a.author
          }))
        };
      }

      case 'search_news': {
        const query = String(args.query || '').trim();
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(1, args.limit), 30) : 10;
        const results = await newsService.searchNews(query, limit);
        return {
          query,
          count: results.length,
          timestamp: new Date().toISOString(),
          results: results.map(a => ({
            id: a.id,
            title: a.title,
            source: a.source,
            category: a.category,
            pubDate: a.pubDate,
            url: a.link || '#',
            link: a.link || '#',
            summary: a.summary,
          }))
        };
      }

      case 'fetch_feed_sources': {
        const sources = newsService.getSources();
        return {
          totalSources: sources.length,
          sources: sources.map(s => ({
            id: s.id,
            name: s.name,
            url: s.url,
            category: s.category,
            enabled: s.enabled,
            status: s.status,
            articleCount: s.articleCount || 0,
            lastFetched: s.lastFetched || null
          }))
        };
      }

      case 'get_article_details': {
        const articleId = String(args.articleId || '');
        const allArticles = await newsService.getTopNews({ limit: 80 });
        const found = allArticles.find(a => a.id === articleId || a.link === articleId);
        if (!found) {
          throw new Error(`Article not found with identifier: ${articleId}`);
        }
        return {
          article: found
        };
      }

      default:
        throw new Error(`Unknown MCP Tool: "${name}". Available tools: ${mcpTools.map(t => t.name).join(', ')}`);
    }
  }

  public async handleJsonRpc(body: any): Promise<any> {
    const id = body.id !== undefined ? body.id : null;
    const method = body.method;
    const params = body.params || {};

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: this.serverInfo.protocolVersion,
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: this.serverInfo
            }
          };

        case 'ping':
          return {
            jsonrpc: '2.0',
            id,
            result: {}
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: mcpTools
            }
          };

        case 'tools/call': {
          const toolName = params.name;
          const toolArgs = params.arguments || {};
          const toolResult = await this.executeTool(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2)
                }
              ],
              isError: false
            }
          };
        }

        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              resources: mcpResources
            }
          };

        case 'resources/read': {
          const uri = params.uri;
          if (uri === 'news://active-feeds') {
            const sources = newsService.getSources();
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(sources, null, 2)
                  }
                ]
              }
            };
          } else if (uri === 'news://top-stories') {
            const articles = await newsService.getTopNews({ limit: 20 });
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(articles, null, 2)
                  }
                ]
              }
            };
          }
          throw new Error(`Resource URI not found: ${uri}`);
        }

        case 'prompts/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              prompts: mcpPrompts
            }
          };

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message || 'Internal error'
        }
      };
    }
  }
}

export const mcpServer = new MCPServer();
