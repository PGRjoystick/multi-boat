import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import type { ConnectionState, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';
import { Platform } from '../types/index.js';
import type { IPlatformAdapter, UnifiedMessage, UnifiedSendOptions, UnifiedUser } from '../types/index.js';

export class WhatsAppAdapter implements IPlatformAdapter {
  public readonly platform = Platform.WHATSAPP;
  private socket?: WASocket;
  private messageHandler?: (message: UnifiedMessage) => Promise<void>;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(private sessionPath: string = './whatsapp_session') {}

  async initialize(): Promise<void> {
    if (this.isConnecting) {
      console.log('WhatsApp adapter already connecting...');
      return;
    }

    this.isConnecting = true;
    
    try {
      console.log(`🔄 Initializing WhatsApp with session path: ${this.sessionPath}`);
      
      // Ensure session directory exists
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
        console.log(`📁 Created session directory: ${this.sessionPath}`);
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
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
          console.log('Scan the QR code above to authenticate\n');
        }
        
        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const errorMessage = lastDisconnect?.error?.message || 'unknown error';
          
          console.log(`❌ WhatsApp connection closed: ${errorMessage} (Status: ${statusCode})`);
          
          // Don't clear session if it's an intentional logout (from our disconnect method)
          if (errorMessage === 'Intentional Logout') {
            console.log('💾 Session preserved for next startup');
            return;
          }
          
          // Handle different disconnect reasons
          if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
            console.log('🔑 WhatsApp session invalid. Clearing session and requiring re-authentication...');
            this.clearSession();
            setTimeout(() => this.initialize(), 2000);
          } else if (statusCode === 403) {
            console.log('🚫 WhatsApp access forbidden. Session may be expired.');
            this.clearSession();
            setTimeout(() => this.initialize(), 2000);
          } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Exponential backoff, max 30s
            console.log(`🔄 Attempting to reconnect to WhatsApp in ${delay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.initialize(), delay);
          } else {
            console.log('❌ Max reconnection attempts reached. WhatsApp adapter disabled.');
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connection established successfully!');
          this.isConnecting = false;
          this.reconnectAttempts = 0; // Reset counter on successful connection
        } else if (connection === 'connecting') {
          console.log('🔄 Connecting to WhatsApp...');
        }
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to initialize WhatsApp socket:', error);
      throw error;
    }

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

  // Clear session files to force re-authentication
  // This is called when the session is invalid or on logout
  private clearSession(): void {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const files = fs.readdirSync(this.sessionPath);
        for (const file of files) {
          fs.unlinkSync(path.join(this.sessionPath, file));
        }
        console.log('🗑️ Cleared WhatsApp session files');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
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
      // Don't call logout() to preserve session for next startup
      // Just end the connection gracefully
      this.socket.end(undefined);
      console.log('🔌 WhatsApp connection closed (session preserved)');
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
