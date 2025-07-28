<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Multi-Boat Chatbot Project Instructions

This is a multi-platform chatbot project that supports Discord, Telegram, and WhatsApp platforms with a unified message handling system.

## Key Architecture Principles

- **Platform Agnostic**: All platform-specific logic is abstracted through adapters
- **Unified Interface**: Common interfaces for messages, users, and platform operations
- **Type Safety**: Comprehensive TypeScript types for all platforms
- **Modular Design**: Each platform adapter is independent and pluggable

## Code Patterns

- Use the `UnifiedMessage` interface for all message handling
- Platform adapters should implement the `IPlatformAdapter` interface
- Message handlers should be platform-agnostic and work with unified types
- Configuration should support multiple platform credentials
- Error handling should be consistent across all platforms

## Dependencies

- Discord: discord.js
- Telegram: grammY
- WhatsApp: @whiskeysockets/baileys
- Runtime: vite-node for TypeScript execution
