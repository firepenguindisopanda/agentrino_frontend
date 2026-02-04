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
      <div className="h-full flex items-center justify-center bg-[var(--ac-dark-void)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--ac-electric-violet)] rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="w-12 h-12 text-[var(--ac-electric-violet)] animate-spin relative" />
          </div>
          <span className="text-[var(--ac-silver-mist)] text-sm">Loading agents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--ac-dark-void)] p-4">
        <div className="text-xl text-[var(--ac-error)] mb-4">{error}</div>
        <Button onClick={loadAgents} variant="outline" className="border-[var(--ac-electric-violet)] text-[var(--ac-electric-violet)] hover:bg-[var(--ac-electric-violet)]/10">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ac-dark-void)]">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--ac-electric-violet)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--ac-neon-magenta)]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--ac-cyber-cyan)]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pb-20">
        {/* Hero Section */}
        <header className="text-center mb-16 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ac-card-bg)] border border-[var(--ac-card-border)] mb-6">
            <Sparkles className="w-4 h-4 text-[var(--ac-neon-magenta)]" />
            <span className="text-sm text-[var(--ac-silver-mist)]">Powered by AI</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-[var(--ac-pure-white)]">
              Choose Your
            </span>
            <br />
            <span className="text-[var(--ac-electric-violet)]">
              AI Agent
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--ac-slate-gray)] max-w-2xl mx-auto leading-relaxed">
            Each agent specializes in different areas. Select one to start a conversation 
            tailored to your needs.
          </p>
        </header>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <Card 
              key={agent.id} 
              className="group relative bg-[var(--ac-card-bg)] backdrop-blur-xl border-[var(--ac-card-border)] hover:border-[var(--ac-card-hover-border)] transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--ac-electric-violet)]/20 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-[var(--ac-electric-violet)]/0 group-hover:bg-[var(--ac-electric-violet)]/5 transition-all duration-500" />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  {/* Agent Avatar */}
                  <div className="relative">
                    <div 
                      className="absolute inset-0 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
                      style={{ backgroundColor: agent.color || '#8b5cf6' }}
                    />
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: agent.color || '#8b5cf6' }}
                    >
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  
                  <MessageSquare className="w-5 h-5 text-[var(--ac-slate-gray)] group-hover:text-[var(--ac-electric-violet)] transition-colors duration-300" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-[var(--ac-pure-white)] mb-2 group-hover:text-[var(--ac-glow-purple)] transition-colors">
                  {agent.name}
                </CardTitle>
                
                <CardDescription className="text-[var(--ac-slate-gray)] line-clamp-3 leading-relaxed">
                  {agent.description || 'Ready to assist you with specialized knowledge and expertise.'}
                </CardDescription>
              </CardHeader>
              
              <CardFooter className="relative pt-0">
                <Button
                  className="w-full relative overflow-hidden bg-[var(--ac-electric-violet)] hover:bg-[var(--ac-glow-purple)] text-white font-semibold shadow-lg shadow-[var(--ac-electric-violet)]/25 transition-all duration-300 group/btn"
                  onClick={() => handleStartChat(agent)}
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--ac-card-bg)] border border-[var(--ac-card-border)] mb-6">
              <Bot className="w-10 h-10 text-[var(--ac-slate-gray)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--ac-pure-white)] mb-2">No Agents Available</h3>
            <p className="text-[var(--ac-slate-gray)]">Check back later or contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}
