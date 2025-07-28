import { MultiBotManager } from './src/MultiBotManager.js';
import type { BotConfig } from './src/types/index.js';

// Example of how to extend the bot with custom handlers
async function exampleUsage() {
  const config: BotConfig = {
    discord: { token: 'your_discord_token' },
    telegram: { token: 'your_telegram_token' },
    whatsapp: { sessionPath: './whatsapp_session' }
  };

  const botManager = new MultiBotManager(config);
  const handlers = botManager.getMessageHandlers();

  // Add custom handlers
  handlers.registerHandler(/^!hello/i, async (context) => {
    await context.sendMessage(`Hello ${context.message.author.displayName}!`);
  });

  handlers.registerHandler(/^!help/i, async (context) => {
    const helpText = `
Available commands:
• !ping - Test bot responsiveness
• !hello - Get a greeting
• !help - Show this help message
    `;
    await context.sendMessage(helpText);
  });

  handlers.registerHandler(/^!echo (.+)/i, async (context) => {
    const match = context.message.content.match(/^!echo (.+)/i);
    if (match) {
      await context.sendMessage(`Echo: ${match[1]}`);
    }
  });

  await botManager.initialize();
  console.log('Extended multi-bot is running!');
}

// This is just an example - uncomment to use
// exampleUsage().catch(console.error);
