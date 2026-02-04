import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  isLoading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
}

const initialState: UiState = {
  isLoading: false,
  connectionStatus: 'disconnected',
  theme: 'system',
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<UiState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    setTheme: (state, action: PayloadAction<UiState['theme']>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setLoading,
  setConnectionStatus,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer;