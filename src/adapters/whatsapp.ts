import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import type { ConnectionState, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { Platform } from '../types/index.js';
import type { IPlatformAdapter, UnifiedMessage, UnifiedSendOptions, UnifiedUser } from '../types/index.js';

export class WhatsAppAdapter implements IPlatformAdapter {
  public readonly platform = Platform.WHATSAPP;
  private socket?: WASocket;
  private messageHandler?: (message: UnifiedMessage) => Promise<void>;

  constructor(private sessionPath: string = './whatsapp_session') {}

  async initialize(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

    this.socket = makeWASocket({
      auth: state,
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n🔗 WhatsApp QR Code - Scan with your phone:');
        console.log('━'.repeat(50));
        qrcode.generate(qr, { small: true });
        console.log('━'.repeat(50));
        console.log('Open WhatsApp → Menu → Linked Devices → Link a Device');
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('WhatsApp connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect);
        if (shouldReconnect) {
          this.initialize();
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection opened');
      }
    });

    this.socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type === 'notify' && this.messageHandler) {
        for (const message of messages) {
          if (!message.key.fromMe && message.message) {
            const unifiedMessage = this.convertToUnifiedMessage(message);
            this.messageHandler(unifiedMessage);
          }
        }
      }
    });
  }

  async sendMessage(content: string, options: UnifiedSendOptions): Promise<void> {
    if (!this.socket) {
      throw new Error('WhatsApp socket not initialized');
    }

    try {
      await this.socket.sendMessage(options.chatId, {
        text: content
      }, {
        quoted: options.replyToMessageId ? { key: { id: options.replyToMessageId } } as any : undefined
      });
    } catch (error) {
      console.error('WhatsApp send message error:', error);
    }
  }

  onMessage(handler: (message: UnifiedMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      await this.socket.logout();
    }
  }

  private convertToUnifiedMessage(message: WAMessage): UnifiedMessage {
    const textMessage = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || '';
    
    const phoneNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
    
    const author: UnifiedUser = {
      id: phoneNumber,
      username: phoneNumber,
      displayName: message.pushName || phoneNumber,
      platform: Platform.WHATSAPP,
      platformSpecific: message.key
    };

    return {
      id: message.key.id || '',
      content: textMessage,
      author,
      platform: Platform.WHATSAPP,
      timestamp: new Date((message.messageTimestamp as number) * 1000),
      chatId: message.key.remoteJid || '',
      isFromBot: message.key.fromMe || false,
      platformSpecific: message
    };
  }
}
