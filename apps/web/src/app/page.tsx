'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getAgents,
  getOrCreateConversation,
  listConversations,
  deleteConversation,
  type Agent,
  type Conversation,
} from '@/services/chatService';
import { getSessionId } from '@/lib/session';
import { formatRelativeTime } from '@/lib/format';
import { Bot, Gem, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatTile } from '@/components/analytics/StatTile';
import { Meter } from '@/components/analytics/Meter';
import { AgentCard } from '@/components/home/AgentCard';
import { ConversationPanel } from '@/components/home/ConversationPanel';

const MAX_CONVERSATIONS = 10;

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading agents">
      <div className="mb-8 h-9 w-72 animate-pulse rounded-md bg-muted" />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const chatsRef = useRef<HTMLElement>(null);

  const loadData = async () => {
    setError(null);
    try {
      const sessionId = getSessionId();
      const [agentsData, conversationsData] = await Promise.all([
        getAgents(),
        listConversations(sessionId, true),
      ]);
      setAgents(agentsData);
      setConversations(conversationsData ?? []);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartChat = async (agent: Agent) => {
    try {
      setStartingChat(agent.id);
      const conversation = await getOrCreateConversation(agent.id, getSessionId());
      router.push(`/chat?conversationId=${conversation.id}&agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start chat';
      toast.error(message);
      if (message.includes('Maximum')) chatsRef.current?.focus();
    } finally {
      setStartingChat(null);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      setDeletingId(conversationId);
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      toast.success('Chat deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chat');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents
      .filter((a) => a.name !== 'Oracle')
      .filter((a) => !q || a.name.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q));
  }, [agents, query]);

  const active = conversations.filter((c) => !c.is_archived);
  const activeCount = active.length;
  const isAtLimit = activeCount >= MAX_CONVERSATIONS;
  const lastActivity = active
    .map((c) => c.last_activity_at)
    .sort()
    .at(-1);
  const selectableAgentCount = agents.filter((a) => a.name !== 'Oracle').length;

  if (loading) return <HomeSkeleton />;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <p className="text-base font-medium text-critical">{error}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The server may be waking up from a cold start, which can take up to a minute.
        </p>
        <Button onClick={loadData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose your <span className="text-primary-ink">AI Agent</span>
            </h1>
            <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
              Each agent specializes in a different area. Pick one to start a focused conversation, or ask the
              Oracle to compare approaches for a technical decision.
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={() => router.push('/oracle')} className="shrink-0">
            <Gem className="text-primary-ink" />
            Consult Oracle
          </Button>
        </header>

        <section aria-label="Workspace summary" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Agents available" value={selectableAgentCount} icon={<Bot />} hint="Plus the Oracle advisor" />
          <StatTile
            label="Active chats"
            value={
              <>
                {activeCount}
                <span className="text-base font-normal text-muted-foreground"> / {MAX_CONVERSATIONS}</span>
              </>
            }
            icon={<MessageSquare />}
            tone={isAtLimit ? 'critical' : activeCount >= MAX_CONVERSATIONS * 0.8 ? 'warning' : 'neutral'}
            hint={isAtLimit ? 'Limit reached: delete a chat to start a new one' : `${MAX_CONVERSATIONS - activeCount} slots left`}
          >
            <Meter value={activeCount} max={MAX_CONVERSATIONS} label="Active chats used" className="mt-1" />
          </StatTile>
          <StatTile
            className="col-span-2 sm:col-span-1"
            label="Last activity"
            value={lastActivity ? formatRelativeTime(lastActivity) : '—'}
            hint={lastActivity ? new Date(lastActivity).toLocaleString() : 'No conversations yet'}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="agents-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="agents-heading" className="text-sm font-semibold">Agents</h2>
              {selectableAgentCount > 3 && (
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter agents…"
                  aria-label="Filter agents"
                  className="h-8 w-48 rounded-md border border-input bg-card px-2.5 text-sm shadow-xs outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              )}
            </div>

            {agents.length === 0 ? (
              <div className="surface flex flex-col items-center px-6 py-16 text-center">
                <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-6 text-muted-foreground" />
                </span>
                <h3 className="mb-1 text-base font-semibold">No Agents Available</h3>
                <p className="text-sm text-muted-foreground">Check back later or contact support.</p>
              </div>
            ) : visibleAgents.length === 0 ? (
              <p className="surface px-6 py-10 text-center text-sm text-muted-foreground">
                No agents match “{query}”.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    hasConversation={active.some((c) => c.agent_id === agent.id)}
                    isStarting={startingChat === agent.id}
                    anyStarting={startingChat !== null}
                    atLimit={isAtLimit}
                    onStart={handleStartChat}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ConversationPanel
              ref={chatsRef}
              conversations={conversations}
              agents={agents}
              deletingId={deletingId}
              onDelete={handleDeleteConversation}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
