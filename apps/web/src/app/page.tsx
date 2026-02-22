'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAgents, getOrCreateConversation, listConversations, deleteConversation, type Agent, type Conversation } from '@/services/chatService';
import { getSessionId } from '@/lib/session';
import { Loader2, MessageSquare, ArrowRight, Bot, Sparkles, Trash2, FolderOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MAX_CONVERSATIONS = 10;

export default function Home() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sessionId = getSessionId();
      const [agentsData, conversationsData] = await Promise.all([
        getAgents(),
        listConversations(sessionId, true),
      ]);
      setAgents(agentsData);
      setConversations(conversationsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (agent: Agent) => {
    try {
      setStartingChat(agent.id);
      const sessionId = getSessionId();
      const conversation = await getOrCreateConversation(agent.id, sessionId);
      router.push(`/chat?conversationId=${conversation.id}&agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start chat';
      toast.error(errorMessage);
      if (errorMessage.includes('Maximum')) {
        setManageDialogOpen(true);
      }
    } finally {
      setStartingChat(null);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      setDeletingId(conversationId);
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      toast.success('Chat deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chat');
    } finally {
      setDeletingId(null);
    }
  };

  const getConversationForAgent = (agentId: string) => {
    return conversations.find((c) => c.agent_id === agentId && !c.is_archived);
  };

  const activeCount = conversations.filter((c) => !c.is_archived).length;
  const isAtLimit = activeCount >= MAX_CONVERSATIONS;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background dark:bg-[var(--ac-dark-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--ac-primary-blue)] rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="w-12 h-12 text-[var(--ac-primary-blue)] animate-spin relative" />
          </div>
          <span className="text-[var(--ac-text-secondary)] text-sm dark:text-[var(--ac-text-secondary)]">Loading agents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background dark:bg-[var(--ac-dark-bg)] p-4">
        <div className="text-xl text-[var(--ac-error)] mb-4">{error}</div>
        <Button onClick={loadData} variant="outline" className="border-[var(--ac-primary-blue)] text-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-blue)]/10">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background dark:bg-[var(--ac-dark-bg)]">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pb-20">
        {/* Hero Section */}
        <header className="text-center mb-16 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border dark:bg-[var(--ac-card-bg)] dark:border-[var(--ac-border-color)] mb-6">
            <Sparkles className="w-4 h-4 text-[var(--ac-primary-blue)]" />
            <span className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">Powered by AI</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-foreground dark:text-[var(--ac-text-primary)]">
              Choose Your
            </span>
            <br />
            <span className="text-[var(--ac-primary-blue)]">
              AI Agent
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground dark:text-[var(--ac-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Each agent specializes in different areas. Select one to start a conversation 
            tailored to your needs.
          </p>
        </header>

        {/* Manage Chats Button */}
        {conversations.length > 0 && (
          <div className="flex justify-center mb-8">
            <Button 
              variant="outline" 
              className="border-[var(--ac-border-color)] dark:border-[var(--ac-border-color)]"
              onClick={() => setManageDialogOpen(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage Chats ({activeCount}/{MAX_CONVERSATIONS})
            </Button>
          </div>
        )}

        {/* Manage Chats Modal */}
        {manageDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setManageDialogOpen(false)}
            />
            <div className="relative z-10 w-full max-w-[500px] bg-background dark:bg-[var(--ac-card-bg)] border border-border dark:border-[var(--ac-border-color)] rounded-lg shadow-lg p-6">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Manage Your Chats</h2>
                <p className="text-sm text-muted-foreground">
                  You have {activeCount} active chat{activeCount !== 1 ? 's' : ''}. Delete old chats to start new ones.
                </p>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No chats yet</p>
                ) : (
                  conversations.map((conv) => {
                    const agent = agents.find((a) => a.id === conv.agent_id);
                    return (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card dark:bg-[var(--ac-card-bg)] border border-border dark:border-[var(--ac-border-color)]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {agent?.name || 'Unknown Agent'}
                            {conv.is_archived && <span className="text-muted-foreground text-sm ml-2">(Archived)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last activity: {new Date(conv.last_activity_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConversation(conv.id)}
                          disabled={deletingId === conv.id}
                          className="text-muted-foreground hover:text-[var(--ac-error)]"
                        >
                          {deletingId === conv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => {
            const existingConv = getConversationForAgent(agent.id);
            return (
              <Card 
                key={agent.id} 
                className="group relative bg-card dark:bg-[var(--ac-card-bg)] backdrop-blur-xl border-border dark:border-[var(--ac-border-color)] hover:border-[var(--ac-primary-blue)] dark:hover:border-[var(--ac-primary-blue)] transition-all duration-300 hover:shadow-xl dark:hover:shadow-[var(--ac-primary-blue)]/20 overflow-hidden cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleStartChat(agent)}
              >
                {/* Hover Glow - dark mode only */}
                <div className="absolute inset-0 bg-[var(--ac-primary-blue)]/0 dark:group-hover:bg-[var(--ac-primary-blue)]/5 transition-all duration-300" />
                
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-4">
                    {/* Agent Avatar */}
                    <div className="relative">
                      <div 
                        className="absolute inset-0 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:block hidden"
                        style={{ backgroundColor: agent.color || '#2563eb' }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: agent.color || '#2563eb' }}
                      >
                        <Bot className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    
                    <MessageSquare className="w-5 h-5 text-muted-foreground dark:text-[var(--ac-text-secondary)] group-hover:text-[var(--ac-primary-blue)] transition-colors duration-300" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-card-foreground dark:text-[var(--ac-text-primary)] mb-2 group-hover:text-[var(--ac-primary-blue)] transition-colors">
                    {agent.name}
                  </CardTitle>
                  
                  <CardDescription className="text-muted-foreground dark:text-[var(--ac-text-secondary)] line-clamp-3 leading-relaxed">
                    {agent.description || 'Ready to assist you with specialized knowledge and expertise.'}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="relative pt-0">
                  <Button
                    className="w-full relative overflow-hidden bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)] text-white font-semibold shadow-lg transition-all duration-300 group/btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(agent);
                    }}
                    disabled={startingChat !== null}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {startingChat === agent.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting...
                        </>
                      ) : existingConv ? (
                        <>
                          Continue Chat
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      ) : isAtLimit ? (
                        <>
                          Limit Reached
                        </>
                      ) : (
                        <>
                          Start Chat
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {agents.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border border-border dark:bg-[var(--ac-card-bg)] dark:border-[var(--ac-border-color)] mb-6">
              <Bot className="w-10 h-10 text-muted-foreground dark:text-[var(--ac-text-secondary)]" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground dark:text-[var(--ac-text-primary)] mb-2">No Agents Available</h3>
            <p className="text-muted-foreground dark:text-[var(--ac-text-secondary)]">Check back later or contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}
