'use client';
import React, { useRef, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';

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
  placeholder = "Type your message...",
  className = '',
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value.trim());
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  return (
    <div className={`flex-shrink-0 flex items-end gap-3 p-4 border-t border-[var(--ac-card-border)] bg-[var(--ac-card-bg)] backdrop-blur-xl ${className}`}>
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full resize-none rounded-xl border border-[var(--ac-input-border)] bg-[var(--ac-input-bg)] px-4 py-3 text-[var(--ac-pure-white)] placeholder-[var(--ac-slate-gray)] focus:border-[var(--ac-input-focus-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ac-electric-violet)]/20 disabled:opacity-50 disabled:cursor-not-allowed chat-transition input-focus min-h-[48px] max-h-[120px]"
          rows={1}
        />

        {/* Character count indicator */}
        {value.length > 500 && (
          <div className="absolute -top-6 right-0 text-xs text-[var(--ac-warm-orange)]">
            {value.length}/2000
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isStreaming && onCancel && (
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--ac-error)] text-white hover:bg-red-500 button-hover chat-transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--ac-error)]/20"
            title="Cancel streaming"
          >
            <Square size={16} />
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--ac-electric-violet)] text-white hover:bg-[var(--ac-glow-purple)] button-hover chat-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[var(--ac-electric-violet)]/30"
          title="Send message (Enter)"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}