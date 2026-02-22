import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isStreaming?: boolean;
  usedRag?: boolean;
  ragDocsCount?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamingId: string | null;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  currentStreamingId: null,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
      state.isStreaming = false;
      state.currentStreamingId = null;
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateStreamingMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const message = state.messages.find(m => m.id === action.payload.id);
      if (message) {
        message.content += action.payload.content;
      }
    },
    finalizeStreamingMessage: (state, action: PayloadAction<string>) => {
      const message = state.messages.find(m => m.id === action.payload);
      if (message) {
        message.isStreaming = false;
      }
      state.isStreaming = false;
      state.currentStreamingId = null;
    },
    setMessageRagMetadata: (state, action: PayloadAction<{ id: string; usedRag: boolean; ragDocsCount: number }>) => {
      const message = state.messages.find(m => m.id === action.payload.id);
      if (message) {
        message.usedRag = action.payload.usedRag;
        message.ragDocsCount = action.payload.ragDocsCount;
      }
    },
    startStreaming: (state, action: PayloadAction<string>) => {
      state.isStreaming = true;
      state.currentStreamingId = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isStreaming = false;
      state.currentStreamingId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.isStreaming = false;
      state.currentStreamingId = null;
      state.error = null;
    },
  },
});

export const {
  setMessages,
  addMessage,
  updateStreamingMessage,
  finalizeStreamingMessage,
  startStreaming,
  setError,
  clearError,
  clearMessages,
  setMessageRagMetadata,
} = chatSlice.actions;

export default chatSlice.reducer;
