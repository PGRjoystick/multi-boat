<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Multi-Boat Chatbot Project Instructions

This is a multi-platform chatbot project that supports Discord, Telegram, and WhatsApp platforms with a unified message handling system.

## Key Architecture Principles

- **Platform Agnostic**: All platform-specific logic is abstracted through adapters
- **Unified Interface**: Common interfaces for messages, users, and platform operations
- **Type Safety**: Comprehensive TypeScript types for all platforms
- **Modular Design**: Each platform adapter is independent and pluggable
- **Graceful Error Handling**: Platforms can fail independently without affecting others
- **Session Persistence**: WhatsApp sessions are preserved across restarts

## Project Structure

```
src/
├── types/           # TypeScript interfaces (UnifiedMessage, IPlatformAdapter, etc.)
├── adapters/        # Platform-specific adapters (discord.ts, telegram.ts, whatsapp.ts)
├── handlers/        # Message handling logic (messageHandler.ts)
├── MultiBotManager.ts # Main orchestrator class
├── main.ts         # Application entry point
└── index.ts        # Public API exports
```

## Core Components

### Platform Adapters
- **DiscordAdapter**: Uses discord.js with GatewayIntentBits for Discord integration
- **TelegramAdapter**: Uses grammY library for Telegram Bot API
- **WhatsAppAdapter**: Uses @whiskeysockets/baileys with QR code authentication

### Message Handling
- **Built-in ping handler**: Responds to "!ping" with "pong" (case-insensitive)
- **Extensible registry**: Add custom handlers using `MessageHandlerRegistry`
- **Platform context**: Handlers receive unified message context with platform info

### MultiBotManager
- **Multi-platform orchestration**: Manages all platform adapters
- **Independent initialization**: Each platform initializes separately with error isolation
- **Graceful shutdown**: Preserves sessions when possible during shutdown

## Code Patterns

### Message Handlers
```typescript
// Built-in ping handler
if (message.content.toLowerCase().startsWith('!ping')) {
  await context.sendMessage('pong');
}

// Custom handler registration
registry.registerHandler(/^!hello/i, async (context) => {
  await context.sendMessage(`Hello ${context.message.author.displayName}!`);
});
```

### Platform Adapter Implementation
- Implement `IPlatformAdapter` interface
- Use `UnifiedMessage` for all message processing
- Handle platform-specific authentication and connection logic
- Provide graceful error handling and reconnection

### Configuration
- Environment-based configuration via `.env` file
- Optional platform tokens (platforms without tokens are skipped)
- WhatsApp uses QR code authentication with session persistence

## Error Handling Patterns

- **Platform Independence**: Failed platforms don't prevent others from starting
- **Automatic Reconnection**: WhatsApp and other platforms attempt reconnection with exponential backoff
- **Session Management**: WhatsApp sessions are preserved across restarts when possible
- **Graceful Degradation**: System continues with available platforms

## Dependencies

- **Discord**: discord.js (v14+)
- **Telegram**: grammY
- **WhatsApp**: @whiskeysockets/baileys
- **QR Codes**: qrcode-terminal for WhatsApp authentication
- **Runtime**: vite-node for TypeScript execution
- **Environment**: dotenv for configuration

## Development Guidelines

- Always use type-only imports where possible due to `verbatimModuleSyntax`
- Handle platform-specific errors appropriately
- Preserve user sessions when implementing disconnect logic
- Use the unified message interface for cross-platform compatibility
- Test each platform adapter independently
