import { apiClient } from './apiConfig';
import { parseStream, type StreamOptions } from './streamParser';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  color: string | null;
  icon: string | null;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Fetch list of available agents
 */
export async function getAgents(): Promise<Agent[]> {
  const response = await apiClient.get<Agent[]>('/agents');
  return response.data;
}

/**
 * Create a new conversation with an agent
 */
export async function createConversation(agentId: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/conversations', {
    agent_id: agentId,
  });
  return response.data;
}

/**
 * Fetch messages for a conversation
 */
export async function getMessages(conversationId: string, limit = 50): Promise<Message[]> {
  const response = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`, {
    params: { limit },
  });
  return response.data;
}

/**
 * Fetch a conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  const response = await apiClient.get<Conversation>(`/conversations/${conversationId}`);
  return response.data;
}

/**
 * Send a streaming chat message
 */
export async function sendStreamingChatMessage(
  agentId: string,
  conversationId: string,
  message: string,
  options: StreamOptions
): Promise<void> {
  try {
    const response = await fetch(
      `${apiClient.defaults.baseURL}/agents/${agentId}/conversations/${conversationId}/stream?stream=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ content: message }),
        signal: options.signal,
      }
    );

    await parseStream(response, options);
  } catch (error) {
    console.error('Streaming chat request failed:', error);
    options.onError?.(error as Error);
  }
}

/**
 * Test connection to the chat endpoint
 */
export async function testConnection(): Promise<boolean> {
  try {
    await apiClient.get('/agents'); 
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
