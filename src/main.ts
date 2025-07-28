import 'dotenv/config';
import { MultiBotManager } from './MultiBotManager.js';
import type { BotConfig } from './types/index.js';

async function main() {
  const config: BotConfig = {
    discord: process.env.DISCORD_TOKEN ? {
      token: process.env.DISCORD_TOKEN
    } : undefined,
    telegram: process.env.TELEGRAM_TOKEN ? {
      token: process.env.TELEGRAM_TOKEN
    } : undefined,
    whatsapp: {
      sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp_session'
    }
  };

  // Check if at least one platform is configured
  if (!config.discord && !config.telegram && !config.whatsapp) {
    console.error('No platform tokens configured. Please check your .env file.');
    console.error('Copy .env.example to .env and fill in your bot tokens.');
    process.exit(1);
  }

  const botManager = new MultiBotManager(config);

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await botManager.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await botManager.shutdown();
    process.exit(0);
  });

  try {
    await botManager.initialize();
    console.log('Multi-bot is running! Send "!ping" to any connected platform to test.');
  } catch (error) {
    console.error('Failed to initialize bot manager:', error);
    process.exit(1);
  }
}

main().catch(console.error);
