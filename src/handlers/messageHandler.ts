import type { UnifiedMessage, UnifiedSendOptions } from '../types/index.js';

export interface MessageHandlerContext {
  sendMessage: (content: string, options?: Partial<UnifiedSendOptions>) => Promise<void>;
  message: UnifiedMessage;
}

export type MessageHandler = (context: MessageHandlerContext) => Promise<void>;

export class MessageHandlerRegistry {
  private handlers: Array<{ pattern: RegExp | string; handler: MessageHandler }> = [];

  registerHandler(pattern: RegExp | string, handler: MessageHandler): void {
    this.handlers.push({ pattern, handler });
  }

  async processMessage(
    message: UnifiedMessage,
    sendMessage: (content: string, options?: Partial<UnifiedSendOptions>) => Promise<void>
  ): Promise<void> {
    const context: MessageHandlerContext = {
      sendMessage: (content: string, options?: Partial<UnifiedSendOptions>) => {
        const fullOptions: UnifiedSendOptions = {
          chatId: message.chatId,
          platform: message.platform,
          ...options
        };
        return sendMessage(content, fullOptions);
      },
      message
    };

    // Simple ping handler
    if (message.content.toLowerCase().startsWith('!ping')) {
      try {
        await context.sendMessage('pong');
      } catch (error) {
        console.error('Error sending message:', error);
      }
      return;
    }

    // Process other registered handlers
    for (const { pattern, handler } of this.handlers) {
      let matches = false;
      
      if (typeof pattern === 'string') {
        matches = message.content.toLowerCase().includes(pattern.toLowerCase());
      } else {
        matches = pattern.test(message.content);
      }

      if (matches) {
        try {
          await handler(context);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
    }
  }
}

// Default handlers
export const createDefaultHandlers = (): MessageHandlerRegistry => {
  const registry = new MessageHandlerRegistry();

  // The !ping handler is now built into processMessage for simplicity
  // You can add other handlers here if needed

  return registry;
};
