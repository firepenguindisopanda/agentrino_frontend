'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import type { AppDispatch, RootState } from '@/store';
import { getConversation, getMessages, sendStreamingChatMessage } from '@/services/chatService';
import {
  addMessage,
  setMessages,
  updateStreamingMessage,
  finalizeStreamingMessage,
  startStreaming,
  setError,
  clearError,
  clearMessages,
  setMessageRagMetadata,
  type ChatMessage,
} from '@/store/slices/chatSlice';
import { setLoading, setConnectionStatus } from '@/store/slices/uiSlice';

export function useChat() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const agentId = searchParams.get('agentId');
  const agentName = searchParams.get('agentName');

  const { messages, isStreaming, error, currentStreamingId } = useSelector((state: RootState) => state.chat);
  const { connectionStatus } = useSelector((state: RootState) => state.ui);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!conversationId || !agentId) {
      const errorMsg = 'Missing conversation or agent ID. Please start from the home page.';
      toast.error(errorMsg);
      dispatch(setError(errorMsg));
      dispatch(setConnectionStatus('error'));
      return;
    }

    let isMounted = true;

    const loadConversation = async () => {
      dispatch(setLoading(true));
      dispatch(setConnectionStatus('connecting'));
      dispatch(clearError());
      try {
        await getConversation(conversationId);
        const messageList = await getMessages(conversationId, 50);
        if (!isMounted) return;

        const mappedMessages = messageList
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((message) => ({
            id: message.id,
            content: message.content,
            role: message.role,
            timestamp: message.created_at,
          }));

        dispatch(setMessages(mappedMessages));
        dispatch(setConnectionStatus('connected'));
      } catch (err) {
        if (!isMounted) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        const errorMessage = err instanceof Error ? err.message : 'Unable to load conversation.';
        if (status === 404) {
          toast.error('Conversation not found. Returning to home.');
          router.push('/');
        } else {
          toast.error(errorMessage);
        }
        dispatch(setError(errorMessage));
        dispatch(setConnectionStatus('error'));
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
        }
      }
    };

    loadConversation();

    return () => {
      isMounted = false;
    };
  }, [conversationId, agentId, dispatch, router]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;
    
    if (!conversationId || !agentId) {
      const errorMsg = 'Missing conversation or agent ID. Please start from the home page.';
      toast.error(errorMsg);
      dispatch(setError(errorMsg));
      return;
    }

    const messageId = uuidv4();

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    dispatch(addMessage(userMessage));

    // Clear input and errors
    setInputValue('');
    dispatch(clearError());
    dispatch(setLoading(true));
    dispatch(setConnectionStatus('connecting'));

    // Create streaming message
    const streamingMessage: ChatMessage = {
      id: messageId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    dispatch(addMessage(streamingMessage));
    dispatch(startStreaming(messageId));

    // Cancel any existing request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Batch small deltas to reduce re-renders and make typing smooth
    const pendingBuffer = { buf: '' };
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const flushBuffer = () => {
      if (pendingBuffer.buf) {
        dispatch(updateStreamingMessage({ id: messageId, content: pendingBuffer.buf }));
        pendingBuffer.buf = '';
      }
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    };

    try {
      await sendStreamingChatMessage(
        agentId,
        conversationId,
        message,
        {
        signal: controller.signal,
        onDelta: (chunk) => {
        // Accumulate into buffer and flush every ~40ms or when large
        pendingBuffer.buf += chunk;
        if (!pendingTimer) {
          pendingTimer = setTimeout(() => {
            flushBuffer();
          }, 40);
        }
        // If buffer grows big, flush immediately
        if (pendingBuffer.buf.length > 128) {
            flushBuffer();
          }
        },
        onDone: (ragMetadata) => {
          flushBuffer();
          dispatch(finalizeStreamingMessage(messageId));
          
          if (ragMetadata?.rag_used) {
            dispatch(setMessageRagMetadata({
              id: messageId,
              usedRag: ragMetadata.rag_used,
              ragDocsCount: ragMetadata.rag_docs_count,
            }));
          }
          
          dispatch(setLoading(false));
          dispatch(setConnectionStatus('connected'));
        },
        onError: (err) => {
          // flush and then handle error
          flushBuffer();

          const messageText = err?.message ?? 'An unexpected error occurred';
          // Friendly toast for network errors
          if (messageText.includes('Failed to fetch') || messageText.includes('NetworkError')) {
            const base = process.env.NEXT_PUBLIC_API_URL || 'the API';
            toast.error(`Unable to reach ${base}. Is the backend running?`);
          } else {
            toast.error(messageText);
          }

          dispatch(setError(messageText));
          dispatch(finalizeStreamingMessage(messageId));
          dispatch(setLoading(false));
          dispatch(setConnectionStatus('error'));
        },
      });
    } catch (err) {
      // flush pending chunks
      flushBuffer();

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        const base = process.env.NEXT_PUBLIC_API_URL || 'the API';
        toast.error(`Unable to reach ${base}. Please start the backend and try again.`);
      } else {
        toast.error(errorMessage);
      }

      dispatch(setError(errorMessage));
      dispatch(finalizeStreamingMessage(messageId));
      dispatch(setLoading(false));
      dispatch(setConnectionStatus('disconnected'));
    }
  }, [dispatch, isStreaming, conversationId, agentId]);

  const cancelStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch(setLoading(false));
    dispatch(setConnectionStatus('connected'));
    if (currentStreamingId) {
      dispatch(finalizeStreamingMessage(currentStreamingId));
    }
  }, [dispatch, currentStreamingId]);

  const clearChat = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch(clearMessages());
    dispatch(clearError());
    dispatch(setLoading(false));
    dispatch(setConnectionStatus('disconnected'));
  }, [dispatch]);

  return {
    messages,
    isStreaming,
    error,
    connectionStatus,
    inputValue,
    setInputValue,
    sendMessage,
    cancelStreaming,
    clearChat,
    agentName,
  };
}
