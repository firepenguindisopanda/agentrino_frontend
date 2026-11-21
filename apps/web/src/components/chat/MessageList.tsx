'use client';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { StreamingMessage } from './StreamingMessage';
import { TypingIndicator } from './TypingIndicator';
import { CodeBlock } from './CodeBlock';
import { CopyButton } from './CopyButton';
import { Bot, Gem, BookOpen } from 'lucide-react';
import type { ChatMessage } from '@/store/slices/chatSlice';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  className?: string;
  agentName?: string | null;
  /** Starter prompts shown in the empty state; selecting one fills the composer. */
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
}

/** Distance from the bottom (px) within which we keep following new content. */
const FOLLOW_THRESHOLD = 120;

export function MessageList({
  messages,
  isStreaming,
  className = '',
  agentName,
  suggestions = [],
  onSuggestion,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD;
  };

  // Follow new content only while the reader is at the bottom, so scrolling up
  // to re-read an earlier answer isn't hijacked by the stream.
  useEffect(() => {
    if (followRef.current) endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, isStreaming]);

  // An assistant turn that failed before producing any text has nothing to show.
  const visible = messages.filter((m) => m.role === 'user' || m.isStreaming || m.content);
  const lastIsEmptyStream = visible.at(-1)?.isStreaming && !visible.at(-1)?.content;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`chat-scrollbar min-h-0 flex-1 overflow-y-auto ${className}`}
    >
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 sm:px-6" role="log" aria-label="Conversation" aria-live="off">
        {visible.length === 0 ? (
          <div className="m-auto max-w-md py-10 text-center">
            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
              <Gem className="size-6" />
            </span>
            <h3 className="mb-1.5 text-lg font-semibold">Ready to Chat</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ask me anything! I&apos;m here to help with questions, ideas, or just conversation.
            </p>
            {suggestions.length > 0 && onSuggestion && (
              <div className="mt-6 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSuggestion(s)}
                    className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ol className="space-y-6">
            {visible.map((message) =>
              message.role === 'user' ? (
                <li key={message.id} className="message-enter flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-xs">
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </li>
              ) : message.isStreaming && !message.content ? null : (
                <li key={message.id} className="message-enter group flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground" aria-hidden="true">
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="sr-only">{agentName || 'Assistant'} said:</p>
                    {message.isStreaming ? (
                      <div className="text-[15px] leading-relaxed text-foreground">
                        <StreamingMessage message={message} />
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-foreground dark:prose-invert prose-headings:font-semibold prose-a:text-primary-ink">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                          components={{ pre: CodeBlock }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-subtle-foreground">
                      {message.usedRag && (
                        <span className="inline-flex items-center gap-1 rounded bg-good-soft px-1.5 py-0.5 font-medium text-good">
                          <BookOpen className="size-3" />
                          {message.ragDocsCount} docs
                        </span>
                      )}
                      {!message.isStreaming && message.content && <CopyButton text={message.content} />}
                      <time dateTime={message.timestamp} className="tabular">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>
                </li>
              )
            )}
          </ol>
        )}

        {isStreaming && (lastIsEmptyStream || visible.length === 0) && (
          <div className="mt-6 flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground" aria-hidden="true">
              <Bot className="size-4" />
            </span>
            <TypingIndicator className="pt-1" />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
