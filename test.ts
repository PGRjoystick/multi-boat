import { createDefaultHandlers } from './src/handlers/messageHandler.js';
import { Platform } from './src/types/index.js';
import type { UnifiedMessage, UnifiedUser } from './src/types/index.js';

// Simple test to verify the message handling system works
async function testMessageHandling() {
  console.log('Testing message handling system...');

  const handlers = createDefaultHandlers();
  
  // Mock message
  const mockUser: UnifiedUser = {
    id: 'test-user',
    username: 'testuser',
    displayName: 'Test User',
    platform: Platform.DISCORD
  };

  const mockMessage: UnifiedMessage = {
    id: 'test-msg-1',
    content: '!ping',
    author: mockUser,
    platform: Platform.DISCORD,
    timestamp: new Date(),
    chatId: 'test-chat',
    isFromBot: false
  };

  let responseMessage = '';
  const mockSendMessage = async (content: string) => {
    responseMessage = content;
    console.log(`Mock send: ${content}`);
  };

  // Test the handler
  await handlers.processMessage(mockMessage, mockSendMessage);
  
  if (responseMessage === 'pong') {
    console.log('✅ Message handling test passed!');
  } else {
    console.log('❌ Message handling test failed!');
  }
}

testMessageHandling().catch(console.error);
