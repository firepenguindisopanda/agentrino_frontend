import { describe, it, expect, beforeEach } from 'vitest';
import chatReducer, {
  setMessages,
  addMessage,
  updateStreamingMessage,
  finalizeStreamingMessage,
  startStreaming,
  setError,
  clearError,
  clearMessages,
  type ChatState,
  type ChatMessage,
} from '@/store/slices/chatSlice';

describe('chatSlice', () => {
  const initialState: ChatState = {
    messages: [],
    isStreaming: false,
    currentStreamingId: null,
    error: null,
  };

  let state: ChatState;

  beforeEach(() => {
    state = { ...initialState };
  });

  describe('setMessages', () => {
    it('should set messages and reset streaming state', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'Hello',
          role: 'user',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'msg-2',
          content: 'Hi there!',
          role: 'assistant',
          timestamp: '2024-01-01T00:00:01.000Z',
        },
      ];

      const newState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'old-id', error: 'Old error' },
        setMessages(messages)
      );

      expect(newState.messages).toEqual(messages);
      expect(newState.isStreaming).toBe(false);
      expect(newState.currentStreamingId).toBeNull();
      expect(newState.error).toBeNull();
    });

    it('should handle empty messages array', () => {
      const newState = chatReducer(state, setMessages([]));

      expect(newState.messages).toEqual([]);
      expect(newState.isStreaming).toBe(false);
      expect(newState.currentStreamingId).toBeNull();
      expect(newState.error).toBeNull();
    });

    it('should replace existing messages', () => {
      const oldMessages: ChatMessage[] = [
        {
          id: 'old-1',
          content: 'Old message',
          role: 'user',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];

      const newMessages: ChatMessage[] = [
        {
          id: 'new-1',
          content: 'New message',
          role: 'assistant',
          timestamp: '2024-01-02T00:00:00.000Z',
        },
      ];

      let currentState = chatReducer(state, setMessages(oldMessages));
      currentState = chatReducer(currentState, setMessages(newMessages));

      expect(currentState.messages).toHaveLength(1);
      expect(currentState.messages[0].id).toBe('new-1');
    });

    it('should handle messages with isStreaming flag', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'Streaming...',
          role: 'assistant',
          timestamp: '2024-01-01T00:00:00.000Z',
          isStreaming: true,
        },
      ];

      const newState = chatReducer(state, setMessages(messages));

      expect(newState.messages[0].isStreaming).toBe(true);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the messages array', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Hello',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const newState = chatReducer(state, addMessage(message));

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]).toEqual(message);
    });

    it('should append message to existing messages', () => {
      const firstMessage: ChatMessage = {
        id: 'msg-1',
        content: 'First',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const secondMessage: ChatMessage = {
        id: 'msg-2',
        content: 'Second',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:01.000Z',
      };

      let currentState = chatReducer(state, addMessage(firstMessage));
      currentState = chatReducer(currentState, addMessage(secondMessage));

      expect(currentState.messages).toHaveLength(2);
      expect(currentState.messages[0].content).toBe('First');
      expect(currentState.messages[1].content).toBe('Second');
    });

    it('should handle messages with special characters', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Hello <script>alert("xss")</script> & more',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const newState = chatReducer(state, addMessage(message));

      expect(newState.messages[0].content).toBe('Hello <script>alert("xss")</script> & more');
    });

    it('should handle very long message content', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'A'.repeat(10000),
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const newState = chatReducer(state, addMessage(message));

      expect(newState.messages[0].content).toHaveLength(10000);
    });
  });

  describe('updateStreamingMessage', () => {
    it('should append content to an existing streaming message', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: 'Hello',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(
        currentState,
        updateStreamingMessage({ id: 'streaming-1', content: ' world' })
      );

      const updatedMessage = currentState.messages.find(m => m.id === 'streaming-1');
      expect(updatedMessage?.content).toBe('Hello world');
    });

    it('should handle multiple updates to the same message', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: '',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: 'H' }));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: 'i' }));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: '!' }));

      const updatedMessage = currentState.messages.find(m => m.id === 'streaming-1');
      expect(updatedMessage?.content).toBe('Hi!');
    });

    it('should not modify other messages', () => {
      const message1: ChatMessage = {
        id: 'msg-1',
        content: 'First message',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const message2: ChatMessage = {
        id: 'streaming-1',
        content: 'Streaming',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:01.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(state, addMessage(message1));
      currentState = chatReducer(currentState, addMessage(message2));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: ' update' }));

      const unchangedMessage = currentState.messages.find(m => m.id === 'msg-1');
      expect(unchangedMessage?.content).toBe('First message');
    });

    it('should not throw error when message id does not exist', () => {
      expect(() => {
        chatReducer(state, updateStreamingMessage({ id: 'non-existent', content: 'test' }));
      }).not.toThrow();
    });

    it('should handle empty content updates', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: 'Hello',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: '' }));

      const updatedMessage = currentState.messages.find(m => m.id === 'streaming-1');
      expect(updatedMessage?.content).toBe('Hello');
    });

    it('should handle large content updates', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: '',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      const largeContent = 'B'.repeat(5000);

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'streaming-1', content: largeContent }));

      const updatedMessage = currentState.messages.find(m => m.id === 'streaming-1');
      expect(updatedMessage?.content).toBe(largeContent);
    });
  });

  describe('finalizeStreamingMessage', () => {
    it('should mark streaming message as complete', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: 'Final content',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'streaming-1' },
        addMessage(message)
      );
      currentState = chatReducer(currentState, finalizeStreamingMessage('streaming-1'));

      const finalizedMessage = currentState.messages.find(m => m.id === 'streaming-1');
      expect(finalizedMessage?.isStreaming).toBe(false);
      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();
    });

    it('should reset streaming state', () => {
      const message: ChatMessage = {
        id: 'streaming-1',
        content: 'Content',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'streaming-1' },
        addMessage(message)
      );
      currentState = chatReducer(currentState, finalizeStreamingMessage('streaming-1'));

      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();
    });

    it('should not affect other messages', () => {
      const message1: ChatMessage = {
        id: 'msg-1',
        content: 'User message',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const message2: ChatMessage = {
        id: 'streaming-1',
        content: 'Assistant streaming',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:01.000Z',
        isStreaming: true,
      };

      let currentState = chatReducer(state, addMessage(message1));
      currentState = chatReducer(
        { ...currentState, isStreaming: true, currentStreamingId: 'streaming-1' },
        addMessage(message2)
      );
      currentState = chatReducer(currentState, finalizeStreamingMessage('streaming-1'));

      const userMessage = currentState.messages.find(m => m.id === 'msg-1');
      expect(userMessage?.content).toBe('User message');
      expect(userMessage?.isStreaming).toBeUndefined();
    });

    it('should handle finalizing non-existent message gracefully', () => {
      expect(() => {
        chatReducer(
          { ...state, isStreaming: true, currentStreamingId: 'old-id' },
          finalizeStreamingMessage('non-existent')
        );
      }).not.toThrow();
    });

    it('should reset streaming state even when message not found', () => {
      const newState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'old-id' },
        finalizeStreamingMessage('non-existent')
      );

      expect(newState.isStreaming).toBe(false);
      expect(newState.currentStreamingId).toBeNull();
    });
  });

  describe('startStreaming', () => {
    it('should set streaming state with message id', () => {
      const newState = chatReducer(state, startStreaming('new-stream-id'));

      expect(newState.isStreaming).toBe(true);
      expect(newState.currentStreamingId).toBe('new-stream-id');
    });

    it('should overwrite previous streaming state', () => {
      let currentState = chatReducer(state, startStreaming('old-id'));
      currentState = chatReducer(currentState, startStreaming('new-id'));

      expect(currentState.isStreaming).toBe(true);
      expect(currentState.currentStreamingId).toBe('new-id');
    });

    it('should not affect messages array', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Test',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, startStreaming('stream-id'));

      expect(currentState.messages).toHaveLength(1);
      expect(currentState.messages[0].content).toBe('Test');
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Something went wrong';
      const newState = chatReducer(state, setError(errorMessage));

      expect(newState.error).toBe(errorMessage);
    });

    it('should reset streaming state when error occurs', () => {
      const currentState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'stream-id' },
        setError('Error occurred')
      );

      expect(currentState.error).toBe('Error occurred');
      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();
    });

    it('should handle empty error message', () => {
      const newState = chatReducer(state, setError(''));

      expect(newState.error).toBe('');
    });

    it('should handle very long error messages', () => {
      const longError = 'E'.repeat(1000);
      const newState = chatReducer(state, setError(longError));

      expect(newState.error).toHaveLength(1000);
    });

    it('should handle special characters in error message', () => {
      const errorWithSpecialChars = 'Error: <script>alert("xss")</script>';
      const newState = chatReducer(state, setError(errorWithSpecialChars));

      expect(newState.error).toBe(errorWithSpecialChars);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      let currentState = chatReducer(state, setError('Some error'));
      currentState = chatReducer(currentState, clearError());

      expect(currentState.error).toBeNull();
    });

    it('should work when no error exists', () => {
      const newState = chatReducer(state, clearError());

      expect(newState.error).toBeNull();
    });

    it('should not affect messages', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Test',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, setError('Error'));
      currentState = chatReducer(currentState, clearError());

      expect(currentState.messages).toHaveLength(1);
      expect(currentState.messages[0].content).toBe('Test');
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Test',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(currentState, clearMessages());

      expect(currentState.messages).toHaveLength(0);
    });

    it('should reset streaming state', () => {
      const currentState = chatReducer(
        { ...state, isStreaming: true, currentStreamingId: 'stream-id' },
        clearMessages()
      );

      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();
    });

    it('should clear error state', () => {
      const currentState = chatReducer(
        { ...state, error: 'Some error' },
        clearMessages()
      );

      expect(currentState.error).toBeNull();
    });

    it('should reset to initial state when clearing', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        content: 'Test',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      let currentState = chatReducer(state, addMessage(message));
      currentState = chatReducer(
        { ...currentState, isStreaming: true, currentStreamingId: 'id', error: 'err' },
        clearMessages()
      );

      expect(currentState).toEqual(initialState);
    });

    it('should work when messages array is already empty', () => {
      const newState = chatReducer(state, clearMessages());

      expect(newState.messages).toHaveLength(0);
      expect(newState.isStreaming).toBe(false);
      expect(newState.currentStreamingId).toBeNull();
      expect(newState.error).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete chat flow: user message -> streaming response -> finalize', () => {
      // User sends message
      const userMessage: ChatMessage = {
        id: 'user-1',
        content: 'Hello AI',
        role: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      let currentState = chatReducer(state, addMessage(userMessage));
      expect(currentState.messages).toHaveLength(1);
      expect(currentState.messages[0].role).toBe('user');

      // AI starts streaming response
      const aiMessage: ChatMessage = {
        id: 'ai-1',
        content: '',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:01.000Z',
        isStreaming: true,
      };

      currentState = chatReducer(currentState, addMessage(aiMessage));
      currentState = chatReducer(currentState, startStreaming('ai-1'));
      expect(currentState.isStreaming).toBe(true);
      expect(currentState.currentStreamingId).toBe('ai-1');

      // Stream chunks arrive
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'ai-1', content: 'Hello' }));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'ai-1', content: ' there' }));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'ai-1', content: '!' }));

      const streamingMessage = currentState.messages.find(m => m.id === 'ai-1');
      expect(streamingMessage?.content).toBe('Hello there!');

      // Streaming completes
      currentState = chatReducer(currentState, finalizeStreamingMessage('ai-1'));
      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();

      const finalizedMessage = currentState.messages.find(m => m.id === 'ai-1');
      expect(finalizedMessage?.isStreaming).toBe(false);
      expect(finalizedMessage?.content).toBe('Hello there!');
    });

    it('should handle streaming error scenario', () => {
      // Start streaming
      let currentState = chatReducer(state, startStreaming('stream-1'));

      const message: ChatMessage = {
        id: 'stream-1',
        content: 'Partial',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };

      currentState = chatReducer(currentState, addMessage(message));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'stream-1', content: ' content' }));

      // Error occurs
      currentState = chatReducer(currentState, setError('Network error during streaming'));

      expect(currentState.error).toBe('Network error during streaming');
      expect(currentState.isStreaming).toBe(false);
      expect(currentState.currentStreamingId).toBeNull();

      // Message content should remain
      const partialMessage = currentState.messages.find(m => m.id === 'stream-1');
      expect(partialMessage?.content).toBe('Partial content');
    });

    it('should handle multiple consecutive streaming sessions', () => {
      // First streaming session
      let currentState = chatReducer(state, startStreaming('stream-1'));
      const message1: ChatMessage = {
        id: 'stream-1',
        content: '',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:00.000Z',
        isStreaming: true,
      };
      currentState = chatReducer(currentState, addMessage(message1));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'stream-1', content: 'First response' }));
      currentState = chatReducer(currentState, finalizeStreamingMessage('stream-1'));

      expect(currentState.messages[0].content).toBe('First response');

      // Second streaming session
      currentState = chatReducer(currentState, startStreaming('stream-2'));
      const message2: ChatMessage = {
        id: 'stream-2',
        content: '',
        role: 'assistant',
        timestamp: '2024-01-01T00:00:01.000Z',
        isStreaming: true,
      };
      currentState = chatReducer(currentState, addMessage(message2));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: 'stream-2', content: 'Second response' }));
      currentState = chatReducer(currentState, finalizeStreamingMessage('stream-2'));

      expect(currentState.messages).toHaveLength(2);
      expect(currentState.messages[1].content).toBe('Second response');
      expect(currentState.isStreaming).toBe(false);
    });

    it('should maintain message order after various operations', () => {
      const messages: ChatMessage[] = [
        { id: '1', content: 'First', role: 'user', timestamp: '2024-01-01T00:00:00.000Z' },
        { id: '2', content: 'Second', role: 'assistant', timestamp: '2024-01-01T00:00:01.000Z' },
        { id: '3', content: 'Third', role: 'user', timestamp: '2024-01-01T00:00:02.000Z' },
      ];

      let currentState = chatReducer(state, setMessages(messages));
      currentState = chatReducer(currentState, updateStreamingMessage({ id: '2', content: ' edited' }));

      expect(currentState.messages[0].id).toBe('1');
      expect(currentState.messages[1].id).toBe('2');
      expect(currentState.messages[2].id).toBe('3');
    });
  });
});
