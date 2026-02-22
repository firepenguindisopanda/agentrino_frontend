"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ChatLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-background dark:bg-[var(--ac-dark-bg)]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--ac-primary-blue)] animate-spin" />
        <span className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">Loading chat...</span>
      </div>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const agentId = searchParams.get('agentId');
  const agentName = searchParams.get('agentName');

  if (!conversationId || !agentId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background dark:bg-[var(--ac-dark-bg)] p-4">
        <p className="text-lg text-[var(--ac-error)] mb-4">Missing conversation or agent ID</p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background dark:bg-[var(--ac-dark-bg)] p-4 md:p-6">
      <ChatContainer className="h-full w-full" />
    </div>
  );
}

export default function ChatPage() {
  const [key, setKey] = useState(0);

  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent key={key} />
    </Suspense>
  );
}
