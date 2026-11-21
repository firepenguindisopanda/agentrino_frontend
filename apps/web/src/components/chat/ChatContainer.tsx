'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '@/components/hooks/useChat';
import type { RootState } from '@/store';
import { AlertCircle, Loader2, Bot, Trash2 } from 'lucide-react';

interface ChatContainerProps {
  className?: string;
}

const STATUS: Record<string, { label: string; dot: string }> = {
  connected: { label: 'Connected', dot: 'bg-good' },
  connecting: { label: 'Connecting...', dot: 'bg-warning' },
  error: { label: 'Error', dot: 'bg-critical' },
  disconnected: { label: 'Offline', dot: 'bg-subtle-foreground' },
};

const SUGGESTIONS = [
  'What can you help me with?',
  'Give me a step-by-step plan for my next task',
  'Explain this concept simply, then in depth',
];

export function ChatContainer({ className = '' }: ChatContainerProps) {
  const {
    messages,
    isStreaming,
    error,
    connectionStatus,
    inputValue,
    setInputValue,
    sendMessage,
    cancelStreaming,
    clearChat,
    agentName,
  } = useChat();

  const { isLoading } = useSelector((state: RootState) => state.ui);
  const status = STATUS[connectionStatus] ?? STATUS.disconnected;

  useEffect(() => {
    document.getElementById('chat-input')?.focus();
  }, []);

  const applySuggestion = (text: string) => {
    setInputValue(text);
    document.getElementById('chat-input')?.focus();
  };

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <div className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 sm:inline"
            >
              Agents
            </Link>
            <span className="hidden text-border-strong sm:inline" aria-hidden="true">
              /
            </span>
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold leading-tight">{agentName || 'AI Agent'}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" role="status">
                {connectionStatus === 'connecting' ? (
                  <Loader2 size={10} className="animate-spin text-warning" />
                ) : (
                  <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                )}
                <span>{status.label}</span>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              title="Clear this view. Saved history reloads on your next visit."
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-3 w-full max-w-3xl px-4 sm:px-6">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-critical/30 bg-critical-soft px-3 py-2.5 text-sm text-foreground"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-critical" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        agentName={agentName}
        suggestions={SUGGESTIONS}
        onSuggestion={applySuggestion}
      />

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        onCancel={cancelStreaming}
        isStreaming={isStreaming}
        disabled={isLoading}
        placeholder={isStreaming ? 'AI is thinking...' : `Message ${agentName || 'AI Agent'}...`}
      />
    </div>
  );
}
