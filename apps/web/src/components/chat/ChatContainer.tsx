'use client';
import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '@/components/hooks/useChat';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { AlertCircle, Wifi, WifiOff, Loader2, Bot, Trash2 } from 'lucide-react';

interface ChatContainerProps {
  className?: string;
}

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

  useEffect(() => {
    const input = document.querySelector('textarea') as HTMLTextAreaElement;
    input?.focus();
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={14} className="text-[var(--ac-connected)]" />;
      case 'connecting':
        return <Loader2 size={14} className="text-[var(--ac-connecting)] animate-spin" />;
      case 'error':
        return <AlertCircle size={14} className="text-[var(--ac-error)]" />;
      default:
        return <WifiOff size={14} className="text-[var(--ac-disconnected)]" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-card dark:bg-[var(--ac-card-bg)] rounded-2xl border border-border dark:border-[var(--ac-border-color)] overflow-hidden shadow-xl dark:shadow-2xl ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border dark:border-[var(--ac-border-color)] bg-card dark:bg-[var(--ac-card-bg)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative hidden dark:block">
            <div className="absolute inset-0 bg-[var(--ac-primary-blue)] rounded-xl blur opacity-50" />
            <div className="relative bg-[var(--ac-primary-blue)] p-2 rounded-xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="relative dark:hidden">
            <div className="relative bg-[var(--ac-primary-blue)] p-2 rounded-xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground dark:text-[var(--ac-text-primary)]">
              {agentName || 'AI Agent'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs">
              {getConnectionIcon()}
              <span className="text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                {getConnectionText()}
              </span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground dark:text-[var(--ac-text-secondary)] hover:text-[var(--ac-error)] bg-muted dark:bg-[var(--ac-input-bg)] hover:bg-[var(--ac-error)]/10 rounded-lg border border-border dark:border-[var(--ac-input-border)] hover:border-[var(--ac-error)]/30 transition-all duration-200"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[var(--ac-error)]/10 border-l-4 border-[var(--ac-error)] px-4 py-3 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--ac-error)]" />
            <span className="text-sm text-card-foreground dark:text-[var(--ac-text-primary)]">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        className="flex-1"
      />

      {/* Input Area */}
      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        onCancel={cancelStreaming}
        isStreaming={isStreaming}
        disabled={isLoading}
        placeholder={isStreaming ? "AI is thinking..." : `Message ${agentName || 'AI Agent'}...`}
      />

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-2.5 bg-card dark:bg-[var(--ac-card-bg)] border-t border-border dark:border-[var(--ac-border-color)]">
        <div className="flex items-center justify-center text-xs text-muted-foreground dark:text-[var(--ac-text-secondary)]">
          <span className="opacity-60">Press <kbd className="px-1.5 py-0.5 bg-muted dark:bg-[var(--ac-input-bg)] rounded text-[10px] mx-1">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-muted dark:bg-[var(--ac-input-bg)] rounded text-[10px] mx-1">Shift + Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}
