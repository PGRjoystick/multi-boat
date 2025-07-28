// Main exports for the multi-boat package
export { MultiBotManager } from './MultiBotManager.js';
export { DiscordAdapter } from './adapters/discord.js';
export { TelegramAdapter } from './adapters/telegram.js';
export { WhatsAppAdapter } from './adapters/whatsapp.js';
export { MessageHandlerRegistry, createDefaultHandlers } from './handlers/messageHandler.js';
export type { 
  Platform,
  UnifiedUser,
  UnifiedMessage,
  UnifiedSendOptions,
  IPlatformAdapter,
  BotConfig 
} from './types/index.js';
export type { MessageHandler, MessageHandlerContext } from './handlers/messageHandler.js';
