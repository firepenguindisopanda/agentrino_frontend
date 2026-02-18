"use client";

import { Suspense } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Loader2 } from 'lucide-react';

function ChatLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-background dark:bg-[var(--ac-dark-bg)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative hidden dark:block">
          <div className="absolute inset-0 bg-[var(--ac-primary-blue)] rounded-full blur-xl opacity-50 animate-pulse" />
          <Loader2 className="w-10 h-10 text-[var(--ac-primary-blue)] animate-spin relative" />
        </div>
        <Loader2 className="w-10 h-10 text-[var(--ac-primary-blue)] animate-spin dark:hidden" />
        <span className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">Loading chat...</span>
      </div>
    </div>
  );
}

function ChatContent() {
  return (
    <div className="h-full w-full bg-background dark:bg-[var(--ac-dark-bg)] p-4 md:p-6">
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
