import { TelegramBotInfo } from './types.js';

class TelegramService {
  private apiUrl(token: string, method: string): string {
    return `https://api.telegram.org/bot${token.trim()}/${method}`;
  }

  public async getBotInfo(token: string): Promise<TelegramBotInfo> {
    if (!token || !token.trim()) {
      throw new Error('Telegram Bot Token is required.');
    }

    const res = await fetch(this.apiUrl(token, 'getMe'), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await res.json() as any;
    if (!data.ok) {
      throw new Error(data.description || 'Failed to authenticate Telegram bot token.');
    }

    return data.result as TelegramBotInfo;
  }

  public async detectRecentChatId(token: string): Promise<{ chatId: string; username?: string; name?: string } | null> {
    if (!token || !token.trim()) {
      throw new Error('Telegram Bot Token is required.');
    }

    const res = await fetch(this.apiUrl(token, 'getUpdates?limit=10'), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await res.json() as any;
    if (!data.ok) {
      throw new Error(data.description || 'Failed to retrieve bot updates.');
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      return null;
    }

    // Pick the most recent message update
    for (let i = updates.length - 1; i >= 0; i--) {
      const msg = updates[i].message || updates[i].channel_post || updates[i].edited_message;
      if (msg && msg.chat && msg.chat.id) {
        return {
          chatId: String(msg.chat.id),
          username: msg.chat.username || msg.from?.username,
          name: msg.chat.title || [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'User',
        };
      }
    }

    return null;
  }

  public async sendMessage(
    token: string,
    chatId: string,
    text: string,
    parseMode: 'HTML' | 'Markdown' | undefined = 'HTML'
  ): Promise<{ messageId: number; ok: boolean }> {
    if (!token || !token.trim()) {
      throw new Error('Telegram Bot Token is missing. Please configure it in Telegram Settings.');
    }
    if (!chatId || !chatId.trim()) {
      throw new Error('Telegram Chat ID is missing. Please configure or detect your Chat ID.');
    }

    // Split text into chunks if > 4000 chars (Telegram limit is 4096)
    const chunks = this.splitMessage(text, 4000);
    let lastMessageId = 0;

    for (const chunk of chunks) {
      const bodyPayload: any = {
        chat_id: chatId.trim(),
        text: chunk,
        disable_web_page_preview: true,
      };

      if (parseMode) {
        bodyPayload.parse_mode = parseMode;
      }

      let res = await fetch(this.apiUrl(token, 'sendMessage'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      let resData = await res.json() as any;

      // If HTML parse mode failed due to unclosed tag or entity, retry as plain text
      if (!resData.ok && parseMode) {
        console.warn(`Telegram HTML send failed (${resData.description}), retrying as plain text...`);
        const plainText = this.stripHtml(chunk);
        delete bodyPayload.parse_mode;
        bodyPayload.text = plainText;

        res = await fetch(this.apiUrl(token, 'sendMessage'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });
        resData = await res.json() as any;
      }

      if (!resData.ok) {
        throw new Error(resData.description || 'Failed to dispatch message to Telegram.');
      }

      lastMessageId = resData.result.message_id;
    }

    return {
      ok: true,
      messageId: lastMessageId,
    };
  }

  private splitMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let current = '';

    const lines = text.split('\n');
    for (const line of lines) {
      if ((current + '\n' + line).length > maxLength) {
        if (current) {
          chunks.push(current);
          current = '';
        }
        if (line.length > maxLength) {
          // Break huge line
          for (let i = 0; i < line.length; i += maxLength) {
            chunks.push(line.slice(i, i + maxLength));
          }
        } else {
          current = line;
        }
      } else {
        current = current ? current + '\n' + line : line;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }

  /**
   * Convert markdown headers/bold/links into clean Telegram-compatible HTML
   */
  public markdownToTelegramHtml(markdown: string): string {
    let out = markdown;

    // Escape raw HTML characters first to avoid injection
    out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Re-permit safe tags if needed, or convert markdown:
    // Headers # -> <b>
    out = out.replace(/^### (.*$)/gim, '\n<b>📌 $1</b>');
    out = out.replace(/^## (.*$)/gim, '\n<b>━━━ $1 ━━━</b>');
    out = out.replace(/^# (.*$)/gim, '\n<b>📰 $1</b>\n');

    // Bold **text** -> <b>text</b>
    out = out.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italic *text* or _text_ -> <i>text</i>
    out = out.replace(/\*(.*?)\*/g, '<i>$1</i>');
    out = out.replace(/_(.*?)_/g, '<i>$1</i>');

    // Code `code` -> <code>code</code>
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links [text](url) -> <a href="url">text</a>
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    // Bullet points
    out = out.replace(/^\s*[-*]\s+/gm, '• ');

    return out.trim();
  }
}

export const telegramService = new TelegramService();
