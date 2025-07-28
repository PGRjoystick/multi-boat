import { DiscordAdapter } from './adapters/discord.js';
import { TelegramAdapter } from './adapters/telegram.js';
import { WhatsAppAdapter } from './adapters/whatsapp.js';
import { createDefaultHandlers } from './handlers/messageHandler.js';
import type { IPlatformAdapter, BotConfig, UnifiedMessage, UnifiedSendOptions } from './types/index.js';
import type { MessageHandlerRegistry } from './handlers/messageHandler.js';

export class MultiBotManager {
  private adapters: Map<string, IPlatformAdapter> = new Map();
  private messageHandlers: MessageHandlerRegistry;

  constructor(private config: BotConfig) {
    this.messageHandlers = createDefaultHandlers();
  }

  async initialize(): Promise<void> {
    // Initialize Discord if configured
    if (this.config.discord?.token) {
      try {
        const discordAdapter = new DiscordAdapter(this.config.discord.token);
        this.setupAdapter(discordAdapter);
        this.adapters.set('discord', discordAdapter);
        console.log('Discord adapter configured');
      } catch (error) {
        console.error('Failed to configure Discord adapter:', error);
      }
    }

    // Initialize Telegram if configured
    if (this.config.telegram?.token) {
      try {
        const telegramAdapter = new TelegramAdapter(this.config.telegram.token);
        this.setupAdapter(telegramAdapter);
        this.adapters.set('telegram', telegramAdapter);
        console.log('Telegram adapter configured');
      } catch (error) {
        console.error('Failed to configure Telegram adapter:', error);
      }
    }

    // Initialize WhatsApp if configured
    if (this.config.whatsapp !== undefined) {
      try {
        const whatsappAdapter = new WhatsAppAdapter(this.config.whatsapp.sessionPath);
        this.setupAdapter(whatsappAdapter);
        this.adapters.set('whatsapp', whatsappAdapter);
        console.log('WhatsApp adapter configured');
      } catch (error) {
        console.error('Failed to configure WhatsApp adapter:', error);
      }
    }

    // Initialize all adapters with individual error handling
    const initPromises = Array.from(this.adapters.entries()).map(async ([platform, adapter]) => {
      try {
        await adapter.initialize();
        console.log(`✅ ${platform} adapter initialized successfully`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${platform} adapter:`, error);
        this.adapters.delete(platform); // Remove failed adapter
      }
    });
    
    await Promise.all(initPromises);

    if (this.adapters.size === 0) {
      throw new Error('No platform adapters were successfully initialized');
    }

    console.log(`🚀 Multi-bot initialized with ${this.adapters.size} platform(s): ${Array.from(this.adapters.keys()).join(', ')}`);
  }

  private setupAdapter(adapter: IPlatformAdapter): void {
    adapter.onMessage(async (message: UnifiedMessage) => {
      console.log(`[${message.platform.toUpperCase()}] ${message.author.displayName}: ${message.content}`);
      
      // Process message through handlers
      await this.messageHandlers.processMessage(message, async (content, options) => {
        const sendOptions: UnifiedSendOptions = {
          chatId: message.chatId,
          platform: message.platform,
          ...options
        };
        await adapter.sendMessage(content, sendOptions);
      });
    });
  }

  getMessageHandlers(): MessageHandlerRegistry {
    return this.messageHandlers;
  }

  async sendMessageToPlatform(
    platform: string,
    content: string,
    options: UnifiedSendOptions
  ): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Platform adapter for ${platform} not found`);
    }
    await adapter.sendMessage(content, options);
  }

  async shutdown(): Promise<void> {
    const disconnectPromises = Array.from(this.adapters.values()).map(adapter => adapter.disconnect());
    await Promise.all(disconnectPromises);
    console.log('All bots disconnected');
  }
}
