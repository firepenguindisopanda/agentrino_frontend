'use client';
import { ArrowRight, Bot, Loader2 } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Agent } from '@/services/chatService';

interface AgentCardProps {
  agent: Agent;
  hasConversation: boolean;
  isStarting: boolean;
  anyStarting: boolean;
  atLimit: boolean;
  onStart: (agent: Agent) => void;
}

const FALLBACK_COLOR = '#2a78d6';

export function AgentCard({ agent, hasConversation, isStarting, anyStarting, atLimit, onStart }: AgentCardProps) {
  const blockedByLimit = atLimit && !hasConversation;
  return (
    <Card className="group relative transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card">
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg text-white shadow-xs"
            style={{ backgroundColor: agent.color || FALLBACK_COLOR }}
            aria-hidden="true"
          >
            <Bot className="size-5" />
          </span>
          {hasConversation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-ink">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              In progress
            </span>
          )}
        </div>
        <CardTitle className="text-base">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-3 min-h-[3lh]">
          {agent.description || 'Ready to assist you with specialized knowledge and expertise.'}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto border-t-0 pt-0">
        <Button
          className="w-full"
          variant={hasConversation ? 'outline' : 'default'}
          onClick={() => onStart(agent)}
          disabled={anyStarting || blockedByLimit}
        >
          {isStarting ? (
            <>
              <Loader2 className="animate-spin" />
              Starting...
            </>
          ) : hasConversation ? (
            <>
              Continue Chat
              <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
            </>
          ) : blockedByLimit ? (
            <>Limit Reached</>
          ) : (
            <>
              Start Chat
              <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
