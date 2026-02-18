'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAgents, createConversation, type Agent } from '@/services/chatService';
import { Loader2, MessageSquare, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load agents. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (agent: Agent) => {
    try {
      setStartingChat(agent.id);
      const conversation = await createConversation(agent.id);
      router.push(`/chat?conversationId=${conversation.id}&agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChat(null);
    }
  };

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
        <Button onClick={loadAgents} variant="outline" className="border-[var(--ac-primary-blue)] text-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-blue)]/10">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background dark:bg-[var(--ac-dark-bg)]">
      {/* Animated Background Elements - Dark mode only */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--ac-primary-blue)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--ac-accent-blue)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--ac-primary-blue)]/10 rounded-full blur-3xl" />
      </div>

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

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
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
          ))}
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
