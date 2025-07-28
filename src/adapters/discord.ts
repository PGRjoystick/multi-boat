import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { Platform } from '../types/index.js';
import type { IPlatformAdapter, UnifiedMessage, UnifiedSendOptions, UnifiedUser } from '../types/index.js';

export class DiscordAdapter implements IPlatformAdapter {
  public readonly platform = Platform.DISCORD;
  private client: Client;
  private messageHandler?: (message: UnifiedMessage) => Promise<void>;

  constructor(private token: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
      ]
    });
  }

  async initialize(): Promise<void> {
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;
      
      if (this.messageHandler) {
        const unifiedMessage = this.convertToUnifiedMessage(message);
        await this.messageHandler(unifiedMessage);
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on('shardError', (error) => {
      console.error('Discord shard error:', error);
    });

    try {
      await this.client.login(this.token);
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    } catch (error) {
      console.error('Discord login failed:', error);
      throw new Error(`Discord authentication failed. Please check your token and bot permissions.`);
    }
  }

  async sendMessage(content: string, options: UnifiedSendOptions): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(options.chatId);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send({
          content,
          reply: options.replyToMessageId ? { messageReference: options.replyToMessageId } : undefined
        });
      }
    } catch (error) {
      console.error('Discord send message error:', error);
    }
  }

  onMessage(handler: (message: UnifiedMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
  }

  private convertToUnifiedMessage(message: Message): UnifiedMessage {
    const author: UnifiedUser = {
      id: message.author.id,
      username: message.author.username,
      displayName: message.author.displayName || message.author.username,
      platform: Platform.DISCORD,
      platformSpecific: message.author
    };

    return {
      id: message.id,
      content: message.content,
      author,
      platform: Platform.DISCORD,
      timestamp: message.createdAt,
      chatId: message.channelId,
      isFromBot: message.author.bot,
      platformSpecific: message
    };
  }
}
