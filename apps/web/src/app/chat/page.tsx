"use client";

import { Suspense } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Loader2 } from 'lucide-react';

function ChatLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-[var(--ac-dark-void)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--ac-electric-violet)] rounded-full blur-xl opacity-50 animate-pulse" />
          <Loader2 className="w-10 h-10 text-[var(--ac-electric-violet)] animate-spin relative" />
        </div>
        <span className="text-[var(--ac-silver-mist)] text-sm">Loading chat...</span>
      </div>
    </div>
  );
}

function ChatContent() {
  return (
    <div className="h-full w-full bg-[var(--ac-dark-void)] p-4 md:p-6">
      <ChatContainer className="h-full w-full" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
