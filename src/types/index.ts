export enum Platform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp'
}

export interface UnifiedUser {
  id: string;
  username?: string;
  displayName?: string;
  platform: Platform;
  platformSpecific?: any;
}

export interface UnifiedMessage {
  id: string;
  content: string;
  author: UnifiedUser;
  platform: Platform;
  timestamp: Date;
  chatId: string;
  isFromBot: boolean;
  platformSpecific?: any;
}

export interface UnifiedSendOptions {
  chatId: string;
  platform: Platform;
  replyToMessageId?: string;
  platformSpecific?: any;
}

export interface IPlatformAdapter {
  platform: Platform;
  initialize(): Promise<void>;
  sendMessage(content: string, options: UnifiedSendOptions): Promise<void>;
  onMessage(handler: (message: UnifiedMessage) => Promise<void>): void;
  disconnect(): Promise<void>;
}

export interface BotConfig {
  discord?: {
    token: string;
  };
  telegram?: {
    token: string;
  };
  whatsapp?: {
    sessionPath?: string;
  };
}
