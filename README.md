# Multi-Boat Chatbot

A unified multi-platform chatbot system that supports Discord, Telegram, and WhatsApp platforms with a single codebase.

## Features

- **Multi-Platform Support**: Discord (discord.js), Telegram (grammY), and WhatsApp (baileys)
- **Unified Message Handling**: Platform-agnostic message processing system
- **TypeScript**: Fully typed for better development experience
- **Extensible**: Easy to add new platforms and message handlers
- **Configuration-based**: Enable/disable platforms via environment variables

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your bots**:
   ```bash
   cp .env.example .env
   # Edit .env and add your bot tokens
   ```

3. **Run the bot**:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file from `.env.example` and configure your bot tokens:

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to `DISCORD_TOKEN`

### Telegram
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the token to `TELEGRAM_TOKEN`

### WhatsApp
- WhatsApp integration uses QR code authentication
- A QR code will be displayed in the terminal on first run
- Scan it with WhatsApp to authenticate

## Message Handlers

The bot currently responds to:
- `!ping` - Responds with "pong"

### Adding Custom Handlers

```typescript
// In your code
const handlerRegistry = botManager.getMessageHandlers();
handlerRegistry.registerHandler(/^!hello/i, async (context) => {
  await context.sendMessage('Hello there!');
});
```

## Architecture

```
src/
├── types/           # TypeScript interfaces and types
├── adapters/        # Platform-specific adapters
├── handlers/        # Message handling logic
└── MultiBotManager.ts # Main bot orchestrator
```

### Core Components

- **Platform Adapters**: Abstract platform-specific APIs into unified interfaces
- **Message Handlers**: Process messages in a platform-agnostic way
- **MultiBotManager**: Orchestrates all platforms and handlers

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build
```

## License

MIT
