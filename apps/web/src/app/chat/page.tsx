"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

function ChatLoading() {
  return (
    <div className="flex h-full items-center justify-center" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading chat...</span>
      </div>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const agentId = searchParams.get('agentId');

  if (!conversationId || !agentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center" role="alert">
        <p className="text-base font-medium text-critical">Missing conversation or agent ID</p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Go to Home
        </Link>
      </div>
    );
  }

  return <ChatContainer className="h-full w-full" />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
