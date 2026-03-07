'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOracleChat } from '@/components/hooks/useOracleChat';
import { ComparativeAnalysis } from '@/components/oracle/ComparativeAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Gem, RotateCcw, MessageSquare, ArrowRight, Info } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  {
    title: 'Architecture Decision',
    question: 'Should I use microservices or a monolith for my new SaaS application?',
  },
  {
    title: 'Tech Stack',
    question: 'What database should I use for a real-time chat application with millions of users?',
  },
  {
    title: 'Code Review',
    question: 'I have a complex refactoring task. What approach would minimize risk while improving code quality?',
  },
];

export default function OraclePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const {
    bottomLine,
    options,
    actionPlan,
    watchOutFor,
    isLoading,
    error,
    hasSubmitted,
    followUpMode,
    submitQuestion,
    askFollowUp,
    reset,
  } = useOracleChat();

  // Focus textarea on load
  useEffect(() => {
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    if (followUpMode) {
      await askFollowUp(question);
    } else {
      await submitQuestion(question);
    }
    setQuestion('');
  };

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background dark:bg-[var(--ac-dark-bg)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border dark:border-[var(--ac-border-color)] bg-card dark:bg-[var(--ac-card-bg)]">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* simple solid icon container, no glow */}
            <div className="relative bg-[var(--ac-primary-blue)] p-2.5 rounded-xl">
              <Gem className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-card-foreground dark:text-[var(--ac-text-primary)]">
              Oracle
            </h1>
            <p className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">
              Strategic Technical Advisor
            </p>
          </div>
          
          {hasSubmitted && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Analysis
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Input - Always visible until analysis is shown */}
          {!hasSubmitted && (
            <Card className="p-4 space-y-4">
              <div>
                <label
                  htmlFor="oracle-question"
                  className="text-sm font-medium text-card-foreground dark:text-[var(--ac-text-primary)] mb-2 block"
                >
                  Describe your challenge
                </label>
                <textarea
                  id="oracle-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    followUpMode
                      ? 'Ask a follow-up question...'
                      : 'Describe your architecture challenge, technical problem, or decision you\'re facing. For example: "Should I use microservices or a monolith for my new SaaS application?"'
                  }
                  className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ac-primary-blue)] focus:border-transparent dark:bg-[var(--ac-input-bg)] dark:border-[var(--ac-input-border)] dark:text-[var(--ac-text-primary)] dark:placeholder:text-[var(--ac-text-secondary)]"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                  <Info className="w-4 h-4" />
                  <span>Press Enter to submit, Shift+Enter for new line</span>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className="bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)] text-white gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Gem className="w-4 h-4" />
                      Get Analysis
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Example Questions - Shown before submission */}
          {!hasSubmitted && !question && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)] text-center">
                Or try one of these examples:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EXAMPLE_QUESTIONS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example.question)}
                    className="p-4 text-left rounded-lg border border-border dark:border-[var(--ac-border-color)] bg-card dark:bg-[var(--ac-card-bg)] hover:border-[var(--ac-primary-blue)]/50 hover:bg-[var(--ac-primary-blue)]/5 transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-[var(--ac-primary-blue)]" />
                      <span className="text-sm font-medium text-card-foreground dark:text-[var(--ac-text-primary)]">
                        {example.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-[var(--ac-text-secondary)] line-clamp-2">
                      {example.question}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Input - Shown after initial analysis */}
          {hasSubmitted && (
            <Card className="p-4">
              <div className="flex gap-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 min-h-[60px] p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ac-primary-blue)] focus:border-transparent dark:bg-[var(--ac-input-bg)] dark:border-[var(--ac-input-border)] dark:text-[var(--ac-text-primary)] dark:placeholder:text-[var(--ac-text-secondary)]"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className="bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)] text-white self-end gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-6 animate-pulse">
              {/* Hero skeleton */}
              <div className="rounded-xl p-6 border border-[var(--ac-primary-blue)]/20 bg-[var(--ac-primary-blue)]/5">
                <div className="h-4 w-32 bg-[var(--ac-primary-blue)]/20 rounded mb-3" />
                <div className="h-5 w-full bg-muted rounded mb-2" />
                <div className="h-5 w-3/4 bg-muted rounded" />
              </div>

              {/* 4-card grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border dark:border-[var(--ac-border-color)] p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-muted" />
                      <div className="h-5 w-40 bg-muted rounded" />
                    </div>
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="h-6 w-24 bg-muted rounded-md" />
                  </div>
                ))}
              </div>

              {/* Action plan skeleton */}
              <div className="rounded-lg border border-border dark:border-[var(--ac-border-color)] p-5 space-y-3">
                <div className="h-5 w-28 bg-muted rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-[var(--ac-primary-blue)]/20" />
                    <div className="h-4 flex-1 bg-muted rounded" />
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)] text-center">
                Oracle is analyzing your question...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="mt-3"
              >
                Try Again
              </Button>
            </Card>
          )}

          {/* Results - Comparative Analysis */}
          {hasSubmitted && !isLoading && !error && options.length > 0 && (
            <ComparativeAnalysis
              bottomLine={bottomLine}
              options={options}
              actionPlan={actionPlan}
              watchOutFor={watchOutFor}
            />
          )}

          {/* Empty State - No options returned */}
          {hasSubmitted && !isLoading && !error && options.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                No analysis results returned. Please try rephrasing your question.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
