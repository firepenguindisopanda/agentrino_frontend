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
  session_id: string;
  title: string | null;
  is_archived: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
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
export async function createConversation(agentId: string, sessionId: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/conversations', {
    agent_id: agentId,
    session_id: sessionId,
  });
  return response.data;
}

/**
 * Get existing conversation or create new one for session + agent
 */
export async function getOrCreateConversation(agentId: string, sessionId: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/conversations/get-or-create', {
    agent_id: agentId,
    session_id: sessionId,
  });
  return response.data;
}

/**
 * List all conversations for a session
 */
export async function listConversations(sessionId: string, includeArchived = false): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/conversations', {
    params: { session_id: sessionId, include_archived: includeArchived },
  });
  return response.data;
}

/**
 * Archive a conversation (soft delete)
 */
export async function archiveConversation(conversationId: string): Promise<Conversation> {
  const response = await apiClient.patch<Conversation>(`/conversations/${conversationId}/archive`);
  return response.data;
}

/**
 * Permanently delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const response = await apiClient.delete<{ deleted: boolean }>(`/conversations/${conversationId}`);
  return response.data.deleted;
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
