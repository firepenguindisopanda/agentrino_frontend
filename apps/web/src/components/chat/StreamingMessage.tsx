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
    typingSpeed: 1, // Faster typing speed
  });

  return (
    <div className={`message-enter streaming-text ${className}`}>
      <div className="whitespace-pre-wrap break-words">
        {displayedText}
        {isTyping && (
          <span className="inline-block w-2 h-4 bg-cogniflow-electric-cyan ml-1 animate-pulse"></span>
        )}
      </div>
    </div>
  );
}