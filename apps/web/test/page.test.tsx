import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from '@/app/page';
import chatReducer from '@/store/slices/chatSlice';
import uiReducer from '@/store/slices/uiSlice';
import * as chatService from '@/services/chatService';
import { vi } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock chatService
vi.mock('@/services/chatService', () => ({
  getAgents: vi.fn(),
  createConversation: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: { 
    children: React.ReactNode; 
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>Loading...</div>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <div data-testid="message-icon" className={className}>Message</div>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <div data-testid="arrow-icon" className={className}>→</div>
  ),
  Bot: ({ className }: { className?: string }) => (
    <div data-testid="bot-icon" className={className}>Bot</div>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <div data-testid="sparkles-icon" className={className}>Sparkles</div>
  ),
}));

// Create a mock store factory
const createMockStore = () => configureStore({
  reducer: {
    chat: chatReducer,
    ui: uiReducer,
  },
});

// Mock agents data
const mockAgents = [
  {
    id: 'agent-1',
    name: 'Test Agent 1',
    description: 'This is test agent 1',
    system_prompt: 'You are test agent 1',
    color: '#00f0ff',
    icon: null,
  },
  {
    id: 'agent-2',
    name: 'Test Agent 2',
    description: 'This is test agent 2',
    system_prompt: 'You are test agent 2',
    color: '#ff00ff',
    icon: 'bot',
  },
  {
    id: 'agent-3',
    name: 'Test Agent 3',
    description: null,
    system_prompt: 'You are test agent 3',
    color: null,
    icon: null,
  },
];

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching agents', async () => {
      // Delay the resolution to ensure loading state is visible
      vi.mocked(chatService.getAgents).mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(mockAgents), 100))
      );

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      // Should show loading spinner initially
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Success State - Agent Cards', () => {
    it('should render agent cards after successful fetch', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      // Wait for agents to load
      await waitFor(() => {
        expect(screen.getByText('AI Agent')).toBeInTheDocument();
      });

      // Check all agents are rendered
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 3')).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText('This is test agent 1')).toBeInTheDocument();
      expect(screen.getByText('This is test agent 2')).toBeInTheDocument();
      expect(screen.getByText(/Ready to assist/)).toBeInTheDocument();
    });

    it('should render correct number of agent cards', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        expect(cards).toHaveLength(3);
      });
    });

    it('should render Bot icon when no custom icon is provided', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue([
        { ...mockAgents[0], icon: null, name: 'Alpha Agent' }
      ]);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument(); // Bot icon is used for all agents
      });
    });

    it('should render Bot icon when agent has no name', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue([
        { ...mockAgents[0], name: '', icon: null }
      ]);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument(); // Bot icon is used for all agents
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when agents fail to load', async () => {
      vi.mocked(chatService.getAgents).mockRejectedValue(new Error('Network error'));

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load agents. Is the backend running?')).toBeInTheDocument();
      });
    });

    it('should show retry button when error occurs', async () => {
      vi.mocked(chatService.getAgents).mockRejectedValue(new Error('Network error'));

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        const retryButton = screen.getAllByTestId('button').find(
          btn => btn.textContent?.includes('Retry')
        );
        expect(retryButton).toBeDefined();
      });
    });

    it('should call getAgents when retry button is clicked', async () => {
      // Test that clicking retry triggers a new API call
      const getAgentsMock = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAgents);
      
      vi.mocked(chatService.getAgents).mockImplementation(getAgentsMock);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load agents. Is the backend running?')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getAllByTestId('button').find(
        btn => btn.textContent?.includes('Retry')
      );
      
      if (retryButton) {
        fireEvent.click(retryButton);
      }

      // Verify that getAgents was called a second time (retry)
      await waitFor(() => {
        expect(getAgentsMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Start Chat Functionality', () => {
    it('should navigate to chat page when Start Chat is clicked', async () => {
      const mockConversation = { id: 'conv-123', agent_id: 'agent-1', title: null };
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);
      vi.mocked(chatService.createConversation).mockResolvedValue(mockConversation);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      });

      // Find and click the Start Chat button for the first agent
      const startChatButtons = screen.getAllByTestId('button');
      const firstStartButton = startChatButtons.find(btn => 
        btn.textContent?.includes('Start Chat')
      );

      if (firstStartButton) {
        fireEvent.click(firstStartButton);
      }

      // Wait for navigation
      await waitFor(() => {
        expect(chatService.createConversation).toHaveBeenCalledWith('agent-1');
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/chat?conversationId=conv-123&agentId=agent-1&agentName=Test%20Agent%201'
        );
      });
    });

    it('should show loading state when starting a chat', async () => {
      const mockConversation = { id: 'conv-123', agent_id: 'agent-1', title: null };
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);
      vi.mocked(chatService.createConversation).mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(mockConversation), 100))
      );

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      });

      // Find and click the Start Chat button
      const startChatButtons = screen.getAllByTestId('button');
      const firstStartButton = startChatButtons.find(btn => 
        btn.textContent?.includes('Start Chat')
      );

      if (firstStartButton) {
        fireEvent.click(firstStartButton);
      }

      // Should show loading state immediately
      await waitFor(() => {
        expect(screen.getByText('Starting...')).toBeInTheDocument();
      });
    });

    it('should disable all Start Chat buttons while one is loading', async () => {
      const mockConversation = { id: 'conv-123', agent_id: 'agent-1', title: null };
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);
      vi.mocked(chatService.createConversation).mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(mockConversation), 100))
      );

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      });

      // Click first Start Chat button
      const buttons = screen.getAllByTestId('button');
      const firstStartButton = buttons.find(btn => 
        btn.textContent?.includes('Start Chat')
      );

      if (firstStartButton) {
        fireEvent.click(firstStartButton);
      }

      // All buttons should be disabled
      await waitFor(() => {
        const allButtons = screen.getAllByTestId('button');
        allButtons.forEach(btn => {
          expect(btn).toBeDisabled();
        });
      });
    });

    it('should handle conversation creation error gracefully', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue(mockAgents);
      vi.mocked(chatService.createConversation).mockRejectedValue(new Error('Failed to create'));

      // Mock console.error to prevent error output in test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      });

      // Find and click the Start Chat button
      const startChatButtons = screen.getAllByTestId('button');
      const firstStartButton = startChatButtons.find(btn => 
        btn.textContent?.includes('Start Chat')
      );

      if (firstStartButton) {
        fireEvent.click(firstStartButton);
      }

      // Wait for error to be logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // Buttons should be re-enabled after error
      await waitFor(() => {
        const buttons = screen.getAllByTestId('button');
        const startButtons = buttons.filter(btn => 
          btn.textContent?.includes('Start Chat')
        );
        startButtons.forEach(btn => {
          expect(btn).not.toBeDisabled();
        });
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('should render empty grid when no agents are returned', async () => {
      vi.mocked(chatService.getAgents).mockResolvedValue([]);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('No Agents Available')).toBeInTheDocument();
      });

      // No cards should be rendered
      expect(screen.queryAllByTestId('card')).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle agents with special characters in names', async () => {
      const specialAgents = [
        {
          id: 'agent-special',
          name: 'Agent <script>alert("xss")</script>',
          description: 'Test & Verify',
          system_prompt: 'Test',
          color: '#00f0ff',
          icon: null,
        },
      ];
      vi.mocked(chatService.getAgents).mockResolvedValue(specialAgents);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Agent <script>alert("xss")</script>')).toBeInTheDocument();
      });
    });

    it('should handle very long agent descriptions', async () => {
      const longDescAgents = [
        {
          id: 'agent-long',
          name: 'Long Desc Agent',
          description: 'A'.repeat(500),
          system_prompt: 'Test',
          color: '#00f0ff',
          icon: null,
        },
      ];
      vi.mocked(chatService.getAgents).mockResolvedValue(longDescAgents);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Long Desc Agent')).toBeInTheDocument();
      });

      // Description should be present but truncated by CSS
      const description = screen.getByText('A'.repeat(500));
      expect(description).toBeInTheDocument();
    });

    it('should handle undefined color gracefully', async () => {
      const noColorAgent = [
        {
          id: 'agent-nocolor',
          name: 'No Color Agent',
          description: 'Test',
          system_prompt: 'Test',
          color: undefined as unknown as null,
          icon: null,
        },
      ];
      vi.mocked(chatService.getAgents).mockResolvedValue(noColorAgent);

      render(
        <Provider store={createMockStore()}>
          <Home />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('No Color Agent')).toBeInTheDocument();
      });
    });
  });
});
