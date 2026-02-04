import React from 'react';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-[var(--ac-electric-violet)] rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-[var(--ac-neon-magenta)] rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-[var(--ac-cyber-cyan)] rounded-full typing-dot"></div>
      </div>
      <span className="text-xs text-[var(--ac-slate-gray)]">
        Thinking...
      </span>
    </div>
  );
}