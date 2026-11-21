import React from 'react';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} role="status" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">Thinking...</span>
    </div>
  );
}
