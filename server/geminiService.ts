import { GoogleGenAI } from '@google/genai';
import { NewsArticle } from './types.js';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
  }

  return new GoogleGenAI({
    apiKey: apiKey || 'dummy-key-fallback',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface NewsletterGenerationOptions {
  articles: NewsArticle[];
  topics: string[];
  tone: 'morning_executive' | 'punchy_digest' | 'hinglish_tech_bro' | 'deep_analytical';
  language: 'English' | 'Hinglish' | 'Hindi';
  customInstructions?: string;
}

export class GeminiNewsAgent {
  public async generateNewsletter(options: NewsletterGenerationOptions): Promise<{
    title: string;
    content: string;
    summary: string;
    articlesCount: number;
    generatedAt: string;
  }> {
    const { articles, topics, tone, language, customInstructions } = options;

    if (!articles || articles.length === 0) {
      throw new Error('No articles provided to synthesize.');
    }

    const ai = getAiClient();

    // Prepare articles context
    const articlesContext = articles.map((a, i) => `
[Article #${i + 1}]
Title: ${a.title}
Source: ${a.source} (${a.category.toUpperCase()})
Date: ${a.pubDate}
URL: ${a.link}
Summary: ${a.summary}
`).join('\n---\n');

    let toneGuide = '';
    switch (tone) {
      case 'hinglish_tech_bro':
        toneGuide = `Use natural, high-energy Hinglish (conversational mix of Hindi and English like modern Indian tech founders, creators, and developers). Examples: "Aaj ka sabse bada update...", "Kyu matter karta hai yeh...", "Bhai yeh game-changer hai", "Quick bullets me samjho". Keep all core technical terms in English. Make it super engaging and relatable.`;
        break;
      case 'punchy_digest':
        toneGuide = `Fast, snappy, zero fluff. 2-sentence takeaways, bullet points with bold prefixes, readable in under 2 minutes.`;
        break;
      case 'deep_analytical':
        toneGuide = `Analytical, thorough, focused on industry implications, second-order effects, market dynamics, and technological significance.`;
        break;
      case 'morning_executive':
      default:
        toneGuide = `Professional, polished, executive morning brief. Crisp editorial tone, balanced perspectives, clear section headers, and direct insights.`;
        break;
    }

    const systemInstruction = `You are "NewsPulse Agent", an expert AI news editor and intelligence analyst.
Your job is to read raw news stories retrieved via the Model Context Protocol (MCP) and transform them into a curated, high-value Daily Newsletter formatted specifically for Telegram.

Guidelines:
1. Target Audience: Fast-moving professionals, engineers, and founders who want signal over noise.
2. Structure:
   - Header: 🌅 [Title] | [Current Date]
   - ⚡️ TOP STORY OF THE DAY: Deep-dive on the most impactful article (Headline, What happened, Why it matters).
   - 🧠 KEY DEVELOPMENTS: Group 3-5 major stories under clean category badges (e.g., [AI & Systems], [Tech & Infrastructure], [World & Markets]).
   - Each item must have: Bold Title, 1-2 sentence core insight, and hyperlinked source formatted as: [Source Name](url).
   - 💡 ONE BIG TAKEAWAY / FINAL THOUGHT: A concluding synthesis on what to watch next.
3. Tone: ${toneGuide}
4. Language: Formatted strictly in ${language}.
5. Telegram Formatting: Use standard Markdown (e.g., #, ##, **, bullet points -, and [text](link)). Do not use HTML tags in your output; return clean Markdown.
${customInstructions ? `Special User Requirement: ${customInstructions}` : ''}`;

    const prompt = `Here are the latest ${articles.length} news articles fetched from our multi-source MCP server across ${topics.join(', ')}:

${articlesContext}

Please generate today's curated Telegram Newsletter now following your editorial system instructions.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const newsletterText = response.text || '';
      if (!newsletterText) {
        throw new Error('Gemini API returned an empty newsletter response.');
      }

      // Extract a representative title from the first header line or create one
      const lines = newsletterText.split('\n');
      const firstHeader = lines.find(l => l.startsWith('#') || l.includes('NewsPulse') || l.includes('Daily'));
      const cleanTitle = firstHeader ? firstHeader.replace(/^[#\s*📰🌅⚡️]+/, '').trim() : `Daily Tech & Global Intelligence Brief`;

      return {
        title: cleanTitle,
        content: newsletterText,
        summary: newsletterText.slice(0, 250).replace(/[#*]/g, '').trim() + '...',
        articlesCount: articles.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error generating newsletter with Gemini:', err);
      // Fallback generator if API key or connection error occurs
      return this.generateFallbackNewsletter(articles, language, tone);
    }
  }

  private generateFallbackNewsletter(
    articles: NewsArticle[],
    language: string,
    tone: string
  ) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isHinglish = language === 'Hinglish' || tone === 'hinglish_tech_bro';
    const top = articles[0] || { title: 'Global Tech Advancements Accelerate', source: 'Reuters', link: 'https://news.ycombinator.com', summary: 'Major breakthroughs reported across frontier models and computing.' };
    const topLink = top.link || (top as any).url || 'https://news.ycombinator.com';
    const others = articles.slice(1, 6);

    const title = isHinglish
      ? `🌅 NewsPulse Daily Digest · ${today}`
      : `🌅 NewsPulse Executive Brief · ${today}`;

    let body = `# ${title}\n\n`;

    if (isHinglish) {
      body += `Namaste! Yeh raha aapka daily curated intelligence digest, jo direct MCP news feeds se analyze kiya gaya hai.\n\n`;
      body += `## ⚡️ Aaj Ka Sabse Bada Update\n`;
      body += `**${top.title}**\n`;
      body += `${top.summary}\n`;
      body += `🔗 *Source:* [${top.source}](${topLink})\n\n`;
      body += `## 📌 Top Stories Ek Nazar Me\n`;
      others.forEach(art => {
        const artLink = art.link || (art as any).url || '#';
        body += `- **${art.title}**: ${art.summary.slice(0, 140)}... [${art.source}](${artLink})\n`;
      });
      body += `\n## 💡 Key Takeaway\n`;
      body += `Frontier AI agent tools aur dynamic infrastructure fast adapt ho rahe hain. Stay tuned for tomorrow's briefing!\n`;
    } else {
      body += `Welcome to your morning intelligence briefing, synthesized from verified multi-source MCP feeds.\n\n`;
      body += `## ⚡️ Top Story of the Day\n`;
      body += `**${top.title}**\n`;
      body += `${top.summary}\n`;
      body += `🔗 *Read more:* [${top.source}](${topLink})\n\n`;
      body += `## 🌐 Core Developments\n`;
      others.forEach(art => {
        const artLink = art.link || (art as any).url || '#';
        body += `- **${art.title}** — ${art.summary.slice(0, 140)}... [${art.source}](${artLink})\n`;
      });
      body += `\n## 💡 Executive Perspective\n`;
      body += `Multi-agent pipelines and real-time autonomous systems continue to shift software economics. Actionable updates will follow tomorrow.\n`;
    }

    return {
      title,
      content: body,
      summary: body.slice(0, 250).replace(/[#*]/g, '').trim() + '...',
      articlesCount: articles.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const geminiAgent = new GeminiNewsAgent();
