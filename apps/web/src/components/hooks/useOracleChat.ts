'use client';

import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import type { AppDispatch, RootState } from '@/store';
import { analyzeWithOracle, type OracleAnalysisResponse } from '@/services/chatService';
import {
  startAnalysis,
  setAnalysisResult,
  setError,
  clearAnalysis,
} from '@/store/slices/oracleSlice';

const ORACLE_TIMEOUT_MS = 60_000;

export function useOracleChat() {
  const dispatch = useDispatch<AppDispatch>();
  const { bottomLine, options, actionPlan, watchOutFor, isLoading, error, hasSubmitted } =
    useSelector((state: RootState) => state.oracle);
  const [followUpMode, setFollowUpMode] = useState(false);

  // Context for follow-up questions
  const lastQuestionRef = useRef<string>('');
  const lastBottomLineRef = useRef<string>('');

  // AbortController for cancellation
  const abortRef = useRef<AbortController | null>(null);

  const submitQuestion = useCallback(
    async (question: string, context?: string) => {
      if (!question.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Auto-timeout after 60s
      const timeoutId = setTimeout(() => controller.abort(), ORACLE_TIMEOUT_MS);

      dispatch(startAnalysis());

      try {
        const fullPrompt = context
          ? `${context}\n\n---\n\nUser Question: ${question}`
          : question;

        const response: OracleAnalysisResponse = await analyzeWithOracle(fullPrompt, controller.signal);

        dispatch(
          setAnalysisResult({
            bottomLine: response.bottom_line,
            options: response.options,
            actionPlan: response.action_plan,
            watchOutFor: response.watch_out_for || [],
          })
        );

        // Store context for follow-ups
        lastQuestionRef.current = question;
        lastBottomLineRef.current = response.bottom_line;
        setFollowUpMode(true);
      } catch (err) {
        if (controller.signal.aborted) {
          dispatch(setError('Request timed out or was cancelled.'));
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [dispatch]
  );

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      // Build context from the prior exchange
      const priorContext = [
        `Previous question: ${lastQuestionRef.current}`,
        `Previous recommendation: ${lastBottomLineRef.current}`,
      ].join('\n');

      await submitQuestion(question, priorContext);
    },
    [submitQuestion]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch(clearAnalysis());
    setFollowUpMode(false);
    lastQuestionRef.current = '';
    lastBottomLineRef.current = '';
  }, [dispatch]);

  return {
    // State
    bottomLine,
    options,
    actionPlan,
    watchOutFor,
    isLoading,
    error,
    hasSubmitted,
    followUpMode,

    // Actions
    submitQuestion,
    askFollowUp,
    cancel,
    reset,
  };
}
