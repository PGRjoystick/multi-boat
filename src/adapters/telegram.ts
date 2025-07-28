import { Bot, Context } from 'grammy';
import { Platform } from '../types/index.js';
import type { IPlatformAdapter, UnifiedMessage, UnifiedSendOptions, UnifiedUser } from '../types/index.js';

export class TelegramAdapter implements IPlatformAdapter {
  public readonly platform = Platform.TELEGRAM;
  private bot: Bot;
  private messageHandler?: (message: UnifiedMessage) => Promise<void>;

  constructor(token: string) {
    this.bot = new Bot(token);
  }

  async initialize(): Promise<void> {
    this.bot.on('message:text', async (ctx: Context) => {
      if (this.messageHandler && ctx.message && ctx.from) {
        const unifiedMessage = this.convertToUnifiedMessage(ctx);
        await this.messageHandler(unifiedMessage);
      }
    });

    await this.bot.start();
    console.log('Telegram bot started');
  }

  async sendMessage(content: string, options: UnifiedSendOptions): Promise<void> {
    try {
      await this.bot.api.sendMessage(options.chatId, content, {
        reply_to_message_id: options.replyToMessageId ? parseInt(options.replyToMessageId) : undefined
      });
    } catch (error) {
      console.error('Telegram send message error:', error);
    }
  }

  onMessage(handler: (message: UnifiedMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    await this.bot.stop();
  }

  private convertToUnifiedMessage(ctx: Context): UnifiedMessage {
    if (!ctx.message || !ctx.from) {
      throw new Error('Invalid message context');
    }

    const author: UnifiedUser = {
      id: ctx.from.id.toString(),
      username: ctx.from.username,
      displayName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ''),
      platform: Platform.TELEGRAM,
      platformSpecific: ctx.from
    };

    return {
      id: ctx.message.message_id.toString(),
      content: (ctx.message as any).text || '',
      author,
      platform: Platform.TELEGRAM,
      timestamp: new Date(ctx.message.date * 1000),
      chatId: ctx.message.chat.id.toString(),
      isFromBot: ctx.from.is_bot || false,
      platformSpecific: ctx.message
    };
  }
}
