'use client';
import React, { useRef, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';

/** Mirrors backend schemas.MAX_MESSAGE_CHARS. */
export const MAX_MESSAGE_CHARS = 8000;

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onCancel,
  isStreaming = false,
  disabled = false,
  placeholder = 'Type your message...',
  className = '',
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (canSend) onSend(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const nearLimit = value.length > MAX_MESSAGE_CHARS * 0.8;

  return (
    <div className={`flex-shrink-0 px-4 pb-3 pt-2 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-card p-2 shadow-card transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={MAX_MESSAGE_CHARS}
            rows={1}
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-foreground outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:opacity-60"
          />
          {isStreaming && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              title="Send message (Enter)"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-subtle-foreground">
          <span>
            <kbd className="rounded border border-border bg-muted px-1 font-sans">Enter</kbd> to send ·{' '}
            <kbd className="rounded border border-border bg-muted px-1 font-sans">Shift + Enter</kbd> for new line
          </span>
          {nearLimit && (
            <span className="tabular text-warning" aria-live="polite">
              {value.length.toLocaleString()} / {MAX_MESSAGE_CHARS.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
