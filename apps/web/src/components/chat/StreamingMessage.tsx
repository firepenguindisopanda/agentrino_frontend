'use client';
import React from 'react';
import { useStreamingText } from '@/components/hooks/useStreamingText';
import type { ChatMessage } from '@/store/slices/chatSlice';

interface StreamingMessageProps {
  message: ChatMessage;
  className?: string;
}

export function StreamingMessage({ message, className = '' }: StreamingMessageProps) {
  const { displayedText, isTyping } = useStreamingText(message.content, {
    typingSpeed: 1,
  });

  return (
    <div className={`streaming-text ${className}`} aria-live="polite" aria-busy={isTyping}>
      <div className="whitespace-pre-wrap break-words">
        {displayedText}
        {isTyping && (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
