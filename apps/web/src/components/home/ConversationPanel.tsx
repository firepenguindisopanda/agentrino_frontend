'use client';
import { forwardRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import type { Agent, Conversation } from '@/services/chatService';
import { formatRelativeTime } from '@/lib/format';

interface ConversationPanelProps {
  conversations: Conversation[];
  agents: Agent[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}

/**
 * The session's chats, most recent first, with continue links and a two-step
 * (confirm) delete so a single misclick can't destroy a conversation.
 */
export const ConversationPanel = forwardRef<HTMLElement, ConversationPanelProps>(function ConversationPanel(
  { conversations, agents, deletingId, onDelete },
  ref
) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );

  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="chats-heading" className="surface p-4 outline-none">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="chats-heading" className="text-sm font-semibold">Your chats</h2>
        <span className="text-xs text-muted-foreground tabular">{conversations.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageSquare className="size-5 text-subtle-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No chats yet. Pick an agent to start one.</p>
        </div>
      ) : (
        <ul className="-mx-1 space-y-0.5">
          {sorted.map((conv) => {
            const agent = agents.find((a) => a.id === conv.agent_id);
            const agentName = agent?.name || 'Unknown Agent';
            const confirming = confirmId === conv.id;
            const href = `/chat?conversationId=${conv.id}&agentId=${conv.agent_id}&agentName=${encodeURIComponent(agentName)}`;
            return (
              <li key={conv.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted/60">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: agent?.color || 'var(--subtle-foreground)' }}
                  aria-hidden="true"
                />
                {conv.is_archived ? (
                  <div className="min-w-0 flex-1 py-1">
                    <p className="truncate text-sm text-muted-foreground">{conv.title || agentName} (Archived)</p>
                  </div>
                ) : (
                  <Link
                    href={href as never}
                    className="min-w-0 flex-1 rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <p className="truncate text-sm font-medium text-foreground">{conv.title || agentName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {agentName} · {formatRelativeTime(conv.last_activity_at)}
                    </p>
                  </Link>
                )}

                {confirming ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(null);
                        onDelete(conv.id);
                      }}
                      className="rounded-md bg-critical-soft px-2 py-1 text-xs font-medium text-critical outline-none hover:bg-critical/15 focus-visible:ring-2 focus-visible:ring-critical/40"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Delete chat ${conv.title || agentName}`}
                    onClick={() => setConfirmId(conv.id)}
                    disabled={deletingId === conv.id}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-subtle-foreground opacity-100 outline-none transition-opacity hover:bg-critical-soft hover:text-critical focus-visible:ring-2 focus-visible:ring-ring/60 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    {deletingId === conv.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
});
