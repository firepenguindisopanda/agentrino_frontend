import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface OracleOption {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  effort: string;
  recommended: boolean;
}

export interface OracleAnalysisState {
  bottomLine: string;
  options: OracleOption[];
  actionPlan: string[];
  watchOutFor: string[];
  isLoading: boolean;
  error: string | null;
  hasSubmitted: boolean;
}

const initialState: OracleAnalysisState = {
  bottomLine: '',
  options: [],
  actionPlan: [],
  watchOutFor: [],
  isLoading: false,
  error: null,
  hasSubmitted: false,
};

const oracleSlice = createSlice({
  name: 'oracle',
  initialState,
  reducers: {
    startAnalysis(state) {
      state.isLoading = true;
      state.error = null;
    },
    setAnalysisResult(
      state,
      action: PayloadAction<{
        bottomLine: string;
        options: OracleOption[];
        actionPlan: string[];
        watchOutFor: string[];
      }>
    ) {
      state.bottomLine = action.payload.bottomLine;
      state.options = action.payload.options;
      state.actionPlan = action.payload.actionPlan;
      state.watchOutFor = action.payload.watchOutFor;
      state.isLoading = false;
      state.hasSubmitted = true;
      state.error = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearAnalysis(state) {
      state.bottomLine = '';
      state.options = [];
      state.actionPlan = [];
      state.watchOutFor = [];
      state.isLoading = false;
      state.error = null;
      state.hasSubmitted = false;
    },
  },
});

export const { startAnalysis, setAnalysisResult, setError, clearAnalysis } =
  oracleSlice.actions;
export default oracleSlice.reducer;
