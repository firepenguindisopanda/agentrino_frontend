import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import chatReducer, { type ChatMessage } from '@/store/slices/chatSlice';
import uiReducer from '@/store/slices/uiSlice';
import { ChatContainer } from '@/components/chat/ChatContainer';

// Mock next/navigation
const mockSearchParams = new Map([
  ['conversationId', 'conv-123'],
  ['agentId', 'agent-1'],
  ['agentName', 'Test Agent'],
]);

const mockGet = vi.fn((key: string) => mockSearchParams.get(key));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock the services
vi.mock('@/services/chatService', () => ({
  getConversation: vi.fn().mockResolvedValue({ id: 'conv-123', agent_id: 'agent-1', title: null }),
  getMessages: vi.fn().mockResolvedValue([]),
  sendStreamingChatMessage: vi.fn(),
}));

vi.mock('@/services/streamParser', () => ({
  parseStream: vi.fn(),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-123'),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>Loading...</div>
  ),
  Send: ({ size: _size }: { size?: number }) => (
    <div data-testid="send-icon">Send</div>
  ),
  Square: ({ size: _size }: { size?: number }) => (
    <div data-testid="square-icon">Stop</div>
  ),
  AlertCircle: ({ size: _size }: { size?: number }) => (
    <div data-testid="alert-icon">Alert</div>
  ),
  Wifi: ({ size: _size, className }: { size?: number; className?: string }) => (
    <div data-testid="wifi-icon" className={className}>Connected</div>
  ),
  WifiOff: ({ size: _size }: { size?: number }) => (
    <div data-testid="wifi-off-icon">Disconnected</div>
  ),
  Bot: ({ className }: { className?: string }) => (
    <div data-testid="bot-icon" className={className}>Bot</div>
  ),
  User: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className}>User</div>
  ),
  Trash2: ({ size: _size }: { size?: number }) => (
    <div data-testid="trash-icon">Trash</div>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <div data-testid="sparkles-icon" className={className}>Sparkles</div>
  ),
}));

// Create a mock store factory
const createMockStore = (preloadedState?: {
  chat?: {
    messages: ChatMessage[];
    isStreaming: boolean;
    currentStreamingId: string | null;
    error: string | null;
  };
  ui?: {
    isLoading: boolean;
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  };
}) => 
  configureStore({
    reducer: {
      chat: chatReducer,
      ui: uiReducer,
    },
    preloadedState: {
      chat: preloadedState?.chat || {
        messages: [],
        isStreaming: false,
        currentStreamingId: null,
        error: null,
      },
      ui: {
        isLoading: preloadedState?.ui?.isLoading ?? false,
        connectionStatus: preloadedState?.ui?.connectionStatus ?? 'disconnected',
        theme: 'system' as const,
        sidebarOpen: false,
      },
    },
  });

describe('Chat Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatContainer', () => {
    it('should render welcome message when no messages exist', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByText('Ready to Chat')).toBeInTheDocument();
      expect(screen.getByText(/Ask me anything/i)).toBeInTheDocument();
    });

    it('should render messages when they exist in the store', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'Hello, how can I help you?',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          content: 'I need help with my project',
          role: 'user',
          timestamp: new Date().toISOString(),
        },
      ];

      const store = createMockStore({
        chat: {
          messages,
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
      expect(screen.getByText('I need help with my project')).toBeInTheDocument();
    });

    it('should render message input textarea', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      const textarea = screen.getByPlaceholderText(/Message.*\.\.\./);
      expect(textarea).toBeInTheDocument();
    });

    it('should show disabled input when isStreaming', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: true,
          currentStreamingId: 'streaming-msg',
          error: null,
        },
        ui: {
          isLoading: true,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      const textarea = screen.getByPlaceholderText('AI is thinking...');
      expect(textarea).toBeDisabled();
    });

    it('should show send button', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('should show cancel button when streaming', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: true,
          currentStreamingId: 'streaming-msg',
          error: null,
        },
        ui: {
          isLoading: true,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
    });

    it('should render keyboard shortcut hint in footer', () => {
      const store = createMockStore({
        chat: {
          messages: [],
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByText(/to send/)).toBeInTheDocument();
    });

    it('should render Clear Chat button when messages exist', () => {
      const store = createMockStore({
        chat: {
          messages: [{
            id: 'msg-1',
            content: 'Test message',
            role: 'user',
            timestamp: new Date().toISOString(),
          }],
          isStreaming: false,
          currentStreamingId: null,
          error: null,
        },
        ui: {
          isLoading: false,
          connectionStatus: 'connected',
        },
      });

      render(
        <Provider store={store}>
          <ChatContainer />
        </Provider>
      );

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });
});
