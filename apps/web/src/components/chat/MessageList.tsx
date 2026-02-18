'use client';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { StreamingMessage } from './StreamingMessage';
import { TypingIndicator } from './TypingIndicator';
import { Bot, User, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/store/slices/chatSlice';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  className?: string;
}

export function MessageList({ messages, isStreaming, className = '' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className={`flex-1 min-h-0 overflow-y-auto chat-scrollbar p-4 space-y-4 ${className}`}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--ac-primary-blue)] mb-4 shadow-lg shadow-[var(--ac-primary-blue)]/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground dark:text-[var(--ac-text-primary)] mb-2">
              Ready to Chat
            </h3>
            <p className="text-muted-foreground dark:text-[var(--ac-text-secondary)] text-sm leading-relaxed">
              Ask me anything! I&apos;m here to help with questions, ideas, or just conversation.
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-[var(--ac-primary-blue)]'
                : 'bg-[var(--ac-accent-blue)]'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            {/* Message Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 chat-transition ${
                message.role === 'user'
                  ? 'bg-[var(--ac-user-message-bg)] border border-[var(--ac-user-message-border)] text-[var(--ac-user-text)]'
                  : 'bg-muted dark:bg-[var(--ac-assistant-message-bg)] border border-border dark:border-[var(--ac-assistant-message-border)] text-card-foreground dark:text-[var(--ac-assistant-text)]'
              }`}
            >
              {message.isStreaming ? (
                <StreamingMessage message={message} />
              ) : (
                <div className="message-enter prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground dark:text-[var(--ac-text-muted)] mt-2 opacity-60">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))
      )}

      {isStreaming && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--ac-accent-blue)]">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-muted dark:bg-[var(--ac-assistant-message-bg)] border border-border dark:border-[var(--ac-assistant-message-border)] rounded-2xl px-4 py-3">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
